const fs = require('fs');
const path = require('path');
const analyticsService = require('../services/analytics.service');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getProductivity = async (req, res) => {
  const data = await analyticsService.getProductivity(req.query);
  return sendSuccess(res, 'Productivity data fetched', data);
};

const getMonthlyTrend = async (req, res) => {
  const data = await analyticsService.getMonthlyTrend(req.query);
  return sendSuccess(res, 'Monthly trend fetched', data);
};

const getWeeklyTrend = async (req, res) => {
  const data = await analyticsService.getWeeklyTrend(req.query);
  return sendSuccess(res, 'Weekly trend fetched', data);
};

const getYearlyTrend = async (req, res) => {
  const data = await analyticsService.getYearlyTrend();
  return sendSuccess(res, 'Yearly trend fetched', data);
};

const getDepartment = async (req, res) => {
  const data = await analyticsService.getDepartmentAnalytics(req.query);
  return sendSuccess(res, 'Department analytics fetched', data);
};

const getProject = async (req, res) => {
  const data = await analyticsService.getProjectAnalytics(req.query);
  return sendSuccess(res, 'Project analytics fetched', data);
};

const getTopEmployees = async (req, res) => {
  const data = await analyticsService.getTopEmployees(req.query);
  return sendSuccess(res, 'Top employees fetched', data);
};

const getLowPerformers = async (req, res) => {
  const data = await analyticsService.getLowPerformers(req.query);
  return sendSuccess(res, 'Low performers fetched', data);
};

const getApprovalTime = async (req, res) => {
  const data = await analyticsService.getApprovalTimeAnalytics(req.query);
  return sendSuccess(res, 'Approval time analytics fetched', data);
};

const getRejections = async (req, res) => {
  const data = await analyticsService.getRejectionAnalytics(req.query);
  return sendSuccess(res, 'Rejection analytics fetched', data);
};

const getKpi = async (req, res) => {
  const data = await analyticsService.getDashboardKpi(req.query);
  return sendSuccess(res, 'Dashboard KPIs fetched', data);
};

const getEmployeeScore = async (req, res) => {
  const data = await analyticsService.getEmployeeScore(req.params.employeeId, req.query.period);
  return sendSuccess(res, 'Productivity score fetched', data);
};

const exportAnalytics = async (req, res) => {
  const { subType = 'productivity', format = 'pdf', ...rest } = req.query;
  const { filePath, fileName } = await analyticsService.exportAnalytics({ subType, format, ...rest });

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  const mimeTypes = { pdf: 'application/pdf', excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv' };
  res.setHeader('Content-Type', mimeTypes[format] || 'application/octet-stream');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('end', () => {
    try { fs.unlinkSync(filePath); } catch {}
  });
  stream.on('error', (err) => sendError(res, 'Export streaming failed', 500));
};

const clearCache = (req, res) => {
  analyticsService.clearCache();
  return sendSuccess(res, 'Analytics cache cleared');
};

module.exports = {
  getProductivity, getMonthlyTrend, getWeeklyTrend, getYearlyTrend,
  getDepartment, getProject,
  getTopEmployees, getLowPerformers,
  getApprovalTime, getRejections,
  getKpi, getEmployeeScore,
  exportAnalytics, clearCache,
};
