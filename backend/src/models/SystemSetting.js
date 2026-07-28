const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

const DEFAULT_SETTINGS = [
  { key: 'company_name', value: 'My CRM Company' },
  { key: 'company_email', value: 'contact@company.com' },
  { key: 'company_phone', value: '' },
  { key: 'company_address', value: '' },
  { key: 'currency', value: 'INR' },
  { key: 'currency_symbol', value: '₹' },
  { key: 'tax_rate', value: 18 },
  { key: 'tax_name', value: 'GST' },
  { key: 'lead_statuses', value: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
  { key: 'deal_stages', value: [
    { key: 'new_lead', label: 'New Lead', color: 'sky', probability: 10 },
    { key: 'qualified', label: 'Qualified', color: 'violet', probability: 30 },
    { key: 'proposal', label: 'Proposal', color: 'amber', probability: 50 },
    { key: 'negotiation', label: 'Negotiation', color: 'orange', probability: 75 },
    { key: 'won', label: 'Won', color: 'emerald', probability: 100 },
    { key: 'lost', label: 'Lost', color: 'rose', probability: 0 },
  ] },
  { key: 'lead_sources', value: ['website', 'referral', 'social_media', 'cold_call', 'email', 'event', 'advertisement', 'other'] },
  { key: 'lead_priorities', value: ['low', 'medium', 'high', 'urgent'] },
  { key: 'payment_methods', value: ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'online', 'other'] },
  { key: 'notification_email', value: true },
  { key: 'notification_push', value: true },
  { key: 'task_reminder_hours', value: 2 },
  { key: 'follow_up_default_days', value: 3 },
];

module.exports = { SystemSetting, DEFAULT_SETTINGS };
