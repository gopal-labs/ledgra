const mongoose = require('mongoose');

const UOM_ENUM = ['pcs', 'kg', 'g', 'box', 'ltr', 'm', 'cm', 'pair', 'set', 'dozen'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU/Code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    uom: {
      type: String,
      enum: UOM_ENUM,
      default: 'pcs',
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    reorderPoint: {
      type: Number,
      default: 10,
      min: [0, 'Reorder point cannot be negative'],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
module.exports.UOM_ENUM = UOM_ENUM;
