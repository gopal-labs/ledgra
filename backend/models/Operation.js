const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ['Receipt', 'Delivery', 'Internal Transfer', 'Adjustment'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'],
      default: 'Draft',
    },
    scheduledDate: { type: Date },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        done: { type: Number, default: 0 },
      },
    ],
    fromLocation: { type: String },
    toLocation: { type: String },
    warehouse: { type: String, default: 'Main Warehouse' },
    notes: { type: String },
    isLate: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Operation', operationSchema);
