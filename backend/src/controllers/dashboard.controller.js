const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { Lead } = require('../models/Lead');
const { Deal } = require('../models/Deal');
const { Contact } = require('../models/Contact');
const { Company } = require('../models/Company');
const { Task } = require('../models/Task');
const { Activity } = require('../models/Activity');
const { Notification } = require('../models/Notification');
const { Payment } = require('../models/Payment');
const { User } = require('../models/User');

const overview = asyncHandler(async (request, response) => {
  const ownerId = new mongoose.Types.ObjectId(request.user.id);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const effectiveRevenueExpr = { $ifNull: ['$finalAmount', '$value'] };

  const [
    leadsCount,
    contactsCount,
    activeDealsCount,
    wonDealsCount,
    lostDealsCount,
    totalRevenueResult,
    expectedRevenueResult,
    pendingPaymentsResult,
    pendingTasksCount,
    upcomingFollowUps,
    recentActivities,
    recentNotifications,
    dealStages,
    tasksByStatus,
    revenueTrend,
    companiesCount,
  ] = await Promise.all([
    Lead.countDocuments({ owner: ownerId }),
    Contact.countDocuments({ owner: ownerId }),
    Deal.countDocuments({ owner: ownerId, stage: { $nin: ['won', 'lost'] } }),
    Deal.countDocuments({ owner: ownerId, stage: 'won' }),
    Deal.countDocuments({ owner: ownerId, stage: 'lost' }),
    Deal.aggregate([
      { $match: { owner: ownerId, stage: 'won' } },
      { $group: { _id: null, total: { $sum: effectiveRevenueExpr }, avg: { $avg: effectiveRevenueExpr } } },
    ]),
    Deal.aggregate([
      { $match: { owner: ownerId, stage: { $nin: ['won', 'lost'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$expectedRevenue', 0] } } } },
    ]),
    Payment.aggregate([
      { $match: { owner: ownerId, status: 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    Task.countDocuments({ owner: ownerId, status: { $in: ['todo', 'in-progress'] } }),
    Task.find({
      owner: ownerId,
      status: { $in: ['todo', 'in-progress'] },
      $or: [{ followUpAt: { $gte: now, $lte: sevenDaysAhead } }, { dueDate: { $gte: now, $lte: sevenDaysAhead } }],
    }).sort({ followUpAt: 1, dueDate: 1 }).limit(10).populate('assignedTo', 'name avatar').lean(),
    Activity.find({ actor: ownerId }).sort('-occurredAt').limit(20).populate('actor', 'name avatar').lean(),
    Notification.find({ user: ownerId }).sort('-createdAt').limit(10).lean(),
    Deal.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: effectiveRevenueExpr } } },
    ]),
    Task.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Deal.aggregate([
      {
        $match: {
          owner: ownerId,
          stage: 'won',
          $or: [
            { wonAt: { $gte: thirtyDaysAgo } },
            { wonAt: null, createdAt: { $gte: thirtyDaysAgo } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$wonAt', '$createdAt'] },
            },
          },
          revenue: { $sum: effectiveRevenueExpr },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Company.countDocuments({ owner: ownerId }),
  ]);

  const totalRevenue = totalRevenueResult[0]?.total || 0;
  const avgDealRevenue = totalRevenueResult[0]?.avg || 0;
  const expectedRevenue = expectedRevenueResult[0]?.total || 0;
  const pendingPaymentsCount = pendingPaymentsResult[0]?.count || 0;
  const pendingPaymentsAmount = pendingPaymentsResult[0]?.total || 0;

  const stageMap = {};
  dealStages.forEach((s) => (stageMap[s._id] = { count: s.count, value: s.value }));

  const tasksMap = {};
  tasksByStatus.forEach((t) => (tasksMap[t._id] = t.count));

  const trendMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    trendMap[key] = { date: key, revenue: 0, count: 0, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  }
  revenueTrend.forEach((r) => {
    if (trendMap[r._id]) {
      trendMap[r._id].revenue = r.revenue;
      trendMap[r._id].count = r.count;
    }
  });
  const revenueSeries = Object.values(trendMap);

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    monthlyTrend.push({
      name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      start: d,
      end: endD,
    });
  }
  const monthlyRevenuePromises = monthlyTrend.map(async (m) => {
    const r = await Deal.aggregate([
      {
        $match: {
          owner: ownerId,
          stage: 'won',
          $or: [
            { wonAt: { $gte: m.start, $lte: new Date(m.end.getTime() + 86400000) } },
            { wonAt: null, createdAt: { $gte: m.start, $lte: new Date(m.end.getTime() + 86400000) } },
          ],
        },
      },
      { $group: { _id: null, revenue: { $sum: effectiveRevenueExpr } } },
    ]);
    return { name: m.name, revenue: r[0]?.revenue || 0 };
  });
  const monthlyRevenue = await Promise.all(monthlyRevenuePromises);

  response.json({
    success: true,
    data: {
      counters: {
        leadsCount,
        contactsCount,
        companiesCount,
        activeDeals: activeDealsCount,
        wonDeals: wonDealsCount,
        lostDeals: lostDealsCount,
        totalRevenue,
        avgDealRevenue,
        expectedRevenue,
        pendingPaymentsCount,
        pendingPaymentsAmount,
        pendingTasks: pendingTasksCount,
        overdueTasks: tasksMap.overdue || 0,
      },
      dealStages,
      stageMap,
      tasksByStatus,
      tasksMap,
      revenueSeries,
      monthlyRevenue,
      upcomingFollowUps,
      recentActivities,
      recentNotifications,
      conversion: [
        { name: 'New', value: stageMap.new_lead?.count || 0 },
        { name: 'Qualified', value: stageMap.qualified?.count || 0 },
        { name: 'Proposal', value: stageMap.proposal?.count || 0 },
        { name: 'Negotiation', value: stageMap.negotiation?.count || 0 },
        { name: 'Won', value: stageMap.won?.count || 0 },
        { name: 'Lost', value: stageMap.lost?.count || 0 },
      ],
    },
  });
});

module.exports = { overview };
