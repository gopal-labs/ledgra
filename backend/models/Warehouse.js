const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [6, 'Short code must be at most 6 characters'],
      match: [/^[A-Z0-9]+$/, 'Short code must be alphanumeric uppercase'],
    },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
