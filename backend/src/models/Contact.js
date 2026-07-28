const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    name: { type: String, required: true, trim: true, index: 'text' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    company: { type: String, default: '', index: 'text' },
    jobTitle: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, index: true },
    phone: { type: String, default: '', index: true },
    mobile: { type: String, default: '' },
    website: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, default: '' },
    department: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    dateOfBirth: { type: Date, default: null },
    communicationHistory: {
      type: [
        {
          channel: String,
          note: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    notesText: { type: String, default: '', trim: true },
    notes: { type: [noteSchema], default: [] },
    deals: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }], default: [] },
    tasks: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    tags: { type: [String], default: [], index: true },
    leadSource: { type: String, default: '' },
    totalRevenue: { type: Number, default: 0, index: true },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

contactSchema.index({ owner: 1, createdAt: -1 });
contactSchema.index({ owner: 1, companyId: 1 });

contactSchema.pre('validate', function (next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }
  if (this.name && !this.firstName) {
    const parts = this.name.split(' ');
    this.firstName = parts[0] || '';
    this.lastName = parts.slice(1).join(' ') || '';
  }
  next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = { Contact };
