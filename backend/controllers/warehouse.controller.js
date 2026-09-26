const Warehouse = require('../models/Warehouse');

// GET /api/warehouses
const getWarehouses = async (req, res) => {
  const warehouses = await Warehouse.find().sort({ name: 1 });
  res.json({ success: true, data: warehouses });
};

// GET /api/warehouses/:id
const getWarehouse = async (req, res) => {
  const wh = await Warehouse.findById(req.params.id);
  if (!wh) return res.status(404).json({ success: false, message: 'Warehouse not found' });
  res.json({ success: true, data: wh });
};

// POST /api/warehouses
const createWarehouse = async (req, res) => {
  const { name, shortCode, address } = req.body;
  if (!name || !shortCode) {
    return res.status(400).json({ success: false, message: 'Name and short code are required' });
  }
  const wh = await Warehouse.create({ name, shortCode, address });
  res.status(201).json({ success: true, data: wh });
};

// PUT /api/warehouses/:id
const updateWarehouse = async (req, res) => {
  const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!wh) return res.status(404).json({ success: false, message: 'Warehouse not found' });
  res.json({ success: true, data: wh });
};

// DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res) => {
  const wh = await Warehouse.findByIdAndDelete(req.params.id);
  if (!wh) return res.status(404).json({ success: false, message: 'Warehouse not found' });
  res.json({ success: true, message: 'Warehouse deleted' });
};

module.exports = { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse };
