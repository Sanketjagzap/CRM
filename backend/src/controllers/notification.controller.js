const { asyncHandler } = require('../utils/asyncHandler');
const { Notification } = require('../models/Notification');

const list = asyncHandler(async (request, response) => {
  const notifications = await Notification.find({ user: request.user.id }).sort('-createdAt').limit(10).lean();
  response.json({ success: true, data: notifications });
});

const markRead = asyncHandler(async (request, response) => {
  const notification = await Notification.findOneAndUpdate({ _id: request.params.id, user: request.user.id }, { readAt: new Date() }, { new: true });
  response.json({ success: true, data: notification });
});

module.exports = { list, markRead };