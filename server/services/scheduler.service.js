const cron = require('node-cron');
const Settings = require('../models/Settings.model');
const SchedulerLog = require('../models/SchedulerLog.model');
const reportService = require('./report.service');
const emailService = require('./email.service');
const { buildCronExpression } = require('../utils/cronParser');
const logger = require('../config/logger');
const { logAudit } = require('../utils/auditHelper');

let reportTask = null;
let dailyReminderTask = null;
let pendingApprovalTask = null;

// --- Dedup: check if same jobType already ran successfully today ---
const alreadyRanToday = async (jobType) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const existing = await SchedulerLog.findOne({
    jobType,
    status: 'success',
    executedAt: { $gte: todayStart },
  });
  return !!existing;
};

// --- Report Job ---
const runReportJob = async () => {
  const logEntry = await SchedulerLog.create({ jobType: 'report', status: 'running' });
  const start = Date.now();
  try {
    const settings = await Settings.findOne();
    if (!settings?.schedulerEnabled) {
      logEntry.status = 'skipped';
      logEntry.error = 'Scheduler disabled';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    if (await alreadyRanToday('report')) {
      logEntry.status = 'skipped';
      logEntry.error = 'Already ran today';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      logger.info('Report job skipped — already ran today');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { getWeekNumber } = require('../utils/dateUtils');
    const week = getWeekNumber(now);
    const fmt = settings.defaultReportFormat || 'pdf';

    let report;
    if (settings.schedulerFrequency === 'monthly') {
      report = await reportService.generateMonthly(year, month, fmt, null);
    } else {
      report = await reportService.generateWeekly(year, week, fmt, null);
    }

    if (settings.managerEmails?.length) {
      const templateName = settings.schedulerFrequency === 'monthly' ? 'monthlyReport' : 'weeklyReport';
      const templateVars = {
        PERIOD: report.reportName,
        TOTAL_ITEMS: report.data?.totalItems ?? 0,
        TOTAL_HOURS: report.data?.totalHours ?? 0,
        ENTRY_COUNT: report.data?.entryCount ?? 0,
        WORKING_DAYS: report.data?.workingDays ?? 0,
      };
      const emailRecord = await emailService.sendEmail({
        to: settings.managerEmails,
        subject: `[Auto] ${report.reportName}`,
        templateName,
        templateVars,
        reportId: report._id,
        sentBy: null,
      });
      logEntry.emailId = emailRecord._id;
    }

    logEntry.reportId = report._id;
    logEntry.status = 'success';
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.info(`Report job complete — ${report.reportName}`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'success', details: { jobType: 'report', reportId: report._id, durationMs: logEntry.durationMs } });
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message;
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.error(`Report job failed: ${err.message}`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'failure', details: { jobType: 'report', reason: err.message } });
  }
};

// --- Daily Reminder Job ---
const runDailyReminderJob = async () => {
  const logEntry = await SchedulerLog.create({ jobType: 'daily-reminder', status: 'running' });
  const start = Date.now();
  try {
    const settings = await Settings.findOne();
    if (!settings?.dailyReminderEnabled) {
      logEntry.status = 'skipped';
      logEntry.error = 'Daily reminder disabled';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    if (await alreadyRanToday('daily-reminder')) {
      logEntry.status = 'skipped';
      logEntry.error = 'Already ran today';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    const Employee = require('../models/Employee.model');
    const Entry = require('../models/Entry.model');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [allEmployees, todayEntries] = await Promise.all([
      Employee.find({ status: 'active' }).populate('department', 'name'),
      Entry.distinct('employee', { date: { $gte: today, $lt: tomorrow } }),
    ]);

    const submittedIds = todayEntries.map((id) => id.toString());
    const missing = allEmployees.filter((e) => !submittedIds.includes(e._id.toString()));

    if (!missing.length || !settings.managerEmails?.length) {
      logEntry.status = 'success';
      logEntry.error = 'No missing entries or no recipients';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    const employeeRows = missing.map((e) =>
      `<tr><td style="padding:8px;border-top:1px solid #fde68a;">${e.name}</td><td style="padding:8px;border-top:1px solid #fde68a;">${e.department?.name || '-'}</td></tr>`
    ).join('');

    const emailRecord = await emailService.sendEmail({
      to: settings.managerEmails,
      subject: `[Reminder] ${missing.length} Employee(s) Missing Daily Entry — ${today.toDateString()}`,
      templateName: 'dailyReminder',
      templateVars: {
        COMPANY: settings.companyName || 'Company',
        MISSING_COUNT: missing.length,
        EMPLOYEE_ROWS: employeeRows,
      },
      sentBy: null,
    });

    logEntry.emailId = emailRecord._id;
    logEntry.status = 'success';
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.info(`Daily reminder sent to ${settings.managerEmails.length} recipient(s); ${missing.length} missing`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'success', details: { jobType: 'daily-reminder', missingCount: missing.length } });
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message;
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.error(`Daily reminder job failed: ${err.message}`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'failure', details: { jobType: 'daily-reminder', reason: err.message } });
  }
};

// --- Pending Approval Job ---
const runPendingApprovalJob = async () => {
  const logEntry = await SchedulerLog.create({ jobType: 'pending-approval', status: 'running' });
  const start = Date.now();
  try {
    const settings = await Settings.findOne();
    if (!settings?.pendingApprovalEnabled) {
      logEntry.status = 'skipped';
      logEntry.error = 'Pending approval reminder disabled';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    if (await alreadyRanToday('pending-approval')) {
      logEntry.status = 'skipped';
      logEntry.error = 'Already ran today';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    const Entry = require('../models/Entry.model');
    const pending = await Entry.find({ status: 'submitted' })
      .populate('employee', 'name')
      .sort({ date: -1 })
      .limit(50);

    if (!pending.length || !settings.managerEmails?.length) {
      logEntry.status = 'success';
      logEntry.error = 'No pending entries or no recipients';
      logEntry.durationMs = Date.now() - start;
      await logEntry.save();
      return;
    }

    const entryRows = pending.map((e) => {
      const dt = new Date(e.date).toLocaleDateString();
      return `<tr><td style="padding:8px;border-top:1px solid #ddd6fe;">${e.employee?.name || '-'}</td><td style="padding:8px;border-top:1px solid #ddd6fe;">${dt}</td><td style="padding:8px;border-top:1px solid #ddd6fe;">${e.totalItems ?? 0}</td></tr>`;
    }).join('');

    const emailRecord = await emailService.sendEmail({
      to: settings.managerEmails,
      subject: `[Action Required] ${pending.length} Entries Pending Approval`,
      templateName: 'pendingApproval',
      templateVars: {
        COMPANY: settings.companyName || 'Company',
        PENDING_COUNT: pending.length,
        ENTRY_ROWS: entryRows,
      },
      sentBy: null,
    });

    logEntry.emailId = emailRecord._id;
    logEntry.status = 'success';
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.info(`Pending approval reminder sent — ${pending.length} entries`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'success', details: { jobType: 'pending-approval', pendingCount: pending.length } });
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message;
    logEntry.durationMs = Date.now() - start;
    await logEntry.save();
    logger.error(`Pending approval job failed: ${err.message}`);
    logAudit({ action: 'SCHEDULER_RUN', module: 'scheduler', status: 'failure', details: { jobType: 'pending-approval', reason: err.message } });
  }
};

// --- Scheduler lifecycle ---

const startScheduler = async () => {
  const settings = await Settings.findOne();
  if (!settings) return;

  // Report scheduler
  if (reportTask) { reportTask.stop(); reportTask = null; }
  if (settings.schedulerEnabled && settings.schedulerCron) {
    const expr = settings.schedulerCron || buildCronExpression(settings.schedulerFrequency, settings.schedulerTime, settings.schedulerDay);
    if (expr && cron.validate(expr)) {
      reportTask = cron.schedule(expr, runReportJob, { timezone: settings.timezone || 'Asia/Kolkata' });
      logger.info(`Report scheduler started: "${expr}"`);
    }
  }

  // Daily reminder scheduler — fixed to configured time, runs every day
  if (dailyReminderTask) { dailyReminderTask.stop(); dailyReminderTask = null; }
  if (settings.dailyReminderEnabled && settings.dailyReminderTime) {
    const [hour, minute] = (settings.dailyReminderTime || '09:00').split(':');
    const expr = `${minute} ${hour} * * *`;
    if (cron.validate(expr)) {
      dailyReminderTask = cron.schedule(expr, runDailyReminderJob, { timezone: settings.timezone || 'Asia/Kolkata' });
      logger.info(`Daily reminder scheduler started: "${expr}"`);
    }
  }

  // Pending approval — daily at 08:00
  if (pendingApprovalTask) { pendingApprovalTask.stop(); pendingApprovalTask = null; }
  if (settings.pendingApprovalEnabled) {
    pendingApprovalTask = cron.schedule('0 8 * * *', runPendingApprovalJob, { timezone: settings.timezone || 'Asia/Kolkata' });
    logger.info('Pending approval scheduler started: "0 8 * * *"');
  }
};

const stopScheduler = () => {
  if (reportTask) { reportTask.stop(); reportTask = null; }
  if (dailyReminderTask) { dailyReminderTask.stop(); dailyReminderTask = null; }
  if (pendingApprovalTask) { pendingApprovalTask.stop(); pendingApprovalTask = null; }
  logger.info('All scheduler tasks stopped');
};

const toggleScheduler = async (type, enabled) => {
  const settings = await Settings.findOne();
  if (!settings) throw Object.assign(new Error('Settings not found'), { statusCode: 404 });
  switch (type) {
    case 'report':
      settings.schedulerEnabled = enabled;
      break;
    case 'daily-reminder':
      settings.dailyReminderEnabled = enabled;
      break;
    case 'pending-approval':
      settings.pendingApprovalEnabled = enabled;
      break;
    default:
      throw Object.assign(new Error('Unknown scheduler type'), { statusCode: 400 });
  }
  await settings.save();
  await startScheduler();
  return getStatus();
};

const getStatus = () => ({
  report: { running: !!reportTask },
  dailyReminder: { running: !!dailyReminderTask },
  pendingApproval: { running: !!pendingApprovalTask },
});

const getLogs = async (query) => {
  const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.jobType) filter.jobType = query.jobType;
  if (query.status) filter.status = query.status;
  const [data, total] = await Promise.all([
    SchedulerLog.find(filter).sort(sort).skip(skip).limit(limit),
    SchedulerLog.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = {
  startScheduler, stopScheduler, toggleScheduler,
  runReportJob, runDailyReminderJob, runPendingApprovalJob,
  getStatus, getLogs,
};
