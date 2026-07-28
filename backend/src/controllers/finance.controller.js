const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { Deal } = require('../models/Deal');
const { Payment } = require('../models/Payment');
const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { Product } = require('../models/Product');

const getOverview = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const { from, to } = request.query;
  const now = new Date();

  const matchFilter = { owner: ownerId };
  const dateMatchFilter = { owner: ownerId };
  if (from || to) {
    dateMatchFilter.createdAt = {};
    if (from) dateMatchFilter.createdAt.$gte = new Date(from);
    if (to) dateMatchFilter.createdAt.$lte = new Date(to);
  }
  const wonDateFilter = { owner: ownerId, stage: 'won' };
  if (from || to) {
    wonDateFilter.wonAt = {};
    if (from) wonDateFilter.wonAt.$gte = new Date(from);
    if (to) wonDateFilter.wonAt.$lte = new Date(to);
  }

  const [
    totalWonRes,
    expectedRes,
    paymentsRes,
    paidRes,
    pendingRes,
    discountTaxRes,
  ] = await Promise.all([
    Deal.aggregate([
      { $match: wonDateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalDealValue: { $sum: '$value' },
          dealsCount: { $sum: 1 },
          avgDealValue: { $avg: '$finalAmount' },
          largestDeal: { $max: '$finalAmount' },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { ...matchFilter, stage: { $nin: ['won', 'lost'] } } },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: '$expectedRevenue' },
          totalValue: { $sum: '$value' },
          dealsCount: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: dateMatchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { ...dateMatchFilter, status: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { owner: ownerId, status: 'pending' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate([
      { $match: wonDateFilter },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalSubtotal: { $sum: '$subtotal' },
        },
      },
    ]),
  ]);

  const totalRevenue = totalWonRes[0]?.totalRevenue || 0;
  const wonDealRevenue = totalWonRes[0]?.totalDealValue || 0;
  const dealsWonCount = totalWonRes[0]?.dealsCount || 0;
  const avgDealRevenue = totalWonRes[0]?.avgDealValue || 0;
  const largestDeal = totalWonRes[0]?.largestDeal || 0;

  const expectedRevenue = expectedRes[0]?.totalExpected || 0;
  const pipelineValue = expectedRes[0]?.totalValue || 0;
  const activeDealsCount = expectedRes[0]?.dealsCount || 0;

  const paidAmount = paidRes[0]?.total || 0;
  const pendingAmount = pendingRes[0]?.total || 0;
  const pendingCount = pendingRes[0]?.count || 0;
  const outstandingAmount = Math.max(0, totalRevenue - paidAmount);

  const totalDiscount = discountTaxRes[0]?.totalDiscount || 0;
  const totalTax = discountTaxRes[0]?.totalTax || 0;
  const totalSubtotal = discountTaxRes[0]?.totalSubtotal || 0;
  const netRevenue = totalRevenue - totalDiscount + totalTax;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

  const [monthlyRes, yearlyRes, lastMonthRes, lastYearRes] = await Promise.all([
    Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won', wonAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' } } },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won', wonAt: { $gte: yearStart } } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' } } },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won', wonAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' } } },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won', wonAt: { $gte: lastYearStart, $lte: lastYearEnd } } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' } } },
    ]),
  ]);

  const monthlyRevenue = monthlyRes[0]?.revenue || 0;
  const yearlyRevenue = yearlyRes[0]?.revenue || 0;
  const lastMonthRevenue = lastMonthRes[0]?.revenue || 0;
  const lastYearRevenue = lastYearRes[0]?.revenue || 0;

  const monthlyGrowth = lastMonthRevenue > 0
    ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 100) / 100
    : monthlyRevenue > 0 ? 100 : 0;
  const yearlyGrowth = lastYearRevenue > 0
    ? Math.round(((yearlyRevenue - lastYearRevenue) / lastYearRevenue) * 100 * 100) / 100
    : yearlyRevenue > 0 ? 100 : 0;

  response.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        wonDealRevenue,
        expectedRevenue,
        pipelineValue,
        monthlyRevenue,
        yearlyRevenue,
        paidAmount,
        pendingAmount,
        pendingCount,
        outstandingAmount,
        totalDiscount,
        totalTax,
        totalSubtotal,
        netRevenue,
        dealsWonCount,
        activeDealsCount,
        avgDealRevenue,
        largestDeal,
        monthlyGrowth,
        yearlyGrowth,
      },
      period: { from, to },
    },
  });
});

const revenueByUser = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const result = await Deal.aggregate([
    { $match: { owner: ownerId, stage: 'won' } },
    { $group: { _id: '$owner', totalRevenue: { $sum: '$finalAmount' }, dealsCount: { $sum: 1 } } },
    { $sort: { totalRevenue: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  ]);

  const data = result.map((r) => ({
    userId: r._id,
    name: r.user[0]?.name || 'Unknown',
    email: r.user[0]?.email || '',
    avatar: r.user[0]?.avatar || '',
    totalRevenue: r.totalRevenue,
    dealsCount: r.dealsCount,
  }));

  response.json({ success: true, data });
});

const revenueByCompany = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const result = await Deal.aggregate([
    { $match: { owner: ownerId, stage: 'won', company: { $ne: null } } },
    { $group: { _id: '$company', totalRevenue: { $sum: '$finalAmount' }, dealsCount: { $sum: 1 }, outstanding: { $sum: '$outstandingAmount' } } },
    { $sort: { totalRevenue: -1 } },
    { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
  ]);

  const data = result.map((r) => ({
    companyId: r._id,
    name: r.company[0]?.name || 'Unknown',
    totalRevenue: r.totalRevenue,
    dealsCount: r.dealsCount,
    pendingAmount: r.company[0]?.pendingAmount || r.outstanding || 0,
  }));

  response.json({ success: true, data });
});

const revenueByProduct = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const result = await Deal.aggregate([
    { $match: { owner: ownerId, stage: 'won' } },
    { $unwind: '$products' },
    {
      $group: {
        _id: { name: '$products.name', productId: '$products.product' },
        totalRevenue: { $sum: '$products.total' },
        unitsSold: { $sum: '$products.quantity' },
        dealsCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  const data = result.map((r) => ({
    productId: r._id.productId,
    name: r._id.name,
    totalRevenue: r.totalRevenue,
    unitsSold: r.unitsSold,
    dealsCount: r.dealsCount,
  }));

  response.json({ success: true, data });
});

const monthlyRevenueSeries = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const { months = 12 } = request.query;
  const n = Math.min(parseInt(months) || 12, 36);
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: d.toISOString().slice(0, 7),
      name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      start: d,
      end: new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59),
    });
  }
  const promises = buckets.map(async (b) => {
    const r = await Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won', wonAt: { $gte: b.start, $lte: b.end } } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' }, dealsCount: { $sum: 1 } } },
    ]);
    const ex = await Deal.aggregate([
      { $match: { owner: ownerId, createdAt: { $gte: b.start, $lte: b.end }, stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, expected: { $sum: '$expectedRevenue' }, dealsCount: { $sum: 1 } } },
    ]);
    return {
      name: b.name,
      key: b.key,
      revenue: r[0]?.revenue || 0,
      wonDeals: r[0]?.dealsCount || 0,
      expectedRevenue: ex[0]?.expected || 0,
      activeDeals: ex[0]?.dealsCount || 0,
    };
  });
  const data = await Promise.all(promises);
  response.json({ success: true, data });
});

module.exports = { getOverview, revenueByUser, revenueByCompany, revenueByProduct, monthlyRevenueSeries };
