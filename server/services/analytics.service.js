const mongoose = require('mongoose');
const Entry = require('../models/Entry.model');
const Employee = require('../models/Employee.model');
const { calculateScore, getLevel, computeProductivityScore } = require('./productivity.service');

// --- In-memory cache (5 min TTL) ---
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const withCache = async (key, fn) => {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const data = await fn();
  _cache.set(key, { data, ts: Date.now() });
  return data;
};

const clearCache = () => _cache.clear();

// --- Helpers ---
const toOid = (id) => new mongoose.Types.ObjectId(id);

const buildBaseFilter = (query, status = 'approved') => {
  const filter = {};
  if (status) filter.status = status;
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      const e = new Date(query.endDate);
      e.setHours(23, 59, 59, 999);
      filter.date.$lte = e;
    }
  }
  if (query.department) filter.department = toOid(query.department);
  if (query.project) filter.project = toOid(query.project);
  if (query.employee) filter.employee = toOid(query.employee);
  return filter;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── 1. Productivity daily series ─────────────────────────────────────────────
const getProductivity = async (query) => {
  const filter = buildBaseFilter(query);
  return Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        avgItemsPerHour: { $avg: '$avgItemsPerHour' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', totalItems: 1, totalHours: 1, entryCount: 1, avgItemsPerHour: 1 } },
  ]);
};

// ─── 2. Monthly trend ─────────────────────────────────────────────────────────
const getMonthlyTrend = async (query) => {
  const year = parseInt(query.year) || new Date().getFullYear();
  const filter = buildBaseFilter({ ...query, startDate: `${year}-01-01`, endDate: `${year}-12-31` });

  const raw = await Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $month: '$date' },
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byMonth = Object.fromEntries(raw.map((r) => [r._id, r]));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTH_NAMES[i],
    totalItems: byMonth[i + 1]?.totalItems || 0,
    totalHours: +(byMonth[i + 1]?.totalHours || 0).toFixed(1),
    entryCount: byMonth[i + 1]?.entryCount || 0,
  }));
};

// ─── 3. Weekly trend ──────────────────────────────────────────────────────────
const getWeeklyTrend = async (query) => {
  const weeks = parseInt(query.weeks) || 12;
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = query.startDate ? new Date(query.startDate) : (() => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - weeks * 7);
    return d;
  })();

  const filter = buildBaseFilter({ ...query, startDate: startDate.toISOString(), endDate: endDate.toISOString() });

  const raw = await Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { year: { $isoWeekYear: '$date' }, week: { $isoWeek: '$date' } },
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  return raw.map((r) => ({
    year: r._id.year,
    week: r._id.week,
    label: `W${String(r._id.week).padStart(2, '0')}/${r._id.year}`,
    totalItems: r.totalItems,
    totalHours: +r.totalHours.toFixed(1),
    entryCount: r.entryCount,
  }));
};

// ─── 4. Yearly trend ──────────────────────────────────────────────────────────
const getYearlyTrend = async () => {
  const raw = await Entry.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: { $year: '$date' },
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        year: '$_id', _id: 0,
        totalItems: 1, totalHours: 1, entryCount: 1,
        employeeCount: { $size: '$uniqueEmployees' },
      },
    },
  ]);
  return raw;
};

// ─── 5. Department analytics ──────────────────────────────────────────────────
const getDepartmentAnalytics = async (query) => {
  const filter = buildBaseFilter(query);
  delete filter.department; // grouping BY department

  return Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$department',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' },
        avgItemsPerHour: { $avg: '$avgItemsPerHour' },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ['$dept.name', 'Unknown'] },
        code: { $ifNull: ['$dept.code', '—'] },
        totalItems: 1,
        totalHours: 1,
        entryCount: 1,
        employeeCount: { $size: '$uniqueEmployees' },
        avgItemsPerHour: 1,
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
};

// ─── 6. Project analytics ─────────────────────────────────────────────────────
const getProjectAnalytics = async (query) => {
  const filter = buildBaseFilter(query);
  delete filter.project; // grouping BY project

  return Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$project',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employee' },
        avgItemsPerHour: { $avg: '$avgItemsPerHour' },
      },
    },
    { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
    { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ['$project.name', 'Unknown'] },
        code: { $ifNull: ['$project.projectCode', '—'] },
        totalItems: 1,
        totalHours: 1,
        entryCount: 1,
        employeeCount: { $size: '$uniqueEmployees' },
        avgItemsPerHour: 1,
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
};

// ─── 7. Top performers ────────────────────────────────────────────────────────
const getTopEmployees = async (query) => {
  const filter = buildBaseFilter(query);
  const limit = Math.min(50, parseInt(query.limit) || 10);

  const Settings = require('../models/Settings.model');
  const settings = await Settings.findOne();
  const globalTarget = settings?.dailyTarget || 50;

  const raw = await Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$employee',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        avgItemsPerHour: { $avg: '$avgItemsPerHour' },
      },
    },
    { $sort: { totalItems: -1 } },
    { $limit: limit },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
    { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'departments', localField: 'emp.department', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        employeeId: { $ifNull: ['$emp.employeeId', '—'] },
        employeeName: { $ifNull: ['$emp.name', 'Unknown'] },
        departmentName: { $ifNull: ['$dept.name', '—'] },
        photo: '$emp.photo',
        dailyTarget: { $ifNull: ['$emp.dailyTarget', globalTarget] },
        totalItems: 1, totalHours: 1, entryCount: 1, avgItemsPerHour: 1,
      },
    },
  ]);

  return raw.map((r, i) => {
    const score = calculateScore(r.totalItems, (r.dailyTarget || globalTarget) * (r.entryCount || 1));
    return {
      rank: i + 1,
      ...r,
      avgProductivityScore: score,
      performanceLevel: getLevel(score)?.label || 'Unknown',
    };
  });
};

// ─── 8. Low performers ────────────────────────────────────────────────────────
const getLowPerformers = async (query) => {
  const filter = buildBaseFilter(query);
  const threshold = parseFloat(query.threshold);
  const effectiveThreshold = isNaN(threshold) ? 75 : Math.min(100, Math.max(0, threshold));
  const limit = Math.min(100, parseInt(query.limit) || 20);

  const Settings = require('../models/Settings.model');
  const settings = await Settings.findOne();
  const globalTarget = settings?.dailyTarget || 50;

  const raw = await Entry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$employee',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
      },
    },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
    { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'departments', localField: 'emp.department', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        employeeId: { $ifNull: ['$emp.employeeId', '—'] },
        employeeName: { $ifNull: ['$emp.name', 'Unknown'] },
        departmentName: { $ifNull: ['$dept.name', '—'] },
        dailyTargetSnapshot: { $ifNull: ['$emp.dailyTarget', globalTarget] },
        totalItems: 1, totalHours: 1, entryCount: 1,
      },
    },
  ]);

  const withScores = raw
    .map((r) => {
      const score = calculateScore(r.totalItems, (r.dailyTargetSnapshot || globalTarget) * (r.entryCount || 1));
      return { ...r, avgProductivityScore: score, performanceLevel: getLevel(score)?.label || 'Unknown' };
    })
    .filter((r) => r.avgProductivityScore < effectiveThreshold)
    .sort((a, b) => a.avgProductivityScore - b.avgProductivityScore)
    .slice(0, limit);

  const avgScore = withScores.length
    ? +(withScores.reduce((s, r) => s + r.avgProductivityScore, 0) / withScores.length).toFixed(1)
    : 0;

  return { rows: withScores, summary: { count: withScores.length, threshold: effectiveThreshold, avgScore } };
};

// ─── 9. Approval time analytics ───────────────────────────────────────────────
const getApprovalTimeAnalytics = async (query) => {
  const filter = { status: 'approved', approvedAt: { $ne: null }, submittedAt: { $ne: null } };
  if (query.startDate) filter.date = { $gte: new Date(query.startDate) };
  if (query.endDate) filter.date = { ...filter.date, $lte: new Date(query.endDate) };
  if (query.department) filter.department = toOid(query.department);

  const [byDept, overall] = await Promise.all([
    Entry.aggregate([
      { $match: filter },
      { $addFields: { approvalHours: { $divide: [{ $subtract: ['$approvedAt', '$submittedAt'] }, 3600000] } } },
      {
        $group: {
          _id: '$department',
          avgHours: { $avg: '$approvalHours' },
          maxHours: { $max: '$approvalHours' },
          minHours: { $min: '$approvalHours' },
          count: { $sum: 1 },
        },
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          department: { $ifNull: ['$dept.name', 'Unknown'] },
          avgHours: { $round: ['$avgHours', 1] },
          maxHours: { $round: ['$maxHours', 1] },
          minHours: { $round: ['$minHours', 1] },
          count: 1,
        },
      },
      { $sort: { avgHours: 1 } },
    ]),
    Entry.aggregate([
      { $match: filter },
      { $addFields: { approvalHours: { $divide: [{ $subtract: ['$approvedAt', '$submittedAt'] }, 3600000] } } },
      { $group: { _id: null, avgHours: { $avg: '$approvalHours' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    byDepartment: byDept,
    overall: {
      avgHours: overall[0] ? +overall[0].avgHours.toFixed(1) : 0,
      count: overall[0]?.count || 0,
    },
  };
};

// ─── 10. Rejection analytics ──────────────────────────────────────────────────
const getRejectionAnalytics = async (query) => {
  const baseFilter = {};
  if (query.startDate) baseFilter.date = { $gte: new Date(query.startDate) };
  if (query.endDate) baseFilter.date = { ...baseFilter.date, $lte: new Date(query.endDate) };
  if (query.department) baseFilter.department = toOid(query.department);

  const [totalSubmitted, totalRejected, byEmployee, byDepartment] = await Promise.all([
    Entry.countDocuments({ ...baseFilter, status: { $in: ['submitted', 'approved', 'rejected'] } }),
    Entry.countDocuments({ ...baseFilter, status: 'rejected' }),
    Entry.aggregate([
      { $match: { ...baseFilter, status: 'rejected' } },
      { $group: { _id: '$employee', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
      { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$emp.name', 'Unknown'] }, employeeId: '$emp.employeeId', count: 1, _id: 0 } },
    ]),
    Entry.aggregate([
      { $match: { ...baseFilter, status: 'rejected' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalSubmitted,
    totalRejected,
    rejectionRate: totalSubmitted ? +((totalRejected / totalSubmitted) * 100).toFixed(1) : 0,
    byEmployee,
    byDepartment,
  };
};

// ─── 11. Dashboard KPI (cached) ───────────────────────────────────────────────
const getDashboardKpi = async (query = {}) => {
  const cacheKey = `kpi:${query.startDate || ''}:${query.endDate || ''}`;
  return withCache(cacheKey, async () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const baseFilter = buildBaseFilter(query);

    const [
      totalAgg, thisMonthAgg, lastMonthAgg,
      pendingApprovals, activeEmployees,
      rejectedCount, draftCount,
    ] = await Promise.all([
      Entry.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' }, count: { $sum: 1 } } },
      ]),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: thisMonthStart } } },
        { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' }, count: { $sum: 1 } } },
      ]),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' } } },
      ]),
      Entry.countDocuments({ status: 'submitted' }),
      Employee.countDocuments({ status: 'active' }),
      Entry.countDocuments({ ...baseFilter, status: 'rejected' }),
      Entry.countDocuments({ ...baseFilter, status: 'draft' }),
    ]);

    const total = totalAgg[0] || { totalItems: 0, totalHours: 0, count: 0 };
    const thisMonth = thisMonthAgg[0] || { totalItems: 0, totalHours: 0, count: 0 };
    const lastMonth = lastMonthAgg[0] || { totalItems: 0, totalHours: 0 };

    const itemsGrowth = lastMonth.totalItems > 0
      ? +(((thisMonth.totalItems - lastMonth.totalItems) / lastMonth.totalItems) * 100).toFixed(1) : null;
    const hoursGrowth = lastMonth.totalHours > 0
      ? +(((thisMonth.totalHours - lastMonth.totalHours) / lastMonth.totalHours) * 100).toFixed(1) : null;

    const Settings = require('../models/Settings.model');
    const settings = await Settings.findOne();
    const avgScore = total.count > 0 && settings?.dailyTarget
      ? calculateScore(total.totalItems / total.count, settings.dailyTarget) : 0;

    return {
      totalItems: total.totalItems,
      totalHours: +total.totalHours.toFixed(1),
      totalEntries: total.count,
      activeEmployees,
      pendingApprovals,
      rejectedCount,
      draftCount,
      avgProductivityScore: avgScore,
      monthlyItems: thisMonth.totalItems,
      monthlyHours: +thisMonth.totalHours.toFixed(1),
      monthlyEntries: thisMonth.count,
      itemsGrowth,
      hoursGrowth,
    };
  });
};

// ─── 12. Employee score ───────────────────────────────────────────────────────
const getEmployeeScore = async (employeeId, period = 'daily') => {
  const now = new Date();
  let start, end;
  if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === 'weekly') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = new Date(now); start.setDate(now.getDate() + diff); start.setHours(0, 0, 0, 0);
    end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(); start.setHours(0, 0, 0, 0);
    end = new Date(); end.setHours(23, 59, 59, 999);
  }

  const agg = await Entry.aggregate([
    { $match: { employee: toOid(employeeId), status: 'approved', date: { $gte: start, $lte: end } } },
    { $group: { _id: null, totalItems: { $sum: '$totalItems' } } },
  ]);

  const totalItems = agg[0]?.totalItems || 0;
  return computeProductivityScore(employeeId, totalItems, period);
};

// ─── 13. Export analytics ─────────────────────────────────────────────────────
const exportAnalytics = async ({ subType = 'productivity', format = 'pdf', ...query }) => {
  const { generate } = require('./export.service');
  const path = require('path');
  const Settings = require('../models/Settings.model');
  const settings = await Settings.findOne();

  let rows = [];
  let title = 'Analytics Report';

  switch (subType) {
    case 'monthly-trend': {
      rows = await getMonthlyTrend(query);
      title = 'Monthly Productivity Trend';
      break;
    }
    case 'weekly-trend': {
      rows = await getWeeklyTrend(query);
      title = 'Weekly Productivity Trend';
      break;
    }
    case 'yearly-trend': {
      rows = await getYearlyTrend();
      title = 'Yearly Productivity Trend';
      break;
    }
    case 'department': {
      const data = await getDepartmentAnalytics(query);
      rows = data.map((r) => ({
        departmentName: r.name, totalItems: r.totalItems,
        totalHours: r.totalHours, entryCount: r.entryCount,
        employeeCount: r.employeeCount,
        avgItemsPerHour: +(r.avgItemsPerHour || 0).toFixed(2),
      }));
      title = 'Department Analytics';
      break;
    }
    case 'project': {
      const data = await getProjectAnalytics(query);
      rows = data.map((r) => ({
        projectName: r.name, projectCode: r.code,
        totalItems: r.totalItems, totalHours: r.totalHours,
        entryCount: r.entryCount, employeeCount: r.employeeCount,
        avgItemsPerHour: +(r.avgItemsPerHour || 0).toFixed(2),
      }));
      title = 'Project Analytics';
      break;
    }
    case 'top-performers': {
      rows = await getTopEmployees(query);
      title = 'Top Performers';
      break;
    }
    case 'low-performers': {
      const { rows: lowRows } = await getLowPerformers(query);
      rows = lowRows;
      title = 'Low Performers';
      break;
    }
    case 'approval-time': {
      const { byDepartment } = await getApprovalTimeAnalytics(query);
      rows = byDepartment.map((r) => ({
        department: r.department,
        avgHours: r.avgHours,
        minHours: r.minHours,
        maxHours: r.maxHours,
        count: r.count,
      }));
      title = 'Approval Time Analytics';
      break;
    }
    case 'rejections': {
      const data = await getRejectionAnalytics(query);
      rows = [
        { category: 'Total Submitted', value: data.totalSubmitted, pct: '' },
        { category: 'Total Rejected', value: data.totalRejected, pct: `${data.rejectionRate}%` },
        ...data.byDepartment.map((d) => ({ category: `Dept: ${d.name}`, value: d.count, pct: '' })),
      ];
      title = 'Rejection Analytics';
      break;
    }
    default: {
      rows = await getProductivity(query);
      title = 'Productivity Analytics';
    }
  }

  const ext = format === 'excel' ? 'xlsx' : format;
  const fileName = `analytics-${subType}-${Date.now()}.${ext}`;
  const filePath = path.join(__dirname, `../../reports/${format}/${fileName}`);
  const period = query.startDate && query.endDate
    ? `${query.startDate} to ${query.endDate}` : 'All Time';

  await generate(rows, format, filePath, {
    subType: `analytics-${subType}`,
    title,
    company: settings?.companyName || 'Company',
    period,
  });

  return { filePath, fileName, format };
};

module.exports = {
  getProductivity, getMonthlyTrend, getWeeklyTrend, getYearlyTrend,
  getDepartmentAnalytics, getProjectAnalytics,
  getTopEmployees, getLowPerformers,
  getApprovalTimeAnalytics, getRejectionAnalytics,
  getDashboardKpi, getEmployeeScore,
  exportAnalytics, clearCache,
};
