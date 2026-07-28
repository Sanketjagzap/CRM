const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { createCrudController } = require('../utils/crudFactory');
const { logActivity } = require('../services/activity.service');

function createEntityController(Model, entityType, options = {}) {
  const crud = createCrudController(Model, options);

  return {
    list: crud.list,
    create: asyncHandler(async (request, response) => {
      const payload = { ...request.body, owner: request.user.id, assignedTo: request.body.assignedTo || request.user.id };
      const entity = await Model.create(payload);
      await logActivity({ actor: request.user.id, type: 'create', entityType, entityId: entity._id, title: `${entityType} created`, meta: { payload } });
      response.status(201).json({ success: true, data: entity });
    }),
    getById: crud.getById,
    update: asyncHandler(async (request, response) => {
      const entity = await Model.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true });
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      await logActivity({ actor: request.user.id, type: 'update', entityType, entityId: entity._id, title: `${entityType} updated`, meta: { payload: request.body } });
      response.json({ success: true, data: entity });
    }),
    remove: asyncHandler(async (request, response) => {
      const entity = await Model.findByIdAndDelete(request.params.id);
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      await logActivity({ actor: request.user.id, type: 'delete', entityType, entityId: entity._id, title: `${entityType} deleted`, meta: {} });
      response.json({ success: true, message: 'Record deleted' });
    }),
    addNote: asyncHandler(async (request, response) => {
      const entity = await Model.findById(request.params.id);
      if (!entity) {
        throw new ApiError(404, 'Record not found');
      }
      entity.notes = entity.notes || [];
      entity.notes.unshift({ body: request.body.body, createdBy: request.user.id, createdAt: new Date() });
      await entity.save();
      response.json({ success: true, data: entity });
    }),
  };
}

module.exports = { createEntityController };