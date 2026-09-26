const Product = require('../models/Product');
const StockLevel = require('../models/StockLevel');
const Receipt = require('../models/Receipt');

// @desc    Get dashboard summary aggregations
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  const { type, status, warehouse, category } = req.query;

  // Build product filter
  const prodFilter = { isActive: true };
  if (category) prodFilter.category = category;

  // Build stock filter
  const stockFilter = {};
  if (warehouse) stockFilter.warehouse = warehouse;

  // Build receipt filter
  const receiptFilter = {};
  if (status) receiptFilter.status = status;
  if (warehouse) receiptFilter.warehouse = warehouse;
  if (type && type !== 'Receipt') receiptFilter._skipAll = true; // only Receipt type for now

  // --- Product aggregations from StockLevel ---
  const [stockStats] = await StockLevel.aggregate([
    ...(warehouse ? [{ $match: { warehouse: require('mongoose').Types.ObjectId.createFromHexString ? require('mongoose').Types.ObjectId.createFromHexString(warehouse) : require('mongoose').Types.ObjectId(warehouse) } }] : []),
    {
      $group: {
        _id: '$product',
        totalOnHand: { $sum: '$quantityOnHand' },
        totalReserved: { $sum: '$quantityReserved' },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.isActive': true, ...(category ? { 'product.category': category } : {}) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$totalOnHand', 0] }, { $lte: ['$totalOnHand', '$product.reorderPoint'] }] },
              1, 0,
            ],
          },
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$totalOnHand', 0] }, 1, 0] },
        },
      },
    },
  ]);

  // Total products (even without stock)
  const totalProducts = await Product.countDocuments(prodFilter);

  // --- Receipt aggregations ---
  const receiptAgg = await Receipt.aggregate([
    { $match: receiptFilter._skipAll ? { _id: null } : { ...(status ? { status } : {}), ...(warehouse ? { warehouse: require('mongoose').Types.ObjectId.isValid(warehouse) ? new (require('mongoose').Types.ObjectId)(warehouse) : null } : {}) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const byStatus = {};
  receiptAgg.forEach(r => { byStatus[r._id] = r.count; });

  const pendingReceipts = (byStatus['Draft'] || 0) + (byStatus['Ready'] || 0);
  const totalReceipts = Object.values(byStatus).reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    data: {
      products: {
        totalInStock: totalProducts,
        totalStockQty: 0,
        lowStock: stockStats?.lowStockCount || 0,
        outOfStock: stockStats?.outOfStockCount || 0,
      },
      receipts: {
        pending: pendingReceipts,
        total: totalReceipts,
        toReceive: byStatus['Ready'] || 0,
        operations: totalReceipts,
        draft: byStatus['Draft'] || 0,
        done: byStatus['Done'] || 0,
      },
      deliveries: {
        pending: 0, total: 0, toDeliver: 0, late: 0, waiting: 0, operations: 0,
      },
      internalTransfers: { scheduled: 0, total: 0 },
      adjustments: { pending: 0, total: 0 },
    },
  });
};

module.exports = { getDashboardSummary };
