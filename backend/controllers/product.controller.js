const Product = require('../models/Product');
const StockLevel = require('../models/StockLevel');
const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');

// Helper: aggregate total onHand and free for a product
const aggregateStock = async (productId) => {
  const result = await StockLevel.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        totalOnHand: { $sum: '$quantityOnHand' },
        totalReserved: { $sum: '$quantityReserved' },
      },
    },
  ]);
  if (!result.length) return { totalOnHand: 0, totalReserved: 0, totalFree: 0 };
  const { totalOnHand, totalReserved } = result[0];
  return { totalOnHand, totalReserved, totalFree: Math.max(0, totalOnHand - totalReserved) };
};

// GET /api/products
const getProducts = async (req, res) => {
  const { search, category, page = 1, limit = 50 } = req.query;
  const filter = { isActive: true };
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } },
  ];
  if (category) filter.category = category;

  const products = await Product.find(filter)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(filter);

  // Attach stock totals for each product
  const enriched = await Promise.all(
    products.map(async (p) => {
      const stock = await aggregateStock(p._id);
      return { ...p.toJSON(), ...stock };
    })
  );

  res.json({ success: true, data: enriched, total, page: Number(page), limit: Number(limit) });
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  const stock = await aggregateStock(product._id);
  res.json({ success: true, data: { ...product.toJSON(), ...stock } });
};

// POST /api/products
const createProduct = async (req, res) => {
  const { name, sku, category, uom, costPrice, reorderPoint, initialStock, locationId, warehouseId } = req.body;
  if (!name || !sku) {
    return res.status(400).json({ success: false, message: 'Name and SKU are required' });
  }

  const existing = await Product.findOne({ sku: sku.toUpperCase() });
  if (existing) return res.status(409).json({ success: false, message: 'SKU already exists' });

  const product = await Product.create({ name, sku, category, uom, costPrice, reorderPoint });

  // Seed initial stock if provided
  if (initialStock && Number(initialStock) > 0 && locationId && warehouseId) {
    await StockLevel.create({
      product: product._id,
      location: locationId,
      warehouse: warehouseId,
      quantityOnHand: Number(initialStock),
    });
  }

  await product.populate('category', 'name');
  res.status(201).json({ success: true, data: product });
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  const { name, sku, category, uom, costPrice, reorderPoint } = req.body;

  if (sku) {
    const conflict = await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: req.params.id } });
    if (conflict) return res.status(409).json({ success: false, message: 'SKU already in use' });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, sku, category, uom, costPrice, reorderPoint },
    { new: true, runValidators: true }
  ).populate('category', 'name');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

// DELETE /api/products/:id  (soft delete)
const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deactivated' });
};

// GET /api/products/:id/stock  — stock per location
const getProductStock = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const stockLevels = await StockLevel.find({ product: req.params.id })
    .populate('location', 'name shortCode')
    .populate('warehouse', 'name shortCode');

  const enriched = stockLevels.map((sl) => ({
    ...sl.toJSON(),
    quantityFree: Math.max(0, sl.quantityOnHand - sl.quantityReserved),
  }));

  res.json({ success: true, data: enriched });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductStock };
