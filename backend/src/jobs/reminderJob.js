const { Task } = require('../models/Task');
const { createNotification } = require('../services/notification.service');

function startReminderJob() {
  setInterval(async () => {
    const dueSoon = await Task.find({
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 1000 * 60 * 60 * 24) },
      status: { $ne: 'done' },
      assignedTo: { $ne: null },
    }).lean();

    for (const task of dueSoon) {
      await createNotification({
        user: task.assignedTo,
        type: 'warning',
        title: 'Task reminder',
        message: `${task.title} is due soon.`,
        entityType: 'task',
        entityId: task._id,
      });
    }
  }, 1000 * 60 * 30);
}

module.exports = { startReminderJob };