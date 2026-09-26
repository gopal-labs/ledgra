const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');
const StockLevel = require('../models/StockLevel');
const StockMove = require('../models/StockMove');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

const padNum = (num, size = 5) => String(num).padStart(size, '0');

// @desc    Get all internal transfers
// @route   GET /api/transfers
// @access  Private
const getTransfers = async (req, res) => {
  try {
    const { status, warehouse, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (search) {
      filter.reference = { $regex: search, $options: 'i' };
    }

    const transfers = await Transfer.find(filter)
      .populate('responsible', 'loginId')
      .populate('fromLocation', 'name shortCode type')
      .populate('toLocation', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .populate('lineItems.product', 'name sku uom costPrice')
      .sort({ createdAt: -1 });

    const statsArray = await Transfer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = { Draft: 0, Ready: 0, Done: 0, Cancelled: 0 };
    statsArray.forEach((s) => {
      if (stats[s._id] !== undefined) stats[s._id] = s.count;
    });

    res.json({ success: true, count: transfers.length, stats, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single transfer by ID
// @route   GET /api/transfers/:id
// @access  Private
const getTransferById = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('responsible', 'loginId')
      .populate('fromLocation', 'name shortCode type')
      .populate('toLocation', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .populate('lineItems.product', 'name sku uom costPrice');

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Internal transfer not found' });
    }

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new internal transfer
// @route   POST /api/transfers
// @access  Private
const createTransfer = async (req, res) => {
  try {
    const { fromLocation, toLocation, scheduleDate, warehouse, lineItems } = req.body;

    if (!fromLocation || !toLocation) {
      return res.status(400).json({ success: false, message: 'Both source (From) and destination (To) locations are required' });
    }
    if (fromLocation.toString() === toLocation.toString()) {
      return res.status(400).json({ success: false, message: 'From and To locations cannot be the same' });
    }

    let targetWh = warehouse;
    if (!targetWh) {
      const loc = await Location.findById(fromLocation);
      targetWh = loc?.warehouse || (await Warehouse.findOne({ isDefault: true }))?._id;
    }

    const count = await Transfer.countDocuments({ warehouse: targetWh });
    const seq = count + 1;
    const whObj = await Warehouse.findById(targetWh);
    const prefix = whObj ? whObj.shortCode : 'WH';
    const reference = `${prefix}/INT/${padNum(seq)}`;

    const transfer = await Transfer.create({
      reference,
      sequenceNum: seq,
      fromLocation,
      toLocation,
      warehouse: targetWh,
      scheduleDate: scheduleDate || new Date(),
      responsible: req.user._id,
      status: 'Draft',
      lineItems: (lineItems || []).map((li) => ({
        product: li.product,
        quantity: li.quantity || 1,
        done: 0,
      })),
    });

    await transfer.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'fromLocation', select: 'name shortCode type' },
      { path: 'toLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update internal transfer (if Draft)
// @route   PUT /api/transfers/:id
// @access  Private
const updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (['Done', 'Cancelled'].includes(transfer.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a completed or cancelled transfer' });
    }

    const { fromLocation, toLocation, scheduleDate, lineItems } = req.body;
    if (fromLocation !== undefined) transfer.fromLocation = fromLocation;
    if (toLocation !== undefined) transfer.toLocation = toLocation;
    if (scheduleDate !== undefined) transfer.scheduleDate = scheduleDate;
    if (lineItems !== undefined) {
      transfer.lineItems = lineItems.map((li) => ({
        product: li.product,
        quantity: li.quantity || 1,
        done: 0,
      }));
    }

    await transfer.save();
    await transfer.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'fromLocation', select: 'name shortCode type' },
      { path: 'toLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate Transfer (Move stock from source location to destination location)
// @route   PUT /api/transfers/:id/validate
// @access  Private
const validateTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await Transfer.findById(req.params.id).session(session);
    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (transfer.status === 'Done') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Transfer is already validated and Done' });
    }
    if (transfer.status === 'Cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot validate a cancelled transfer' });
    }

    if (!transfer.lineItems || transfer.lineItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Add at least one product line item before validating' });
    }

    // Process line items: Decrement fromLocation, Increment toLocation
    for (const item of transfer.lineItems) {
      // 1. Decrement at fromLocation
      await StockLevel.findOneAndUpdate(
        { product: item.product, location: transfer.fromLocation },
        {
          $inc: { quantityOnHand: -item.quantity },
          $setOnInsert: { warehouse: transfer.warehouse },
        },
        { upsert: true, session }
      );

      // 2. Increment at toLocation
      await StockLevel.findOneAndUpdate(
        { product: item.product, location: transfer.toLocation },
        {
          $inc: { quantityOnHand: item.quantity },
          $setOnInsert: { warehouse: transfer.warehouse },
        },
        { upsert: true, session }
      );

      item.done = item.quantity;

      // 3. Log to StockMove collection
      await StockMove.create(
        [
          {
            reference: transfer.reference,
            moveType: 'Transfer',
            product: item.product,
            fromLocation: transfer.fromLocation,
            toLocation: transfer.toLocation,
            quantity: item.quantity,
            responsible: req.user._id,
            notes: `Internal transfer ${transfer.reference}`,
          },
        ],
        { session }
      );
    }

    transfer.status = 'Done';
    transfer.validatedAt = new Date();
    await transfer.save({ session });
    await session.commitTransaction();

    await transfer.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'fromLocation', select: 'name shortCode type' },
      { path: 'toLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: transfer, message: 'Internal transfer validated successfully! Stock moved.' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Cancel Transfer
// @route   PUT /api/transfers/:id/cancel
// @access  Private
const cancelTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }
    if (transfer.status === 'Done') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed transfer' });
    }

    transfer.status = 'Cancelled';
    transfer.cancelledAt = new Date();
    await transfer.save();

    await transfer.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'fromLocation', select: 'name shortCode type' },
      { path: 'toLocation', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
      { path: 'lineItems.product', select: 'name sku uom costPrice' },
    ]);

    res.json({ success: true, data: transfer, message: 'Transfer order cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
  cancelTransfer,
};
