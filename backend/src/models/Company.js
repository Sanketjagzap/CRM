const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    industry: { type: String, default: '', index: true },
    website: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, index: true },
    phone: { type: String, default: '', index: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    size: { type: String, default: '' },
    revenue: { type: Number, default: 0 },
    notesText: { type: String, default: '', trim: true },
    notes: { type: [noteSchema], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    tags: { type: [String], default: [], index: true },
    totalRevenue: { type: Number, default: 0, index: true },
    pendingAmount: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

companySchema.index({ owner: 1, createdAt: -1 });
companySchema.index({ owner: 1, totalRevenue: -1 });

const Company = mongoose.model('Company', companySchema);

module.exports = { Company };
