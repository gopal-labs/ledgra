const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sequenceNum: { type: Number, required: true },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    recordedQuantity: { type: Number, required: true, default: 0 },
    countedQuantity: { type: Number, required: true, default: 0 },
    difference: { type: Number, required: true, default: 0 },
    reason: { type: String, trim: true, default: '' },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Draft', 'Done', 'Cancelled'],
      default: 'Draft',
    },
    validatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Adjustment', adjustmentSchema);
