const Location = require('../models/Location');

// GET /api/locations?warehouse=<id>
const getLocations = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  const locations = await Location.find(filter)
    .populate('warehouse', 'name shortCode')
    .sort({ name: 1 });
  res.json({ success: true, data: locations });
};

// GET /api/locations/:id
const getLocation = async (req, res) => {
  const loc = await Location.findById(req.params.id).populate('warehouse', 'name shortCode');
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
  res.json({ success: true, data: loc });
};

// POST /api/locations
const createLocation = async (req, res) => {
  const { name, shortCode, warehouse } = req.body;
  if (!name || !shortCode || !warehouse) {
    return res.status(400).json({ success: false, message: 'Name, short code, and warehouse are required' });
  }
  const loc = await Location.create({ name, shortCode, warehouse });
  await loc.populate('warehouse', 'name shortCode');
  res.status(201).json({ success: true, data: loc });
};

// PUT /api/locations/:id
const updateLocation = async (req, res) => {
  const loc = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('warehouse', 'name shortCode');
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
  res.json({ success: true, data: loc });
};

// DELETE /api/locations/:id
const deleteLocation = async (req, res) => {
  const loc = await Location.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
  res.json({ success: true, message: 'Location deactivated' });
};

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation };
