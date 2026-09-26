const Category = require('../models/Category');

// GET /api/categories
const getCategories = async (req, res) => {
  const cats = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: cats });
};

// POST /api/categories
const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) return res.status(409).json({ success: false, message: 'Category already exists' });
  const cat = await Category.create({ name: name.trim(), description });
  res.status(201).json({ success: true, data: cat });
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: cat });
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, message: 'Category deleted' });
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
