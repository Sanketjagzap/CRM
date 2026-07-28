const mongoose = require('mongoose');
const { asyncHandler } = require('./asyncHandler');
const { ApiError } = require('./ApiError');
const { getPagination } = require('./paginate');

function buildSearchFilter(query, searchFields = []) {
  const filter = {};

  if (query.search && searchFields.length) {
    filter.$or = searchFields.map((field) => ({ [field]: { $regex: query.search, $options: 'i' } }));
  }

  if (query.status) filter.status = query.status;
  if (query.stage) filter.stage = query.stage;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo && mongoose.isValidObjectId(query.assignedTo)) filter.assignedTo = query.assignedTo;
  if (query.owner && mongoose.isValidObjectId(query.owner)) filter.owner = query.owner;

  return filter;
}

function createCrudController(Model, options = {}) {
  const searchFields = options.searchFields || ['name'];
  const defaultSort = options.defaultSort || '-createdAt';
  const populate = options.populate || '';

  return {
    list: asyncHandler(async (request, response) => {
      const { page, limit, skip } = getPagination(request.query);
      const filter = buildSearchFilter(request.query, searchFields);
      const [items, total] = await Promise.all([
        Model.find(filter).populate(populate).sort(request.query.sort || defaultSort).skip(skip).limit(limit),
        Model.countDocuments(filter),
      ]);

      response.json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
      });
    }),
    create: asyncHandler(async (request, response) => {
      const entity = await Model.create({ ...request.body, owner: request.user.id });
      response.status(201).json({ success: true, data: entity });
    }),
    getById: asyncHandler(async (request, response) => {
      const entity = await Model.findById(request.params.id).populate(populate);
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      response.json({ success: true, data: entity });
    }),
    update: asyncHandler(async (request, response) => {
      const entity = await Model.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true }).populate(populate);
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      response.json({ success: true, data: entity });
    }),
    remove: asyncHandler(async (request, response) => {
      const entity = await Model.findByIdAndDelete(request.params.id);
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      response.json({ success: true, message: 'Record deleted' });
    }),
  };
}

module.exports = { createCrudController };