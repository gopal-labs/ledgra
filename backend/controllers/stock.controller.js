const Product = require('../models/Product');
const StockLevel = require('../models/StockLevel');

// @desc    Get consolidated stock view (product-level rows with total on hand & free to use)
// @route   GET /api/stock
// @access  Private
const getConsolidatedStock = async (req, res) => {
  try {
    const { search, category, warehouse } = req.query;

    const prodFilter = {};
    if (category) prodFilter.category = category;
    if (search) {
      prodFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(prodFilter)
      .populate('category', 'name')
      .sort({ name: 1 });

    const stockLevels = await StockLevel.find(warehouse ? { warehouse } : {});

    // Map stock per product
    const stockMap = {};
    stockLevels.forEach((sl) => {
      const pId = sl.product.toString();
      if (!stockMap[pId]) {
        stockMap[pId] = { onHand: 0, reserved: 0 };
      }
      stockMap[pId].onHand += sl.quantityOnHand || 0;
      stockMap[pId].reserved += sl.quantityReserved || 0;
    });

    const result = products.map((p) => {
      const s = stockMap[p._id.toString()] || { onHand: 0, reserved: 0 };
      const onHand = s.onHand;
      const reserved = s.reserved;
      const freeToUse = Math.max(0, onHand - reserved);
      const isLowStock = onHand <= (p.reorderPoint || 0);

      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        uom: p.uom || 'pcs',
        costPrice: p.costPrice || 0,
        category: p.category,
        reorderPoint: p.reorderPoint || 0,
        onHand,
        reserved,
        freeToUse,
        isLowStock,
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock items crossing threshold
// @route   GET /api/stock/low-stock
// @access  Private
const getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    const stockLevels = await StockLevel.find();

    const stockMap = {};
    stockLevels.forEach((sl) => {
      const pId = sl.product.toString();
      stockMap[pId] = (stockMap[pId] || 0) + (sl.quantityOnHand || 0);
    });

    const lowStockProducts = products
      .map((p) => {
        const onHand = stockMap[p._id.toString()] || 0;
        return {
          _id: p._id,
          name: p.name,
          sku: p.sku,
          uom: p.uom,
          reorderPoint: p.reorderPoint || 0,
          onHand,
          isLowStock: onHand <= (p.reorderPoint || 0),
        };
      })
      .filter((p) => p.isLowStock);

    res.json({ success: true, count: lowStockProducts.length, data: lowStockProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConsolidatedStock,
  getLowStockAlerts,
};
