const schedulerService = require('../services/scheduler.service');
const { sendSuccess } = require('../utils/responseHelper');

const getStatus = (req, res) => {
  return sendSuccess(res, 'Scheduler status', schedulerService.getStatus());
};

const toggle = async (req, res) => {
  const { type, enabled } = req.body;
  const status = await schedulerService.toggleScheduler(type, enabled);
  return sendSuccess(res, `Scheduler "${type}" ${enabled ? 'enabled' : 'disabled'}`, status);
};

const runManually = async (req, res) => {
  const { type = 'report' } = req.body;
  switch (type) {
    case 'daily-reminder':
      schedulerService.runDailyReminderJob();
      break;
    case 'pending-approval':
      schedulerService.runPendingApprovalJob();
      break;
    default:
      schedulerService.runReportJob();
  }
  return sendSuccess(res, `Scheduler job "${type}" triggered manually`);
};

const getLogs = async (req, res) => {
  const result = await schedulerService.getLogs(req.query);
  return sendSuccess(res, 'Scheduler logs fetched', result.data, 200, result.pagination);
};

module.exports = { getStatus, toggle, runManually, getLogs };
