const mongoose = require('mongoose');
const Adjustment = require('../models/Adjustment');
const StockLevel = require('../models/StockLevel');
const StockMove = require('../models/StockMove');
const Warehouse = require('../models/Warehouse');

const padNum = (num, size = 5) => String(num).padStart(size, '0');

// @desc    Get all stock adjustments
// @route   GET /api/adjustments
// @access  Private
const getAdjustments = async (req, res) => {
  try {
    const { status, warehouse, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (warehouse) filter.warehouse = warehouse;
    if (search) {
      filter.reference = { $regex: search, $options: 'i' };
    }

    const adjustments = await Adjustment.find(filter)
      .populate('responsible', 'loginId')
      .populate('product', 'name sku uom costPrice')
      .populate('location', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .sort({ createdAt: -1 });

    const statsArray = await Adjustment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = { Draft: 0, Done: 0, Cancelled: 0 };
    statsArray.forEach((s) => {
      if (stats[s._id] !== undefined) stats[s._id] = s.count;
    });

    res.json({ success: true, count: adjustments.length, stats, data: adjustments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system stock for product + location
// @route   GET /api/adjustments/stock-level
// @access  Private
const getSystemStock = async (req, res) => {
  try {
    const { product, location } = req.query;
    if (!product || !location) {
      return res.status(400).json({ success: false, message: 'Product and Location parameters are required' });
    }

    const stock = await StockLevel.findOne({ product, location });
    const recordedQuantity = stock ? stock.quantityOnHand : 0;

    res.json({ success: true, recordedQuantity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single adjustment by ID
// @route   GET /api/adjustments/:id
// @access  Private
const getAdjustmentById = async (req, res) => {
  try {
    const adjustment = await Adjustment.findById(req.params.id)
      .populate('responsible', 'loginId')
      .populate('product', 'name sku uom costPrice')
      .populate('location', 'name shortCode type')
      .populate('warehouse', 'name shortCode');

    if (!adjustment) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create stock adjustment
// @route   POST /api/adjustments
// @access  Private
const createAdjustment = async (req, res) => {
  try {
    const { product, location, countedQuantity, reason, warehouse } = req.body;

    if (!product || !location) {
      return res.status(400).json({ success: false, message: 'Product and Location are required' });
    }

    const stock = await StockLevel.findOne({ product, location });
    const recordedQuantity = stock ? stock.quantityOnHand : 0;
    const countQty = parseFloat(countedQuantity) || 0;
    const difference = countQty - recordedQuantity;

    let targetWh = warehouse;
    if (!targetWh) {
      targetWh = stock?.warehouse || (await Warehouse.findOne({ isDefault: true }))?._id;
    }

    const count = await Adjustment.countDocuments({ warehouse: targetWh });
    const seq = count + 1;
    const whObj = await Warehouse.findById(targetWh);
    const prefix = whObj ? whObj.shortCode : 'WH';
    const reference = `${prefix}/ADJ/${padNum(seq)}`;

    const adjustment = await Adjustment.create({
      reference,
      sequenceNum: seq,
      product,
      location,
      warehouse: targetWh,
      recordedQuantity,
      countedQuantity: countQty,
      difference,
      reason: reason || '',
      responsible: req.user._id,
      status: 'Draft',
    });

    await adjustment.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'product', select: 'name sku uom costPrice' },
      { path: 'location', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
    ]);

    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate Adjustment (Update stock & log to move ledger)
// @route   PUT /api/adjustments/:id/validate
// @access  Private
const validateAdjustment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustment = await Adjustment.findById(req.params.id).session(session);
    if (!adjustment) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjustment.status === 'Done') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Adjustment is already applied and Done' });
    }

    // Set stock to countedQuantity
    await StockLevel.findOneAndUpdate(
      { product: adjustment.product, location: adjustment.location },
      {
        $set: { quantityOnHand: adjustment.countedQuantity },
        $setOnInsert: { warehouse: adjustment.warehouse },
      },
      { upsert: true, session }
    );

    // Log to StockMove
    await StockMove.create(
      [
        {
          reference: adjustment.reference,
          moveType: 'Adjustment',
          product: adjustment.product,
          toLocation: adjustment.location,
          quantity: adjustment.difference,
          responsible: req.user._id,
          notes: adjustment.reason || `Stock adjustment ${adjustment.reference}`,
        },
      ],
      { session }
    );

    adjustment.status = 'Done';
    adjustment.validatedAt = new Date();
    await adjustment.save({ session });
    await session.commitTransaction();

    await adjustment.populate([
      { path: 'responsible', select: 'loginId' },
      { path: 'product', select: 'name sku uom costPrice' },
      { path: 'location', select: 'name shortCode type' },
      { path: 'warehouse', select: 'name shortCode' },
    ]);

    res.json({ success: true, data: adjustment, message: 'Stock adjustment validated successfully!' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getAdjustments,
  getSystemStock,
  getAdjustmentById,
  createAdjustment,
  validateAdjustment,
};
