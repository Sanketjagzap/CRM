const { asyncHandler } = require('../utils/asyncHandler');
const { Lead } = require('../models/Lead');
const { Contact } = require('../models/Contact');
const { Deal } = require('../models/Deal');
const { Task } = require('../models/Task');

const globalSearch = asyncHandler(async (request, response) => {
  const search = String(request.query.q || '').trim();
  const owner = request.user.id;

  if (!search) {
    response.json({ success: true, data: { leads: [], contacts: [], deals: [], tasks: [] } });
    return;
  }

  const regex = { $regex: search, $options: 'i' };
  const [leads, contacts, deals, tasks] = await Promise.all([
    Lead.find({ owner, $or: [{ name: regex }, { company: regex }, { email: regex }] }).limit(5).lean(),
    Contact.find({ owner, $or: [{ name: regex }, { company: regex }, { email: regex }] }).limit(5).lean(),
    Deal.find({ owner, title: regex }).limit(5).lean(),
    Task.find({ owner, title: regex }).limit(5).lean(),
  ]);

  response.json({ success: true, data: { leads, contacts, deals, tasks } });
});

module.exports = { globalSearch };