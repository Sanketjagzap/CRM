const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Contact } = require('../models/Contact');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { Deal } = require('../models/Deal');

const controller = createCrudController(Contact, {
  searchFields: ['name', 'company', 'email', 'phone'],
  populate: 'assignedTo owner companyId',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.post('/:id/notes', asyncHandler(async (request, response) => {
  const contact = await Contact.findById(request.params.id);
  if (!contact) throw new ApiError(404, 'Contact not found');
  contact.notes.unshift({ body: request.body.body, createdBy: request.user.id });
  await contact.save();
  response.json({ success: true, data: contact });
}));

router.patch('/:id/assign', asyncHandler(async (request, response) => {
  const contact = await Contact.findByIdAndUpdate(
    request.params.id,
    { assignedTo: request.body.assignedTo },
    { new: true }
  ).populate('assignedTo owner', 'name avatar email');
  if (!contact) throw new ApiError(404, 'Contact not found');
  response.json({ success: true, data: contact });
}));

router.patch('/:id/company', asyncHandler(async (request, response) => {
  const contact = await Contact.findByIdAndUpdate(
    request.params.id,
    { companyId: request.body.companyId, company: request.body.company || '' },
    { new: true }
  ).populate('companyId', 'name industry');
  if (!contact) throw new ApiError(404, 'Contact not found');
  response.json({ success: true, data: contact });
}));

router.get('/:id/deals', asyncHandler(async (request, response) => {
  const { id } = request.params;
  const deals = await Deal.find({
    owner: request.user.id,
    $or: [{ contact: id }, { _id: { $in: (await Contact.findById(id))?.deals || [] } }],
  }).populate('assignedTo company', 'name avatar').sort('-createdAt').lean();
  response.json({ success: true, data: deals });
}));

module.exports = router;
