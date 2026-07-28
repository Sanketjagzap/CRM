const mongoose = require('mongoose');

const dealProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null, index: true },
    stage: { type: String, enum: ['new_lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], default: 'new_lead', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    value: { type: Number, default: 0, index: true },
    subtotal: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0, index: true },
    outstandingAmount: { type: Number, default: 0, index: true },
    products: { type: [dealProductSchema], default: [] },
    expectedCloseDate: { type: Date, default: null, index: true },
    probability: { type: Number, default: 10 },
    expectedRevenue: { type: Number, default: 0, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    pipelineOrder: { type: Number, default: 0, index: true },
    lostReason: { type: String, default: '' },
    wonAt: { type: Date, default: null },
    lostAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    history: {
      type: [
        {
          stage: String,
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

dealSchema.index({ owner: 1, stage: 1, pipelineOrder: 1 });
dealSchema.index({ owner: 1, expectedCloseDate: 1 });
dealSchema.index({ company: 1, stage: 1 });
dealSchema.index({ owner: 1, createdAt: -1 });

dealSchema.pre('save', function (next) {
  const subtotal = this.products.reduce((sum, p) => {
    const line = (p.unitPrice * p.quantity) - (p.discountAmount || 0) + (p.taxAmount || 0);
    return sum + (p.total || line);
  }, 0);
  if (subtotal > 0) this.subtotal = subtotal;
  if (!this.value) this.value = this.subtotal || this.finalAmount || 0;
  this.discountAmount = this.discountAmount || (this.subtotal * (this.discountRate || 0)) / 100;
  this.taxAmount = this.taxAmount || ((this.subtotal - this.discountAmount) * (this.taxRate || 0)) / 100;
  if (!this.finalAmount || this.finalAmount === 0) {
    this.finalAmount = this.subtotal - this.discountAmount + this.taxAmount;
  }
  this.outstandingAmount = Math.max(0, (this.finalAmount || 0) - (this.paidAmount || 0));
  this.expectedRevenue = (this.value || this.finalAmount || 0) * ((this.probability || 0) / 100);
  next();
});

const Deal = mongoose.model('Deal', dealSchema);

module.exports = { Deal };
