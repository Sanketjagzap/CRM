const { Notification } = require('../models/Notification');
const { emitToUser } = require('./socket.service');

async function createNotification(payload) {
  const notification = await Notification.create(payload);
  if (payload.user) {
    emitToUser(String(payload.user), 'notification:new', notification.toObject());
  }
  return notification;
}

module.exports = { createNotification };