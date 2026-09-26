const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sequenceNum: { type: Number, required: true },

    deliveryTo: { type: String, trim: true, default: '' },
    scheduleDate: { type: Date, default: Date.now },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sourceLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    status: {
      type: String,
      enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'],
      default: 'Draft',
    },
    lineItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        demand: { type: Number, required: true, min: 1 },
        reserved: { type: Number, default: 0, min: 0 },
        done: { type: Number, default: 0, min: 0 },
      },
    ],
    validatedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
