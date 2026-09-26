const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Auto-increment sequence per warehouse
    sequenceNum: { type: Number, required: true },

    receiveFrom: { type: String, trim: true, default: '' },
    scheduleDate: { type: Date, default: Date.now },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    destinationLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    status: {
      type: String,
      enum: ['Draft', 'Ready', 'Done', 'Cancelled'],
      default: 'Draft',
    },
    lineItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        done: { type: Number, default: 0 },
      },
    ],
    validatedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
