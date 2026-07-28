const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { Deal } = require('../models/Deal');
const { Payment } = require('../models/Payment');
const { Contact } = require('../models/Contact');
const { Company } = require('../models/Company');
const { Product } = require('../models/Product');
const { logActivity } = require('../services/activity.service');

function recomputeDealAmounts(deal) {
  if (!deal.value || deal.value === 0) {
    deal.value = deal.finalAmount || 0;
  }
  if (!deal.finalAmount || deal.finalAmount === 0) {
    deal.finalAmount = deal.value || 0;
  }
  deal.outstandingAmount = Math.max(0, (deal.finalAmount || deal.value || 0) - (deal.paidAmount || 0));
  deal.expectedRevenue = ((deal.value || deal.finalAmount || 0) * ((deal.probability || 0) / 100)) || 0;
}

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

const recordPayment = asyncHandler(async (request, response) => {
  const ownerId = request.user.id;
  const dealId = request.params.id || request.body.deal || request.body.dealId;
  const { amount, method = 'bank_transfer', status = 'paid', reference, note, notes, dueDate, paidAt } = request.body;
  const finalNotes = notes || note || '';

  if (!dealId || !amount) throw new ApiError(400, 'Deal and amount are required');

  const deal = await Deal.findById(dealId);
  if (!deal) throw new ApiError(404, 'Deal not found');

  const payment = await Payment.create({
    deal: dealId,
    contact: deal.contact,
    company: deal.company,
    amount,
    method,
    status,
    reference: reference || '',
    notes: finalNotes,
    dueDate,
    paidAt: status === 'paid' ? (paidAt || new Date()) : null,
    owner: ownerId,
    paidBy: status === 'paid' ? ownerId : null,
  });

  if (status === 'paid') {
    const totalPaidRes = await Payment.aggregate([
      { $match: { deal: new mongoose.Types.ObjectId(dealId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    deal.paidAmount = totalPaidRes[0]?.total || 0;
    recomputeDealAmounts(deal);
    await deal.save();
  }

  await recomputeCompanyTotals(deal.company);
  await recomputeContactTotals(deal.contact);

  try {
    await logActivity({
      actor: ownerId,
      type: 'payment',
      entityType: 'deal',
      entityId: dealId,
      title: `Payment of ${amount} recorded`,
      description: `${status} payment via ${method}`,
      meta: { paymentId: payment._id, amount, method, status },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.status(201).json({ success: true, data: payment });
});

const addProductsToDeal = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { products = [] } = request.body;
  const ownerId = request.user.id;

  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');

  const resolvedProducts = [];
  for (const p of products) {
    let unitPrice = p.unitPrice;
    let taxRate = p.taxRate ?? 0;
    let discountRate = p.discountRate ?? 0;
    let description = p.description || '';
    let productName = p.name;

    if (p.product) {
      const prod = await Product.findById(p.product);
      if (prod) {
        productName = productName || prod.name;
        unitPrice = unitPrice ?? prod.price;
        taxRate = taxRate ?? prod.taxRate;
        discountRate = discountRate ?? prod.discountRate;
        description = description || prod.description;
      }
    }

    const quantity = p.quantity || 1;
    const lineSubtotal = unitPrice * quantity;
    const discountAmount = p.discountAmount || (lineSubtotal * discountRate) / 100;
    const afterDiscount = lineSubtotal - discountAmount;
    const taxAmount = p.taxAmount || (afterDiscount * taxRate) / 100;
    const total = p.total || afterDiscount + taxAmount;

    resolvedProducts.push({
      product: p.product || null,
      name: productName,
      description,
      quantity,
      unitPrice,
      discountRate,
      discountAmount,
      taxRate,
      taxAmount,
      total,
    });
  }

  deal.products = resolvedProducts;
  deal.subtotal = resolvedProducts.reduce((s, p) => s + (p.unitPrice * p.quantity), 0);
  deal.discountAmount = resolvedProducts.reduce((s, p) => s + p.discountAmount, 0);
  deal.taxAmount = resolvedProducts.reduce((s, p) => s + p.taxAmount, 0);
  deal.finalAmount = resolvedProducts.reduce((s, p) => s + p.total, 0);
  deal.value = deal.finalAmount;
  recomputeDealAmounts(deal);

  await deal.save();

  for (const p of resolvedProducts) {
    if (p.product) {
      await Product.findByIdAndUpdate(p.product, {
        $inc: { unitsSold: p.quantity, totalRevenue: p.total },
      });
    }
  }

  try {
    await logActivity({
      actor: ownerId,
      type: 'update',
      entityType: 'deal',
      entityId: deal._id,
      title: `Products added to deal`,
      description: `${resolvedProducts.length} product(s) added`,
      meta: { productsCount: resolvedProducts.length },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.json({ success: true, data: deal });
});

const markDealWon = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const ownerId = request.user.id;
  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');

  deal.stage = 'won';
  deal.wonAt = new Date();
  deal.probability = 100;
  deal.history.unshift({ stage: 'won', changedBy: ownerId });
  recomputeDealAmounts(deal);
  await deal.save();

  await recomputeCompanyTotals(deal.company);
  await recomputeContactTotals(deal.contact);

  try {
    await logActivity({
      actor: ownerId,
      type: 'stage_change',
      entityType: 'deal',
      entityId: deal._id,
      title: 'Deal marked as Won',
      meta: { stage: 'won', amount: deal.finalAmount || deal.value },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.json({ success: true, data: deal });
});

const markDealLost = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { reason = '' } = request.body;
  const ownerId = request.user.id;

  const deal = await Deal.findById(id);
  if (!deal) throw new ApiError(404, 'Deal not found');

  deal.stage = 'lost';
  deal.lostAt = new Date();
  deal.lostReason = reason;
  deal.probability = 0;
  deal.history.unshift({ stage: 'lost', changedBy: ownerId });
  recomputeDealAmounts(deal);
  await deal.save();

  try {
    await logActivity({
      actor: ownerId,
      type: 'stage_change',
      entityType: 'deal',
      entityId: deal._id,
      title: 'Deal marked as Lost',
      description: reason,
      meta: { stage: 'lost', reason },
    });
  } catch (activityErr) {
    console.warn('Activity log failed (non-fatal):', activityErr.message);
  }

  response.json({ success: true, data: deal });
});

module.exports = { recordPayment, addProductsToDeal, markDealWon, markDealLost };
