const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'Short code must be at most 10 characters'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique shortCode per warehouse
locationSchema.index({ shortCode: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
