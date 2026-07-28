const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: {
      type: String,
      enum: ['create', 'update', 'delete', 'call', 'meeting', 'email', 'note', 'task', 'follow_up', 'status_change', 'stage_change', 'convert', 'payment', 'comment'],
      required: true,
      index: true,
    },
    entityType: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    duration: { type: Number, default: 0 },
    outcome: { type: String, default: '' },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

activitySchema.index({ entityType: 1, entityId: 1, occurredAt: -1 });
activitySchema.index({ actor: 1, occurredAt: -1 });
activitySchema.index({ type: 1, occurredAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = { Activity };
