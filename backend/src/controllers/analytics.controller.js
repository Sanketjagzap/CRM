const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { Lead } = require('../models/Lead');
const { Deal } = require('../models/Deal');
const { User } = require('../models/User');
const { Activity } = require('../models/Activity');
const { Payment } = require('../models/Payment');
const { Product } = require('../models/Product');

const getMetrics = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const { from, to } = request.query;
  const dateFilter = {};
  if (from) dateFilter.createdAt = { ...(dateFilter.createdAt || {}), $gte: new Date(from) };
  if (to) dateFilter.createdAt = { ...(dateFilter.createdAt || {}), $lte: new Date(to) };

  const effectiveRevenueExpr = { $ifNull: ['$finalAmount', '$value'] };

  const wonDateFilter = {};
  if (from) wonDateFilter.wonAt = { $gte: new Date(from) };
  if (to) wonDateFilter.wonAt = { $lte: new Date(to) };

  const [
    leadStats,
    dealStats,
    wonByStage,
    leadSourceStats,
    userPerformance,
    recentDeals,
  ] = await Promise.all([
    Lead.aggregate([
      { $match: { owner: ownerId, ...(from || to ? dateFilter : {}) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, ...(from || to ? dateFilter : {}) } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: effectiveRevenueExpr },
        },
      },
    ]),
    Deal.aggregate([
      {
        $match: {
          owner: ownerId,
          stage: 'won',
          ...(from || to ? (wonDateFilter.wonAt ? wonDateFilter : {}) : {}),
        },
      },
      { $group: { _id: null, totalValue: { $sum: effectiveRevenueExpr }, count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: { owner: ownerId, ...(from || to ? dateFilter : {}) } },
      { $group: { _id: '$source', count: { $sum: 1 }, converted: { $sum: { $cond: ['$converted', 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, ...(from || to ? dateFilter : {}) } },
      {
        $group: {
          _id: '$assignedTo',
          totalValue: { $sum: effectiveRevenueExpr },
          wonValue: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, effectiveRevenueExpr, 0] } },
          wonCount: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } },
          lostCount: { $sum: { $cond: [{ $eq: ['$stage', 'lost'] }, 1, 0] } },
          totalCount: { $sum: 1 },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $sort: { wonValue: -1 } },
    ]),
    Deal.find({ owner: ownerId, stage: { $in: ['won', 'lost'] } }).sort('-updatedAt').limit(10)
      .populate('contact', 'name email').populate('company', 'name').lean(),
  ]);

  const leadMap = {};
  leadStats.forEach((s) => (leadMap[s._id] = s.count));
  const totalLeads = leadStats.reduce((s, l) => s + l.count, 0);
  const convertedLeads = leadStats.find((l) => l._id === 'won')?.count || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 10000) / 100 : 0;

  const dealMap = {};
  dealStats.forEach((s) => (dealMap[s._id] = { count: s.count, value: s.value }));

  const totalDeals = dealStats.reduce((s, d) => s + d.count, 0);
  const wonDeals = dealMap.won?.count || 0;
  const lostDeals = dealMap.lost?.count || 0;
  const wonValue = dealMap.won?.value || 0;
  const lostValue = dealMap.lost?.value || 0;
  const winRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 10000) / 100 : 0;

  const sources = leadSourceStats.map((s) => ({
    source: s._id,
    leads: s.count,
    converted: s.converted,
    conversionRate: s.count > 0 ? Math.round((s.converted / s.count) * 10000) / 100 : 0,
  }));

  const performers = userPerformance.map((u) => ({
    userId: u._id,
    name: u.user[0]?.name || 'Unassigned',
    avatar: u.user[0]?.avatar || '',
    email: u.user[0]?.email || '',
    totalValue: u.totalValue,
    wonValue: u.wonValue,
    wonCount: u.wonCount,
    lostCount: u.lostCount,
    totalCount: u.totalCount,
    winRate: (u.wonCount + u.lostCount) > 0 ? Math.round((u.wonCount / (u.wonCount + u.lostCount)) * 10000) / 100 : 0,
  }));

  response.json({
    success: true,
    data: {
      leads: { total: totalLeads, byStatus: leadMap, converted: convertedLeads, conversionRate },
      deals: {
        total: totalDeals,
        byStage: dealMap,
        won: wonDeals,
        lost: lostDeals,
        wonValue,
        lostValue,
        winRate,
        totalWonValue: wonByStage[0]?.totalValue || wonValue,
        totalWonCount: wonByStage[0]?.count || wonDeals,
      },
      sources,
      performers,
      recentDeals,
    },
  });
});

module.exports = { getMetrics };
