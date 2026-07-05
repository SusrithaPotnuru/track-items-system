const path = require('path');
const AuditLog = require('../models/AuditLog.model');
const { generate } = require('./export.service');
const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
const Settings = require('../models/Settings.model');

const buildFilter = (query) => {
  const filter = {};
  if (query.module) filter.module = query.module;
  if (query.action) filter.action = query.action;
  if (query.status) filter.status = query.status;
  if (query.userRole) filter.userRole = query.userRole;
  if (query.userId) filter.userId = query.userId;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (query.search) {
    filter.$or = [
      { userName: { $regex: query.search, $options: 'i' } },
      { action: { $regex: query.search, $options: 'i' } },
      { module: { $regex: query.search, $options: 'i' } },
      { ipAddress: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
};

const getLogs = async (query) => {
  const { page, limit, skip, sort } = getPagination(query, { createdAt: -1 });
  const filter = buildFilter(query);

  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const log = await AuditLog.findById(id).lean();
  if (!log) throw Object.assign(new Error('Audit log not found'), { statusCode: 404 });
  return log;
};

const getStats = async () => {
  const [byStatus, byModule, byAction] = await Promise.all([
    AuditLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AuditLog.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
  ]);

  const statusMap = { success: 0, failure: 0, info: 0 };
  byStatus.forEach((s) => { statusMap[s._id] = s.count; });

  return {
    total: statusMap.success + statusMap.failure + statusMap.info,
    byStatus: statusMap,
    byModule: byModule.map((m) => ({ module: m._id, count: m.count })),
    byAction: byAction.map((a) => ({ action: a._id, count: a.count })),
  };
};

const exportLogs = async (query) => {
  const format = query.format || 'pdf';
  const filter = buildFilter(query);
  const rows = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(10000).lean();

  const settings = await Settings.findOne().lean();
  const ext = format === 'excel' ? 'xlsx' : format;
  const fileName = `audit-logs-${Date.now()}.${ext}`;
  const filePath = path.join(__dirname, `../../reports/${format}/${fileName}`);

  await generate(rows, format, filePath, {
    subType: 'audit-logs',
    title: 'Audit Logs',
    company: settings?.companyName || 'Company',
    period: 'All Time',
  });

  return { filePath, fileName, format };
};

module.exports = { getLogs, getById, getStats, exportLogs };
