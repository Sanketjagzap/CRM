const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Deal } = require('../models/Deal');
const { Company } = require('../models/Company');
const { Contact } = require('../models/Contact');
const { Payment } = require('../models/Payment');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { addProductsToDeal, markDealWon, markDealLost, recordPayment } = require('../controllers/dealFinance.controller');
const { logActivity } = require('../services/activity.service');
const mongoose = require('mongoose');

async function recomputeCompanyTotals(companyId) {
  if (!companyId) return;
  const wonDeals = await Deal.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(companyId), stage: 'won' } },
    { $group: { _id: null, revenue: { $sum: { $ifNull: ['$finalAmount', '$value'] } } } },
  ]);
  const pending = await Payment.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(companyId), status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  await Company.findByIdAndUpdate(companyId, {
    totalRevenue: wonDeals[0]?.revenue || 0,
    pendingAmount: pending[0]?.total || 0,
  });
}

async function recomputeContactTotals(contactId) {
  if (!contactId) return;
  const wonDeals = await Deal.aggregate([
    { $match: { contact: new mongoose.Types.ObjectId(contactId), stage: 'won' } },
    { $group: { _id: null, revenue: { $sum: { $ifNull: ['$finalAmount', '$value'] } } } },
  ]);
  await Contact.findByIdAndUpdate(contactId, {
    totalRevenue: wonDeals[0]?.revenue || 0,
  });
}

const controller = createCrudController(Deal, {
  searchFields: ['title'],
  populate: 'assignedTo owner contact company lead',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', asyncHandler(async (request, response) => {
  const deal = await Deal.findById(request.params.id);
  if (!deal) throw new ApiError(404, 'Deal not found');
  const oldStage = deal.stage;
  const oldCompanyId = deal.company;
  const oldContactId = deal.contact;

  const updates = request.body || {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'companyId' || key === 'contactId' || key === 'assignedTo') continue;
    if (value === undefined) continue;
    if (key === 'stage') continue;
    deal[key] = value;
  }

  if (updates.companyId !== undefined) deal.company = updates.companyId || null;
  if (updates.contactId !== undefined) deal.contact = updates.contactId || null;
  if (updates.assignedTo !== undefined) deal.assignedTo = updates.assignedTo || null;

  let stageChanged = false;
  if (updates.stage && updates.stage !== oldStage) {
    stageChanged = true;
    deal.stage = updates.stage;
    deal.history.unshift({ stage: updates.stage, changedBy: request.user.id });
    if (updates.stage === 'won') {
      deal.wonAt = new Date();
      deal.probability = 100;
    }
    if (updates.stage === 'lost') {
      deal.lostAt = new Date();
      deal.probability = 0;
    }
  }

  const value = Number(deal.value || deal.finalAmount || 0);
  const finalAmount = Number(deal.finalAmount || deal.value || 0);
  const paidAmount = Number(deal.paidAmount || 0);
  const probability = Number(deal.probability || 0);
  deal.outstandingAmount = Math.max(0, finalAmount - paidAmount);
  deal.expectedRevenue = (value * probability) / 100 || 0;

  await deal.save();
  const populated = await Deal.findById(deal._id).populate('assignedTo owner contact company lead');

  const companyOrContactChanged =
    (updates.companyId !== undefined && String(oldCompanyId || '') !== String(updates.companyId || '')) ||
    (updates.contactId !== undefined && String(oldContactId || '') !== String(updates.contactId || ''));

  if (stageChanged && (oldStage === 'won' || updates.stage === 'won' || oldStage === 'lost' || updates.stage === 'lost')) {
    await recomputeCompanyTotals(deal.company);
    await recomputeContactTotals(deal.contact);
    if (companyOrContactChanged) {
      await recomputeCompanyTotals(oldCompanyId);
      await recomputeContactTotals(oldContactId);
    }
  } else if (companyOrContactChanged) {
    if (deal.stage === 'won') {
      await recomputeCompanyTotals(deal.company);
      await recomputeContactTotals(deal.contact);
    }
    await recomputeCompanyTotals(oldCompanyId);
    await recomputeContactTotals(oldContactId);
  }

  try {
    await logActivity({
      actor: request.user.id,
      type: 'update',
      entityType: 'deal',
      entityId: deal._id,
      title: stageChanged ? `Deal updated & moved to ${updates.stage}` : 'Deal details updated',
      meta: { stageChanged, updates: Object.keys(updates) },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.json({ success: true, data: populated });
}));
router.delete('/:id', controller.remove);

router.patch('/:id/stage', asyncHandler(async (request, response) => {
  const deal = await Deal.findById(request.params.id);
  if (!deal) throw new ApiError(404, 'Deal not found');
  const oldStage = deal.stage;
  deal.stage = request.body.stage;
  deal.history.unshift({ stage: request.body.stage, changedBy: request.user.id });
  if (request.body.stage === 'won') {
    deal.wonAt = new Date();
    deal.probability = 100;
  }
  if (request.body.stage === 'lost') {
    deal.lostAt = new Date();
    deal.probability = 0;
  }
  await deal.save();

  if (oldStage === 'won' || request.body.stage === 'won' || oldStage === 'lost' || request.body.stage === 'lost') {
    await recomputeCompanyTotals(deal.company);
    await recomputeContactTotals(deal.contact);
  }

  try {
    await logActivity({
      actor: request.user.id,
      type: 'stage_change',
      entityType: 'deal',
      entityId: deal._id,
      title: `Deal stage changed to ${request.body.stage}`,
      meta: { from: oldStage, to: request.body.stage },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.json({ success: true, data: deal });
}));

router.patch('/:id/reorder', asyncHandler(async (request, response) => {
  const deal = await Deal.findByIdAndUpdate(
    request.params.id,
    { pipelineOrder: request.body.pipelineOrder },
    { new: true }
  );
  if (!deal) throw new ApiError(404, 'Deal not found');
  response.json({ success: true, data: deal });
}));

router.post('/:id/products', addProductsToDeal);
router.post('/:id/won', markDealWon);
router.post('/:id/lost', markDealLost);
router.post('/:id/payment', recordPayment);

router.patch('/:id/assign', asyncHandler(async (request, response) => {
  const deal = await Deal.findByIdAndUpdate(
    request.params.id,
    { assignedTo: request.body.assignedTo },
    { new: true }
  ).populate('assignedTo owner', 'name avatar email');
  if (!deal) throw new ApiError(404, 'Deal not found');
  response.json({ success: true, data: deal });
}));

module.exports = router;
