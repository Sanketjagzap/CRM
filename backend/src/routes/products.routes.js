const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Product } = require('../models/Product');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const controller = createCrudController(Product, {
  searchFields: ['name', 'description', 'sku', 'category'],
  defaultSort: '-createdAt',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.patch('/:id/toggle', asyncHandler(async (request, response) => {
  const product = await Product.findById(request.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isActive = !product.isActive;
  await product.save();
  response.json({ success: true, data: product });
}));

router.get('/stats/sales', asyncHandler(async (request, response) => {
  const ownerId = request.user.id;
  const data = await Product.aggregate([
    { $match: { owner: ownerId, isActive: true } },
    { $sort: { totalRevenue: -1 } },
    { $limit: 20 },
  ]);
  response.json({ success: true, data });
}));

module.exports = router;
