const { User } = require('../models/User');
const { Lead } = require('../models/Lead');
const { Contact } = require('../models/Contact');
const { Deal } = require('../models/Deal');
const { Task } = require('../models/Task');
const { Notification } = require('../models/Notification');
const { Activity } = require('../models/Activity');

async function seedDemoData() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return;
  }

  const admin = new User({
    name: 'CRM Admin',
    email: 'admin@crm.local',
    role: 'admin',
    title: 'Founding Operator',
    department: 'Operations',
  });
  await admin.setPassword('password123');
  await admin.save();

  const [leadA, leadB] = await Lead.create([
    { name: 'Ava Stone', company: 'Northstar Labs', email: 'ava@northstar.com', phone: '+1 555 0101', owner: admin._id, assignedTo: admin._id, status: 'qualified', stage: 'qualified', score: 92, value: 34000, source: 'Website' },
    { name: 'Noah Reed', company: 'Pulseworks', email: 'noah@pulseworks.io', phone: '+1 555 0202', owner: admin._id, assignedTo: admin._id, status: 'proposal', stage: 'proposal', score: 80, value: 56000, source: 'Referral' },
  ]);

  const [contactA, contactB] = await Contact.create([
    { name: 'Ava Stone', company: 'Northstar Labs', email: 'ava@northstar.com', phone: '+1 555 0101', owner: admin._id, assignedTo: admin._id },
    { name: 'Noah Reed', company: 'Pulseworks', email: 'noah@pulseworks.io', phone: '+1 555 0202', owner: admin._id, assignedTo: admin._id },
  ]);

  await Deal.create([
    { title: 'Northstar expansion', contact: contactA._id, lead: leadA._id, stage: 'proposal', priority: 'high', value: 34000, probability: 68, owner: admin._id, assignedTo: admin._id, pipelineOrder: 1 },
    { title: 'Pulseworks enterprise rollout', contact: contactB._id, lead: leadB._id, stage: 'negotiation', priority: 'urgent', value: 56000, probability: 78, owner: admin._id, assignedTo: admin._id, pipelineOrder: 2 },
  ]);

  await Task.create([
    { title: 'Follow up with Northstar', description: 'Send revised proposal and implementation timeline.', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 12), status: 'todo', priority: 'high', assignedTo: admin._id, owner: admin._id },
    { title: 'Prepare contract for Pulseworks', description: 'Finalize procurement terms and signature packet.', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), status: 'in-progress', priority: 'high', assignedTo: admin._id, owner: admin._id },
  ]);

  await Notification.create([
    { user: admin._id, type: 'info', title: 'Welcome to Modern AI CRM', message: 'Your workspace has been seeded with demo data.', entityType: 'system' },
    { user: admin._id, type: 'warning', title: 'Task due soon', message: 'Follow up with Northstar is due today.', entityType: 'task' },
  ]);

  await Activity.create([
    { actor: admin._id, type: 'create', entityType: 'lead', entityId: leadA._id, title: 'Lead imported', meta: { name: leadA.name } },
    { actor: admin._id, type: 'create', entityType: 'deal', entityId: contactB._id, title: 'Deal opened', meta: { title: 'Pulseworks enterprise rollout' } },
  ]);
}

module.exports = { seedDemoData };