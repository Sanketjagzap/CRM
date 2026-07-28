const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    email: { type: String, default: '', trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', index: true },
    company: { type: String, default: '', trim: true, index: 'text' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    jobTitle: { type: String, default: '' },
    source: { type: String, default: 'website', index: true },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], default: 'new', index: true },
    stage: { type: String, enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], default: 'new', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    score: { type: Number, default: 0, index: true },
    value: { type: Number, default: 0, index: true },
    tags: { type: [String], default: [], index: true },
    notes: { type: [noteSchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    converted: { type: Boolean, default: false, index: true },
    convertedAt: { type: Date, default: null },
    convertedToContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
    convertedToCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    convertedToDeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
    lostReason: { type: String, default: '' },
    lastContactedAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null, index: true },
    recentActivityAt: { type: Date, default: Date.now, index: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

leadSchema.pre('validate', function (next) {
  if (typeof this.status === 'string') this.status = this.status.toLowerCase().trim();
  if (typeof this.stage === 'string') this.stage = this.stage.toLowerCase().trim();
  if (typeof this.priority === 'string') this.priority = this.priority.toLowerCase().trim();
  if (typeof this.source === 'string') this.source = this.source.toLowerCase().trim().replace(/\s+/g, '_');
  next();
});

leadSchema.index({ owner: 1, createdAt: -1 });
leadSchema.index({ owner: 1, status: 1, createdAt: -1 });
leadSchema.index({ owner: 1, priority: 1, createdAt: -1 });
leadSchema.index({ owner: 1, nextFollowUpAt: 1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = { Lead };
