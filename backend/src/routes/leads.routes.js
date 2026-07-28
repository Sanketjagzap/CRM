const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Lead } = require('../models/Lead');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { convertLead } = require('../controllers/leadConversion.controller');
const { logActivity } = require('../services/activity.service');

const controller = createCrudController(Lead, {
  searchFields: ['name', 'company', 'email', 'phone'],
  populate: 'assignedTo owner companyId convertedToContact convertedToCompany convertedToDeal',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.post('/:id/notes', asyncHandler(async (request, response) => {
  const lead = await Lead.findById(request.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  lead.notes.unshift({ body: request.body.body, createdBy: request.user.id });
  lead.recentActivityAt = new Date();
  await lead.save();
  response.json({ success: true, data: lead });
}));

router.patch('/:id/assign', asyncHandler(async (request, response) => {
  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    { assignedTo: request.body.assignedTo },
    { new: true }
  ).populate('assignedTo owner', 'name avatar email');
  if (!lead) throw new ApiError(404, 'Lead not found');
  await logActivity({
    actor: request.user.id,
    type: 'update',
    entityType: 'lead',
    entityId: lead._id,
    title: 'Lead assigned',
    description: `Assigned to ${lead.assignedTo?.name || 'new user'}`,
  });
  response.json({ success: true, data: lead });
}));

router.patch('/:id/status', asyncHandler(async (request, response) => {
  const lead = await Lead.findById(request.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  const oldStatus = lead.status;
  lead.status = request.body.status;
  lead.stage = request.body.status;
  lead.recentActivityAt = new Date();
  if (request.body.status === 'lost') lead.lostReason = request.body.reason || '';
  await lead.save();
  await logActivity({
    actor: request.user.id,
    type: 'status_change',
    entityType: 'lead',
    entityId: lead._id,
    title: `Lead status changed to ${request.body.status}`,
    meta: { from: oldStatus, to: request.body.status },
  });
  response.json({ success: true, data: lead });
}));

router.patch('/:id/score', asyncHandler(async (request, response) => {
  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    { score: request.body.score },
    { new: true }
  );
  if (!lead) throw new ApiError(404, 'Lead not found');
  response.json({ success: true, data: lead });
}));

router.post('/:id/convert', convertLead);

module.exports = router;
