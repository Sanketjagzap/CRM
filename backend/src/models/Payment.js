const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    amount: { type: Number, default: 0, required: true, index: true },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'online', 'other'],
      default: 'bank_transfer',
      index: true,
    },
    status: { type: String, enum: ['paid', 'pending', 'failed', 'refunded'], default: 'pending', index: true },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    dueDate: { type: Date, default: null, index: true },
    paidAt: { type: Date, default: null, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ owner: 1, status: 1, dueDate: 1 });
paymentSchema.index({ deal: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment };
