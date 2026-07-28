const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { Activity } = require('../models/Activity');
const { getPagination } = require('../utils/paginate');
const { logActivity } = require('../services/activity.service');

const list = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const ownerId = request.user.id;
  const filter = {};
  if (request.query.type) filter.type = request.query.type;
  if (request.query.entityType) filter.entityType = request.query.entityType;
  if (request.query.actor && mongoose.isValidObjectId(request.query.actor)) filter.actor = request.query.actor;
  if (request.query.entityId && mongoose.isValidObjectId(request.query.entityId)) filter.entityId = request.query.entityId;
  if (!request.query.all) filter.$or = [{ actor: ownerId }];
  if (request.query.from) filter.occurredAt = { ...(filter.occurredAt || {}), $gte: new Date(request.query.from) };
  if (request.query.to) filter.occurredAt = { ...(filter.occurredAt || {}), $lte: new Date(request.query.to) };

  const [items, total] = await Promise.all([
    Activity.find(filter).populate('actor', 'name avatar email').sort(request.query.sort || '-occurredAt').skip(skip).limit(limit),
    Activity.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

const timeline = asyncHandler(async (request, response) => {
  const { entityType, entityId } = request.params;
  if (!entityType || !mongoose.isValidObjectId(entityId)) {
    throw new ApiError(400, 'Valid entityType and entityId are required');
  }
  const [items] = await Promise.all([
    Activity.find({ entityType, entityId })
      .populate('actor', 'name avatar email')
      .sort('-occurredAt')
      .limit(200),
  ]);
  response.json({ success: true, data: items });
});

const create = asyncHandler(async (request, response) => {
  const { type, entityType, entityId, title, description, meta, duration, outcome, occurredAt } = request.body;
  if (!type || !entityType || !entityId || !title) {
    throw new ApiError(400, 'type, entityType, entityId, title are required');
  }
  if (!mongoose.isValidObjectId(entityId)) throw new ApiError(400, 'Invalid entityId');

  const activity = await logActivity({
    actor: request.user.id,
    type,
    entityType,
    entityId,
    title,
    description: description || '',
    meta: meta || {},
    duration: duration || 0,
    outcome: outcome || '',
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
  });
  await activity.populate('actor', 'name avatar email');
  response.status(201).json({ success: true, data: activity });
});

const remove = asyncHandler(async (request, response) => {
  const activity = await Activity.findById(request.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');
  if (String(activity.actor) !== String(request.user.id) && request.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden');
  }
  await Activity.findByIdAndDelete(request.params.id);
  response.json({ success: true, message: 'Activity deleted' });
});

module.exports = { list, timeline, create, remove };
