const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Company } = require('../models/Company');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { Contact } = require('../models/Contact');
const { Deal } = require('../models/Deal');

const controller = createCrudController(Company, {
  searchFields: ['name', 'industry', 'email', 'phone'],
  populate: 'assignedTo owner',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.get('/:id/contacts', asyncHandler(async (request, response) => {
  const { id } = request.params;
  const contacts = await Contact.find({ companyId: id, owner: request.user.id })
    .populate('assignedTo', 'name avatar')
    .sort('-createdAt')
    .lean();
  response.json({ success: true, data: contacts });
}));

router.get('/:id/deals', asyncHandler(async (request, response) => {
  const { id } = request.params;
  const deals = await Deal.find({ company: id, owner: request.user.id })
    .populate('assignedTo contact', 'name avatar title email')
    .sort('-createdAt')
    .lean();
  response.json({ success: true, data: deals });
}));

router.post('/:id/notes', asyncHandler(async (request, response) => {
  const company = await Company.findById(request.params.id);
  if (!company) throw new ApiError(404, 'Company not found');
  company.notes.unshift({ body: request.body.body, createdBy: request.user.id });
  await company.save();
  response.json({ success: true, data: company });
}));

router.patch('/:id/assign', asyncHandler(async (request, response) => {
  const company = await Company.findByIdAndUpdate(
    request.params.id,
    { assignedTo: request.body.assignedTo },
    { new: true }
  );
  if (!company) throw new ApiError(404, 'Company not found');
  response.json({ success: true, data: company });
}));

module.exports = router;
