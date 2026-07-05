const mongoose = require('mongoose');
const Entry = require('../models/Entry.model');
const Employee = require('../models/Employee.model');
const Holiday = require('../models/Holiday.model');
const Report = require('../models/Report.model');
const Settings = require('../models/Settings.model');
const { getWeekRange, getMonthRange } = require('../utils/dateUtils');
const exportService = require('./export.service');
const path = require('path');
const fs = require('fs');

// --- Constants ---

const SUBTYPES = [
  'employee-summary', 'department-summary', 'project-summary',
  'top-performers', 'low-productivity', 'missing-entries', 'holiday-working-days',
];

const SUBTYPE_LABELS = {
  'employee-summary': 'Employee Summary',
  'department-summary': 'Department Summary',
  'project-summary': 'Project Summary',
  'top-performers': 'Top Performers',
  'low-productivity': 'Low Productivity',
  'missing-entries': 'Missing Entries',
  'holiday-working-days': 'Holiday Calendar',
};

// --- Helpers ---

const getPerformanceLevel = (score) => {
  if (score >= 100) return 'Excellent';
  if (score >= 90) return 'Very Good';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  return 'Needs Improvement';
};

const getFileSize = (filePath) => {
  try { return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0; } catch { return 0; }
};

// ISO 8601 week-to-date range
const getDateRangeFromWeek = (year, week) => {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1 … Sun=7
  const week1Mon = new Date(jan4);
  week1Mon.setDate(jan4.getDate() - dayOfWeek + 1);
  week1Mon.setHours(0, 0, 0, 0);

  const start = new Date(week1Mon);
  start.setDate(week1Mon.getDate() + (week - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// --- Match Filter ---

const buildMatchFilter = (start, end, filters = {}) => {
  const match = {
    status: filters.status || 'approved',
    date: { $gte: new Date(start), $lte: new Date(end) },
  };
  if (filters.employeeId) match.employee = new mongoose.Types.ObjectId(filters.employeeId);
  if (filters.departmentId) match.department = new mongoose.Types.ObjectId(filters.departmentId);
  if (filters.projectId) match.project = new mongoose.Types.ObjectId(filters.projectId);
  return match;
};

// --- Aggregations ---

const aggregateByEmployee = async (matchFilter) => {
  return Entry.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$employee',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        department: { $first: '$department' },
        avgProductivityScore: { $avg: '$productivityScore' },
        dailyTargetSnapshot: { $first: '$dailyTargetSnapshot' },
      },
    },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'emp' } },
    { $unwind: '$emp' },
    { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        employeeId: '$emp.employeeId',
        employeeName: '$emp.name',
        departmentName: { $ifNull: ['$dept.name', '—'] },
        totalItems: 1,
        totalHours: { $round: ['$totalHours', 2] },
        entryCount: 1,
        avgProductivityScore: { $round: ['$avgProductivityScore', 2] },
        dailyTargetSnapshot: 1,
        avgItemsPerHour: {
          $cond: [
            { $gt: ['$totalHours', 0] },
            { $round: [{ $divide: ['$totalItems', '$totalHours'] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
};

const aggregateByDepartment = async (matchFilter) => {
  return Entry.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$department',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        employeeIds: { $addToSet: '$employee' },
        avgProductivityScore: { $avg: '$productivityScore' },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        departmentName: { $ifNull: ['$dept.name', 'Unknown'] },
        departmentCode: { $ifNull: ['$dept.code', '—'] },
        totalItems: 1,
        totalHours: { $round: ['$totalHours', 2] },
        entryCount: 1,
        employeeCount: { $size: '$employeeIds' },
        avgProductivityScore: { $round: ['$avgProductivityScore', 2] },
        avgItemsPerHour: {
          $cond: [
            { $gt: ['$totalHours', 0] },
            { $round: [{ $divide: ['$totalItems', '$totalHours'] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
};

const aggregateByProject = async (matchFilter) => {
  return Entry.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$project',
        totalItems: { $sum: '$totalItems' },
        totalHours: { $sum: '$totalHours' },
        entryCount: { $sum: 1 },
        employeeIds: { $addToSet: '$employee' },
      },
    },
    { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'proj' } },
    { $unwind: { path: '$proj', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        projectCode: { $ifNull: ['$proj.projectCode', '—'] },
        projectName: { $ifNull: ['$proj.name', 'Unknown'] },
        totalItems: 1,
        totalHours: { $round: ['$totalHours', 2] },
        entryCount: 1,
        employeeCount: { $size: '$employeeIds' },
        avgItemsPerHour: {
          $cond: [
            { $gt: ['$totalHours', 0] },
            { $round: [{ $divide: ['$totalItems', '$totalHours'] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalItems: -1 } },
  ]);
};

const getTopPerformersData = async (matchFilter, limit = 10) => {
  const rows = await aggregateByEmployee(matchFilter);
  return rows.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    ...r,
    performanceLevel: getPerformanceLevel(r.avgProductivityScore),
  }));
};

const getLowProductivityData = async (matchFilter, threshold = 75) => {
  const rows = await aggregateByEmployee(matchFilter);
  return rows
    .filter((r) => r.avgProductivityScore < threshold)
    .map((r) => ({ ...r, performanceLevel: getPerformanceLevel(r.avgProductivityScore) }));
};

const getMissingEntriesData = async (start, end, filters = {}) => {
  const settings = await Settings.findOne();
  const weekOffDays = settings?.weekOffDays || [0, 6];
  const holidays = await Holiday.find({ date: { $gte: start, $lte: end }, status: 'active' });
  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split('T')[0]));

  let expectedDays = 0;
  const d = new Date(start);
  while (d <= end) {
    const dStr = d.toISOString().split('T')[0];
    if (!weekOffDays.includes(d.getDay()) && !holidayDates.has(dStr)) expectedDays++;
    d.setDate(d.getDate() + 1);
  }

  const empQuery = { status: 'active' };
  if (filters.departmentId) empQuery.department = new mongoose.Types.ObjectId(filters.departmentId);
  const employees = await Employee.find(empQuery).populate('department', 'name');

  const matchBase = { date: { $gte: start, $lte: end }, status: 'approved' };
  if (filters.projectId) matchBase.project = new mongoose.Types.ObjectId(filters.projectId);
  const counts = await Entry.aggregate([
    { $match: matchBase },
    { $group: { _id: '$employee', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  return employees
    .map((emp) => {
      const submitted = countMap[emp._id.toString()] || 0;
      const missing = Math.max(0, expectedDays - submitted);
      const compliance = expectedDays > 0 ? +((submitted / expectedDays) * 100).toFixed(2) : 100;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        departmentName: emp.department?.name || '—',
        expectedDays,
        submittedDays: submitted,
        missingDays: missing,
        complianceRate: compliance,
      };
    })
    .sort((a, b) => b.missingDays - a.missingDays);
};

const getHolidayWorkingDaysData = async (start, end) => {
  const settings = await Settings.findOne();
  const weekOffDays = settings?.weekOffDays || [0, 6];
  const holidays = await Holiday.find({ date: { $gte: start, $lte: end }, status: 'active' }).sort({ date: 1 });
  const holidayMap = Object.fromEntries(holidays.map((h) => [h.date.toISOString().split('T')[0], h]));

  const rows = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(start);
  let workingDays = 0, holidayDays = 0, weekOffCount = 0;

  while (d <= end) {
    const dStr = d.toISOString().split('T')[0];
    const holiday = holidayMap[dStr];
    const isWeekOff = weekOffDays.includes(d.getDay());

    if (holiday) {
      rows.push({ date: dStr, dayName: dayNames[d.getDay()], type: 'Holiday', name: holiday.name });
      holidayDays++;
    } else if (isWeekOff) {
      rows.push({ date: dStr, dayName: dayNames[d.getDay()], type: 'Week Off', name: '—' });
      weekOffCount++;
    } else {
      workingDays++;
    }
    d.setDate(d.getDate() + 1);
  }

  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return { rows, summary: { totalDays, workingDays, holidayDays, weekOffDays: weekOffCount } };
};

// --- Row Fetcher ---

const getRowsBySubType = async (subType, start, end, filters = {}) => {
  const matchFilter = buildMatchFilter(start, end, filters);
  switch (subType) {
    case 'department-summary':
      return { rows: await aggregateByDepartment(matchFilter), summary: null };
    case 'project-summary':
      return { rows: await aggregateByProject(matchFilter), summary: null };
    case 'top-performers':
      return { rows: await getTopPerformersData(matchFilter, filters.limit || 10), summary: null };
    case 'low-productivity':
      return { rows: await getLowProductivityData(matchFilter, filters.threshold || 75), summary: null };
    case 'missing-entries': {
      const all = await getMissingEntriesData(start, end, filters);
      return { rows: all, summary: null };
    }
    case 'holiday-working-days': {
      const result = await getHolidayWorkingDaysData(start, end);
      return { rows: result.rows, summary: result.summary };
    }
    default:
      return { rows: await aggregateByEmployee(matchFilter), summary: null };
  }
};

// --- Summary for Hub Page ---

const getSummary = async () => {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const { start: weekStart, end: weekEnd } = getWeekRange(now);

  const [totalReports, monthReports, monthAgg, weekAgg, deptBreakdown, monthlyTrend, perfDist, recentReports] =
    await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ generatedAt: { $gte: monthStart, $lte: monthEnd } }),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' }, entryCount: { $sum: 1 } } },
      ]),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: weekStart, $lte: weekEnd } } },
        { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' } } },
      ]),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: '$department', totalItems: { $sum: '$totalItems' } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, totalItems: 1 } },
        { $sort: { totalItems: -1 } },
        { $limit: 8 },
      ]),
      Entry.aggregate([
        {
          $match: {
            status: 'approved',
            date: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            items: { $sum: '$totalItems' },
            hours: { $sum: '$totalHours' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Entry.aggregate([
        { $match: { status: 'approved', date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: '$performanceLevel', count: { $sum: 1 } } },
      ]),
      Report.find().sort({ generatedAt: -1 }).limit(5).populate('generatedBy', 'fullName'),
    ]);

  return {
    totalReports,
    monthReports,
    monthlyItems: monthAgg[0]?.totalItems || 0,
    monthlyHours: monthAgg[0]?.totalHours || 0,
    monthlyEntries: monthAgg[0]?.entryCount || 0,
    weeklyItems: weekAgg[0]?.totalItems || 0,
    weeklyHours: weekAgg[0]?.totalHours || 0,
    deptBreakdown,
    monthlyTrend,
    performanceDistribution: perfDist,
    recentReports,
  };
};

// --- Analytics (no file save) ---

const getAnalytics = async (subType, startDate, endDate, filters = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return getRowsBySubType(subType, start, end, filters);
};

// --- Generate + Save ---

const generateReport = async ({ reportType, subType, start, end, week, month, year, format, userId, filters }) => {
  const { rows, summary } = await getRowsBySubType(subType, start, end, filters);
  const settings = await Settings.findOne();

  const startStr = new Date(start).toLocaleDateString('en-GB');
  const endStr = new Date(end).toLocaleDateString('en-GB');
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let reportName;
  if (reportType === 'weekly') {
    reportName = `Weekly Report - W${week} ${year}`;
  } else if (reportType === 'monthly') {
    reportName = `Monthly Report - ${MONTH_NAMES[(month || 1) - 1]} ${year}`;
  } else {
    reportName = `${SUBTYPE_LABELS[subType] || 'Custom'} - ${startStr} to ${endStr}`;
  }

  const ext = format === 'excel' ? 'xlsx' : format;
  const slug = reportName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 60);
  const filePath = path.join('reports', format, `${slug}_${Date.now()}.${ext}`);

  await exportService.generate(rows, format, filePath, {
    title: reportName,
    period: `${startStr} – ${endStr}`,
    company: settings?.companyName || 'Company',
    subType,
    summary,
  });

  const report = await Report.create({
    reportName,
    reportType,
    startDate: new Date(start),
    endDate: new Date(end),
    week: week || null,
    month: month || null,
    year: year || null,
    format,
    generatedBy: userId,
    generatedAt: new Date(),
    filePath,
    fileSize: getFileSize(filePath),
    data: { rows: rows.slice(0, 200), summary, subType },
  });

  return report;
};

const generateWeekly = async (year, week, format = 'pdf', userId, filters = {}) => {
  const { start, end } = getDateRangeFromWeek(year, week);
  return generateReport({ reportType: 'weekly', subType: 'employee-summary', start, end, week, year, format, userId, filters });
};

const generateMonthly = async (year, month, format = 'pdf', userId, filters = {}) => {
  const { start, end } = getMonthRange(year, month);
  return generateReport({ reportType: 'monthly', subType: 'employee-summary', start, end, month, year, format, userId, filters });
};

const generateCustom = async (startDate, endDate, format = 'pdf', userId, subType = 'employee-summary', filters = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return generateReport({ reportType: 'custom', subType, start, end, format, userId, filters });
};

// --- CRUD ---

const getAll = async (query) => {
  const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.reportType) filter.reportType = query.reportType;
  if (query.year) filter.year = parseInt(query.year);
  if (query.format) filter.format = query.format;

  const [data, total] = await Promise.all([
    Report.find(filter).populate('generatedBy', 'fullName').sort(sort).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const r = await Report.findById(id).populate('generatedBy', 'fullName');
  if (!r) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  return r;
};

const remove = async (id) => {
  const r = await Report.findByIdAndDelete(id);
  if (!r) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  if (r.filePath && fs.existsSync(r.filePath)) {
    try { fs.unlinkSync(r.filePath); } catch {}
  }
};

module.exports = {
  generateWeekly, generateMonthly, generateCustom,
  getAll, getById, remove,
  getSummary, getAnalytics,
  SUBTYPES, SUBTYPE_LABELS,
};
