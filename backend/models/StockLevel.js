const mongoose = require('mongoose');

/**
 * StockLevel tracks quantity of a product at a specific location.
 * quantityFree is computed: onHand - reserved.
 */
const stockLevelSchema = new mongoose.Schema(
  {
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
      required: true,
    },
    quantityOnHand: { type: Number, default: 0, min: 0 },
    quantityReserved: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique per product+location
stockLevelSchema.index({ product: 1, location: 1 }, { unique: true });

// Virtual: Free to use
stockLevelSchema.virtual('quantityFree').get(function () {
  return Math.max(0, this.quantityOnHand - this.quantityReserved);
});

module.exports = mongoose.model('StockLevel', stockLevelSchema);
