const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const StockLevel = require('../models/StockLevel');
const StockMove = require('../models/StockMove');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

// Helper to pad numbers: e.g. 1 -> 00001
const padNum = (num, size = 5) => String(num).padStart(size, '0');

// @desc    Get all deliveries + stats breakdown
// @route   GET /api/deliveries
// @access  Private
const getDeliveries = async (req, res) => {
  try {
    const { status, warehouse, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { deliveryTo: { $regex: search, $options: 'i' } },
      ];
    }

    const deliveries = await Delivery.find(filter)
      .populate('responsible', 'loginId')
      .populate('sourceLocation', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .populate('lineItems.product', 'name sku uom costPrice')
      .sort({ createdAt: -1 });

    // Aggregated stats
    const statsArray = await Delivery.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = {
      Draft: 0,
      Waiting: 0,
      Ready: 0,
      Done: 0,
      Cancelled: 0,
    };
    statsArray.forEach((s) => {
      if (stats[s._id] !== undefined) stats[s._id] = s.count;
    });

    res.json({ success: true, count: deliveries.length, stats, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single delivery by ID
// @route   GET /api/deliveries/:id
// @access  Private
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('responsible', 'loginId')
      .populate('sourceLocation', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .populate('lineItems.product', 'name sku uom costPrice');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new delivery order
// @route   POST /api/deliveries
// @access  Private
const createDelivery = async (req, res) => {
  try {
    const { deliveryTo, scheduleDate, sourceLocation, warehouse, lineItems } = req.body;

    // Validate warehouse
    let targetWh = warehouse;
    if (!targetWh) {
      const defaultWh = await Warehouse.findOne({ isDefault: true }) || await Warehouse.findOne();
      if (!defaultWh) {
        return res.status(400).json({ success: false, message: 'No warehouse configured' });
      }
      targetWh = defaultWh._id;
    }

    // Validate source location
    let targetLoc = sourceLocation;
    if (!targetLoc) {
      const internalLoc = await Location.findOne({ warehouse: targetWh, type: 'Internal' })
        || await Location.findOne({ warehouse: targetWh });
      if (!internalLoc) {
        return res.status(400).json({ success: false, message: 'No source location available for warehouse' });
      }
      targetLoc = internalLoc._id;
    }

    // Sequence num for reference WH/OUT/0000X
    const count = await Delivery.countDocuments({ warehouse: targetWh });
    const seq = count + 1;
    const whObj = await Warehouse.findById(targetWh);
    const prefix = whObj ? whObj.shortCode : 'WH';
    const reference = `${prefix}/OUT/${padNum(seq)}`;

    const delivery = await Delivery.create({
      reference,
      sequenceNum: seq,
      deliveryTo: deliveryTo || '',
      scheduleDate: scheduleDate || new Date(),
      responsible: req.user._id,
      sourceLocation: targetLoc,
      warehouse: targetWh,
      status: 'Draft',
      lineItems: (lineItems || []).map((li) => ({
        product: li.product,
        demand: li.demand || li.quantity || 1,
        reserved: 0,
        done: 0,
      })),
    });

    await delivery.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'sourceLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery order (if Draft/Waiting)
// @route   PUT /api/deliveries/:id
// @access  Private
const updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }
    if (['Done', 'Cancelled'].includes(delivery.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a completed or cancelled delivery' });
    }

    const { deliveryTo, scheduleDate, sourceLocation, lineItems } = req.body;
    if (deliveryTo !== undefined) delivery.deliveryTo = deliveryTo;
    if (scheduleDate !== undefined) delivery.scheduleDate = scheduleDate;
    if (sourceLocation !== undefined) delivery.sourceLocation = sourceLocation;

    if (lineItems !== undefined) {
      // If lineItems change, reset reserved stock if currently reserved
      if (delivery.status === 'Ready' || delivery.status === 'Waiting') {
        // Release previous reservations first
        for (const oldItem of delivery.lineItems) {
          if (oldItem.reserved > 0) {
            await StockLevel.findOneAndUpdate(
              { product: oldItem.product, location: delivery.sourceLocation },
              { $inc: { quantityReserved: -oldItem.reserved } }
            );
          }
        }
        delivery.status = 'Draft';
      }

      delivery.lineItems = lineItems.map((li) => ({
        product: li.product,
        demand: li.demand || li.quantity || 1,
        reserved: 0,
        done: 0,
      }));
    }

    await delivery.save();
    await delivery.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'sourceLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check Availability / Reserve Stock
// @route   PUT /api/deliveries/:id/reserve
// @access  Private
const reserveStock = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }
    if (['Done', 'Cancelled'].includes(delivery.status)) {
      return res.status(400).json({ success: false, message: 'Delivery order is finalized' });
    }

    if (!delivery.lineItems || delivery.lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one line item before checking availability' });
    }

    let allFullyReserved = true;

    for (const item of delivery.lineItems) {
      const stock = await StockLevel.findOne({
        product: item.product,
        location: delivery.sourceLocation,
      });

      const currentlyOnHand = stock ? stock.quantityOnHand : 0;
      const currentlyReserved = stock ? stock.quantityReserved : 0;

      // Available free = onHand - (reserved - currentItemReserved)
      const freeForThisItem = Math.max(0, currentlyOnHand - (currentlyReserved - item.reserved));
      const targetReserve = Math.min(item.demand, freeForThisItem);
      const diffReserve = targetReserve - item.reserved;

      if (diffReserve !== 0) {
        await StockLevel.findOneAndUpdate(
          { product: item.product, location: delivery.sourceLocation },
          {
            $inc: { quantityReserved: diffReserve },
            $setOnInsert: { warehouse: delivery.warehouse, quantityOnHand: 0 },
          },
          { upsert: true }
        );
        item.reserved = targetReserve;
      }

      if (item.reserved < item.demand) {
        allFullyReserved = false;
      }
    }

    delivery.status = allFullyReserved ? 'Ready' : 'Waiting';
    await delivery.save();

    await delivery.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'sourceLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    const message = allFullyReserved
      ? 'Stock reserved! Delivery is Ready for dispatch.'
      : 'Partial stock reserved. Order placed in Waiting state.';

    res.json({ success: true, data: delivery, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate Delivery (Dispatch out of warehouse)
// @route   PUT /api/deliveries/:id/validate
// @access  Private
const validateDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const delivery = await Delivery.findById(req.params.id).session(session);
    if (!delivery) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }

    if (delivery.status === 'Done') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Delivery is already validated and Done' });
    }
    if (delivery.status === 'Cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot validate a cancelled delivery' });
    }

    // Process each line item stock deduction
    for (const item of delivery.lineItems) {
      const deliveredQty = item.reserved > 0 ? item.reserved : item.demand;

      await StockLevel.findOneAndUpdate(
        { product: item.product, location: delivery.sourceLocation },
        {
          $inc: {
            quantityOnHand: -deliveredQty,
            quantityReserved: -item.reserved,
          },
        },
        { session }
      );

      item.done = deliveredQty;

      // Log to StockMove
      await StockMove.create(
        [
          {
            reference: delivery.reference,
            moveType: 'Delivery',
            product: item.product,
            fromLocation: delivery.sourceLocation,
            quantity: deliveredQty,
            responsible: req.user._id,
            notes: `Outgoing delivery ${delivery.reference}`,
          },
        ],
        { session }
      );
    }

    delivery.status = 'Done';
    delivery.validatedAt = new Date();
    await delivery.save({ session });
    await session.commitTransaction();

    await delivery.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'sourceLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: delivery, message: 'Delivery validated successfully! Stock deducted.' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Cancel Delivery
// @route   PUT /api/deliveries/:id/cancel
// @access  Private
const cancelDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery order not found' });
    }
    if (delivery.status === 'Done') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed delivery' });
    }

    // Release reserved quantities
    for (const item of delivery.lineItems) {
      if (item.reserved > 0) {
        await StockLevel.findOneAndUpdate(
          { product: item.product, location: delivery.sourceLocation },
          { $inc: { quantityReserved: -item.reserved } }
        );
        item.reserved = 0;
      }
    }

    delivery.status = 'Cancelled';
    delivery.cancelledAt = new Date();
    await delivery.save();

    await delivery.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'sourceLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: delivery, message: 'Delivery order cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  reserveStock,
  validateDelivery,
  cancelDelivery,
};
