const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/responseHelper');
const { logAudit, auditFromReq } = require('../utils/auditHelper');
const path = require('path');
const fs = require('fs');

const getAll = async (req, res) => {
  const result = await reportService.getAll(req.query);
  return sendSuccess(res, 'Reports fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const report = await reportService.getById(req.params.id);
  return sendSuccess(res, 'Report fetched', report);
};

const getSummary = async (req, res) => {
  const data = await reportService.getSummary();
  return sendSuccess(res, 'Summary fetched', data);
};

const getAnalytics = async (req, res) => {
  const {
    startDate, endDate, subType = 'employee-summary',
    employeeId, departmentId, projectId, status,
    limit, threshold,
  } = req.query;

  const result = await reportService.getAnalytics(subType, startDate, endDate, {
    employeeId: employeeId || null,
    departmentId: departmentId || null,
    projectId: projectId || null,
    status: status || null,
    limit: limit ? parseInt(limit) : undefined,
    threshold: threshold ? parseFloat(threshold) : undefined,
  });

  return sendSuccess(res, 'Analytics fetched', result);
};

const generateWeekly = async (req, res) => {
  const { year, week, format, filters } = req.body;
  const report = await reportService.generateWeekly(
    parseInt(year), parseInt(week), format || 'pdf', req.user.id, filters || {}
  );
  logAudit({
    ...auditFromReq(req),
    action: 'GENERATE_REPORT',
    module: 'report',
    status: 'success',
    details: { type: 'weekly', year, week, format, reportId: report._id },
  });
  return sendSuccess(res, 'Weekly report generated', report, 201);
};

const generateMonthly = async (req, res) => {
  const { year, month, format, filters } = req.body;
  const report = await reportService.generateMonthly(
    parseInt(year), parseInt(month), format || 'pdf', req.user.id, filters || {}
  );
  logAudit({
    ...auditFromReq(req),
    action: 'GENERATE_REPORT',
    module: 'report',
    status: 'success',
    details: { type: 'monthly', year, month, format, reportId: report._id },
  });
  return sendSuccess(res, 'Monthly report generated', report, 201);
};

const generateCustom = async (req, res) => {
  const { startDate, endDate, format, subType, filters } = req.body;
  const report = await reportService.generateCustom(
    startDate, endDate, format || 'pdf', req.user.id, subType || 'employee-summary', filters || {}
  );
  logAudit({
    ...auditFromReq(req),
    action: 'GENERATE_REPORT',
    module: 'report',
    status: 'success',
    details: { type: 'custom', startDate, endDate, format, subType, reportId: report._id },
  });
  return sendSuccess(res, 'Custom report generated', report, 201);
};

const download = async (req, res) => {
  const report = await reportService.getById(req.params.id);
  if (!report.filePath || !fs.existsSync(report.filePath)) {
    const err = new Error('Report file not found on disk');
    err.statusCode = 404;
    throw err;
  }
  report.downloadCount += 1;
  await report.save();
  logAudit({
    ...auditFromReq(req),
    action: 'DOWNLOAD_REPORT',
    module: 'report',
    status: 'success',
    details: { reportId: req.params.id, fileName: path.basename(report.filePath) },
  });
  const filename = path.basename(report.filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.download(report.filePath);
};

const remove = async (req, res) => {
  await reportService.remove(req.params.id);
  logAudit({
    ...auditFromReq(req),
    action: 'DELETE',
    module: 'report',
    status: 'success',
    details: { reportId: req.params.id },
  });
  return sendSuccess(res, 'Report deleted');
};

module.exports = {
  getAll, getById, getSummary, getAnalytics,
  generateWeekly, generateMonthly, generateCustom,
  download, remove,
};
