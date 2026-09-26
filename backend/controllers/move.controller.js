const StockMove = require('../models/StockMove');

// @desc    Get all stock move ledger entries (Audit trail)
// @route   GET /api/move-history or /api/moves
// @access  Private
const getMoveHistory = async (req, res) => {
  try {
    const { moveType, product, warehouse, search, dateFrom, dateTo } = req.query;
    const filter = {};

    if (moveType) {
      if (moveType === 'in') filter.moveType = { $in: ['Receipt', 'in'] };
      else if (moveType === 'out') filter.moveType = { $in: ['Delivery', 'out'] };
      else if (moveType === 'internal') filter.moveType = { $in: ['Transfer', 'internal'] };
      else if (moveType === 'adjustment') filter.moveType = { $in: ['Adjustment', 'adjustment'] };
      else filter.moveType = moveType;
    }

    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const moves = await StockMove.find(filter)
      .populate('responsible', 'loginId')
      .populate('product', 'name sku uom costPrice')
      .populate('fromLocation', 'name shortCode type')
      .populate('toLocation', 'name shortCode type')
      .populate('warehouse', 'name shortCode')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: moves.length, data: moves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMoveHistory,
};
