const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Task } = require('../models/Task');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const controller = createCrudController(Task, {
  searchFields: ['title', 'description'],
  populate: 'assignedTo owner',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.patch('/:id/status', asyncHandler(async (request, response) => {
  const task = await Task.findById(request.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  const oldStatus = task.status;
  task.status = request.body.status;
  if (request.body.status === 'done') {
    task.completedAt = new Date();
    task.isOverdue = false;
  }
  await task.save();
  response.json({ success: true, data: task });
}));

router.patch('/:id/assign', asyncHandler(async (request, response) => {
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    { assignedTo: request.body.assignedTo },
    { new: true }
  ).populate('assignedTo owner', 'name avatar email');
  if (!task) throw new ApiError(404, 'Task not found');
  response.json({ success: true, data: task });
}));

router.get('/overdue/list', asyncHandler(async (request, response) => {
  const ownerId = request.user.id;
  const now = new Date();
  const tasks = await Task.find({
    owner: ownerId,
    status: { $in: ['todo', 'in-progress'] },
    $or: [
      { dueDate: { $lt: now }, isOverdue: true },
      { dueDate: { $lt: now } },
    ],
  }).sort({ dueDate: -1 }).populate('assignedTo', 'name avatar').lean();
  response.json({ success: true, data: tasks });
}));

router.get('/upcoming/list', asyncHandler(async (request, response) => {
  const ownerId = request.user.id;
  const now = new Date();
  const days = parseInt(request.query.days || '7');
  const ahead = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const tasks = await Task.find({
    owner: ownerId,
    status: { $in: ['todo', 'in-progress'] },
    $or: [
      { followUpAt: { $gte: now, $lte: ahead } },
      { dueDate: { $gte: now, $lte: ahead } },
    ],
  }).sort({ followUpAt: 1, dueDate: 1 }).populate('assignedTo', 'name avatar').lean();
  response.json({ success: true, data: tasks });
}));

module.exports = router;
