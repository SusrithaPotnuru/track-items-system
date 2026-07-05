const Entry = require('../models/Entry.model');
const Employee = require('../models/Employee.model');
const Project = require('../models/Project.model');
const Department = require('../models/Department.model');
const Holiday = require('../models/Holiday.model');
const { getMonthRange, getWeekRange } = require('../utils/dateUtils');

const getStats = async () => {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const { start: weekStart, end: weekEnd } = getWeekRange(now);

  const [
    totalEmployees, activeEmployees,
    totalProjects, activeProjects,
    todayEntries, weekEntries, monthEntries,
    pendingApprovals,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'active' }),
    Entry.countDocuments({ date: { $gte: new Date(now.setHours(0,0,0,0)), $lte: new Date(now.setHours(23,59,59,999)) } }),
    Entry.countDocuments({ date: { $gte: weekStart, $lte: weekEnd }, status: 'approved' }),
    Entry.countDocuments({ date: { $gte: monthStart, $lte: monthEnd }, status: 'approved' }),
    Entry.countDocuments({ status: 'submitted' }),
  ]);

  const monthAgg = await Entry.aggregate([
    { $match: { date: { $gte: monthStart, $lte: monthEnd }, status: 'approved' } },
    { $group: { _id: null, totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' } } },
  ]);

  return {
    totalEmployees, activeEmployees,
    totalProjects, activeProjects,
    todayEntries, weekEntries, monthEntries,
    pendingApprovals,
    monthlyItems: monthAgg[0]?.totalItems || 0,
    monthlyHours: monthAgg[0]?.totalHours || 0,
  };
};

const getCharts = async () => {
  const now = new Date();
  const year = now.getFullYear();

  // Monthly items per month (last 12 months)
  const monthlyTrend = await Entry.aggregate([
    { $match: { status: 'approved', date: { $gte: new Date(year - 1, now.getMonth() + 1, 1) } } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, items: { $sum: '$totalItems' }, hours: { $sum: '$totalHours' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Per department
  const departmentBreakdown = await Entry.aggregate([
    { $match: { status: 'approved', date: { $gte: new Date(year, 0, 1) } } },
    { $group: { _id: '$department', totalItems: { $sum: '$totalItems' } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: '$dept' },
    { $project: { name: '$dept.name', totalItems: 1 } },
  ]);

  // Daily trend last 30 days
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dailyTrend = await Entry.aggregate([
    { $match: { status: 'approved', date: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, items: { $sum: '$totalItems' } } },
    { $sort: { _id: 1 } },
  ]);

  return { monthlyTrend, departmentBreakdown, dailyTrend };
};

const getTopPerformers = async () => {
  const now = new Date();
  const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1);

  return Entry.aggregate([
    { $match: { status: 'approved', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$employee', totalItems: { $sum: '$totalItems' }, totalHours: { $sum: '$totalHours' } } },
    { $sort: { totalItems: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
    { $unwind: '$employee' },
    {
      $project: {
        name: '$employee.name', employeeId: '$employee.employeeId',
        photo: '$employee.photo', totalItems: 1, totalHours: 1,
      },
    },
  ]);
};

const getRecentActivities = async () => {
  const ActivityTimeline = require('../models/ActivityTimeline.model');
  return ActivityTimeline.find().sort({ createdAt: -1 }).limit(10);
};

module.exports = { getStats, getCharts, getTopPerformers, getRecentActivities };
