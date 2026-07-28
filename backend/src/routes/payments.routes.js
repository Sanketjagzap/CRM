const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Payment } = require('../models/Payment');
const { Deal } = require('../models/Deal');
const { createCrudController } = require('../utils/crudFactory');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const mongoose = require('mongoose');
const { recordPayment } = require('../controllers/dealFinance.controller');

const controller = createCrudController(Payment, {
  defaultSort: '-createdAt',
  populate: 'deal contact company owner paidBy',
});

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.post('/record', recordPayment);

router.patch('/:id/status', asyncHandler(async (request, response) => {
  const { status } = request.body;
  const payment = await Payment.findById(request.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');

  const oldStatus = payment.status;
  payment.status = status;
  if (status === 'paid' && !payment.paidAt) payment.paidAt = new Date();
  if (status === 'paid' && !payment.paidBy) payment.paidBy = request.user.id;
  await payment.save();

  if (oldStatus !== status) {
    const deal = await Deal.findById(payment.deal);
    if (deal) {
      const totalPaidRes = await Payment.aggregate([
        { $match: { deal: new mongoose.Types.ObjectId(payment.deal), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      deal.paidAmount = totalPaidRes[0]?.total || 0;
      deal.outstandingAmount = Math.max(0, (deal.finalAmount || deal.value || 0) - deal.paidAmount);
      await deal.save();
    }
  }
  response.json({ success: true, data: payment });
}));

module.exports = router;
