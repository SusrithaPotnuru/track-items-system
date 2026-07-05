const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/responseHelper');

const getStats = async (req, res) => {
  const data = await dashboardService.getStats();
  return sendSuccess(res, 'Dashboard stats fetched', data);
};

const getCharts = async (req, res) => {
  const data = await dashboardService.getCharts();
  return sendSuccess(res, 'Chart data fetched', data);
};

const getTopPerformers = async (req, res) => {
  const data = await dashboardService.getTopPerformers();
  return sendSuccess(res, 'Top performers fetched', data);
};

const getRecentActivities = async (req, res) => {
  const data = await dashboardService.getRecentActivities();
  return sendSuccess(res, 'Recent activities fetched', data);
};

module.exports = { getStats, getCharts, getTopPerformers, getRecentActivities };
