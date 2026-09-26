const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const StockLevel = require('../models/StockLevel');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

/**
 * Generate next receipt reference: WH/IN/0001
 */
const generateReference = async (warehouseId) => {
  const wh = await Warehouse.findById(warehouseId);
  const code = wh ? wh.shortCode : 'WH';

  // Find the highest sequence for this warehouse
  const last = await Receipt.findOne({ warehouse: warehouseId }).sort({ sequenceNum: -1 });
  const seq = last ? last.sequenceNum + 1 : 1;
  const padded = String(seq).padStart(4, '0');
  return { reference: `${code}/IN/${padded}`, sequenceNum: seq };
};

// GET /api/receipts
const getReceipts = async (req, res) => {
  const { search, status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { receiveFrom: { $regex: search, $options: 'i' } },
    ];
  }

  const receipts = await Receipt.find(filter)
    .populate('responsible', 'loginId')
    .populate('destinationLocation', 'name shortCode')
    .populate('warehouse', 'name shortCode')
    .populate('lineItems.product', 'name sku')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Receipt.countDocuments(filter);
  res.json({ success: true, data: receipts, total });
};

// GET /api/receipts/:id
const getReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id)
    .populate('responsible', 'loginId email')
    .populate('destinationLocation', 'name shortCode')
    .populate('warehouse', 'name shortCode')
    .populate('lineItems.product', 'name sku uom costPrice');
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  res.json({ success: true, data: receipt });
};

// POST /api/receipts — create as Draft
const createReceipt = async (req, res) => {
  const { receiveFrom, scheduleDate, destinationLocation, warehouse, lineItems } = req.body;

  if (!warehouse) {
    return res.status(400).json({ success: false, message: 'Warehouse is required' });
  }

  const { reference, sequenceNum } = await generateReference(warehouse);

  const receipt = await Receipt.create({
    reference,
    sequenceNum,
    receiveFrom,
    scheduleDate,
    responsible: req.user._id,
    destinationLocation,
    warehouse,
    lineItems: lineItems || [],
    status: 'Draft',
  });

  await receipt.populate([
    { path: 'responsible', select: 'loginId' },
    { path: 'destinationLocation', select: 'name shortCode' },
    { path: 'warehouse', select: 'name shortCode' },
    { path: 'lineItems.product', select: 'name sku' },
  ]);

  res.status(201).json({ success: true, data: receipt });
};

// PATCH /api/receipts/:id — update while Draft or Ready
const updateReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  if (!['Draft', 'Ready'].includes(receipt.status)) {
    return res.status(400).json({ success: false, message: 'Cannot edit a receipt that is Done or Cancelled' });
  }

  const { receiveFrom, scheduleDate, destinationLocation, lineItems } = req.body;
  if (receiveFrom !== undefined) receipt.receiveFrom = receiveFrom;
  if (scheduleDate !== undefined) receipt.scheduleDate = scheduleDate;
  if (destinationLocation !== undefined) receipt.destinationLocation = destinationLocation;
  if (lineItems !== undefined) receipt.lineItems = lineItems;

  await receipt.save();
  await receipt.populate([
    { path: 'responsible', select: 'loginId' },
    { path: 'destinationLocation', select: 'name shortCode' },
    { path: 'warehouse', select: 'name shortCode' },
    { path: 'lineItems.product', select: 'name sku uom costPrice' },
  ]);

  res.json({ success: true, data: receipt });
};

// POST /api/receipts/:id/validate — Draft→Ready→Done with stock increment (atomic)
const validateReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receipt = await Receipt.findById(req.params.id).session(session);
    if (!receipt) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.status === 'Cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot validate a cancelled receipt' });
    }
    if (receipt.status === 'Done') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Receipt is already Done' });
    }

    // Draft → Ready on first validate
    if (receipt.status === 'Draft') {
      if (!receipt.lineItems || receipt.lineItems.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Add at least one product line before validating' });
      }
      receipt.status = 'Ready';
      await receipt.save({ session });
      await session.commitTransaction();
      await receipt.populate([
        { path: 'responsible', select: 'loginId' },
        { path: 'destinationLocation', select: 'name shortCode' },
        { path: 'warehouse', select: 'name shortCode' },
        { path: 'lineItems.product', select: 'name sku uom costPrice' },
      ]);
      return res.json({ success: true, data: receipt, message: 'Receipt is Ready. Validate again to confirm Done.' });
    }

    // Ready → Done: increment stock atomically
    if (receipt.status === 'Ready') {
      if (!receipt.destinationLocation || !receipt.warehouse) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Destination location and warehouse are required to complete receipt' });
      }

      for (const item of receipt.lineItems) {
        await StockLevel.findOneAndUpdate(
          { product: item.product, location: receipt.destinationLocation },
          {
            $inc: { quantityOnHand: item.quantity },
            $setOnInsert: { warehouse: receipt.warehouse },
          },
          { upsert: true, new: true, session }
        );
        item.done = item.quantity;
      }

      receipt.status = 'Done';
      receipt.validatedAt = new Date();
      await receipt.save({ session });
      await session.commitTransaction();

      await receipt.populate([
        { path: 'responsible', select: 'loginId' },
        { path: 'destinationLocation', select: 'name shortCode' },
        { path: 'warehouse', select: 'name shortCode' },
        { path: 'lineItems.product', select: 'name sku uom costPrice' },
      ]);
      return res.json({ success: true, data: receipt, message: 'Receipt validated. Stock updated.' });
    }
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// POST /api/receipts/:id/cancel
const cancelReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
  if (receipt.status === 'Done') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a completed receipt' });
  }
  if (receipt.status === 'Cancelled') {
    return res.status(400).json({ success: false, message: 'Receipt is already cancelled' });
  }
  receipt.status = 'Cancelled';
  receipt.cancelledAt = new Date();
  await receipt.save();
  res.json({ success: true, data: receipt, message: 'Receipt cancelled' });
};

module.exports = { getReceipts, getReceipt, createReceipt, updateReceipt, validateReceipt, cancelReceipt };
