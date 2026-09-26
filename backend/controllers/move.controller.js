const StockMove = require('../models/StockMove');

// @desc    Get all stock move ledger entries (Audit trail)
// @route   GET /api/moves
// @access  Private
const getMoveHistory = async (req, res) => {
  try {
    const { moveType, product, search } = req.query;
    const filter = {};

    if (moveType) filter.moveType = moveType;
    if (product) filter.product = product;
    if (search) {
      filter.reference = { $regex: search, $options: 'i' };
    }

    const moves = await StockMove.find(filter)
      .populate('responsible', 'loginId')
      .populate('product', 'name sku uom costPrice')
      .populate('fromLocation', 'name shortCode type')
      .populate('toLocation', 'name shortCode type')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: moves.length, data: moves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMoveHistory,
};
