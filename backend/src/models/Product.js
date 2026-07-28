const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, default: '' },
    category: { type: String, default: '', index: true },
    price: { type: Number, default: 0, required: true, index: true },
    cost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    sku: { type: String, default: '', index: true },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: 'unit' },
    isActive: { type: Boolean, default: true, index: true },
    type: { type: String, enum: ['product', 'service', 'hybrid'], default: 'product', index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalRevenue: { type: Number, default: 0, index: true },
    unitsSold: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (typeof this.type === 'string') this.type = this.type.toLowerCase().trim();
  if (typeof this.unit === 'string') this.unit = this.unit.toLowerCase().trim();
  next();
});

productSchema.index({ owner: 1, category: 1 });
productSchema.index({ owner: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };
