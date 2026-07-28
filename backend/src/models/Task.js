const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in-progress', 'done', 'cancelled'], default: 'todo', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    dueDate: { type: Date, default: null, index: true },
    reminderAt: { type: Date, default: null, index: true },
    followUpAt: { type: Date, default: null, index: true },
    relatedType: { type: String, enum: ['lead', 'contact', 'company', 'deal', 'none'], default: 'none', index: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    completedAt: { type: Date, default: null },
    category: { type: String, enum: ['task', 'follow_up', 'call', 'meeting', 'email'], default: 'task', index: true },
    outcome: { type: String, default: '' },
    isOverdue: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ owner: 1, dueDate: 1, status: 1 });
taskSchema.index({ owner: 1, category: 1, status: 1 });
taskSchema.index({ relatedType: 1, relatedId: 1 });

taskSchema.pre('save', function (next) {
  if (this.dueDate && this.status !== 'done' && new Date(this.dueDate) < new Date()) {
    this.isOverdue = true;
  } else if (this.status === 'done') {
    this.isOverdue = false;
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task };
