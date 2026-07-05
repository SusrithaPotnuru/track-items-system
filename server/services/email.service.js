const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings.model');
const EmailHistory = require('../models/EmailHistory.model');
const Report = require('../models/Report.model');
const { createTransporter } = require('../config/nodemailer');
const logger = require('../config/logger');
const { logAudit } = require('../utils/auditHelper');

// --- Template renderer ---

const renderTemplate = (templateName, vars = {}) => {
  try {
    const basePath = path.join(__dirname, '../emails/templates/base.html');
    const bodyPath = path.join(__dirname, `../emails/templates/${templateName}.html`);
    let base = fs.readFileSync(basePath, 'utf8');
    let body = fs.readFileSync(bodyPath, 'utf8');
    const allVars = { DATE: new Date().toLocaleString(), ...vars };
    // Replace body placeholders first
    Object.entries(allVars).forEach(([k, v]) => {
      body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v ?? '');
    });
    // Inject body into base
    base = base.replace('{{BODY}}', body);
    // Replace base placeholders
    Object.entries(allVars).forEach(([k, v]) => {
      base = base.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v ?? '');
    });
    return base;
  } catch {
    return `<p>${vars.BODY || 'Email content'}</p>`;
  }
};

// --- Core sender ---

const dispatchEmail = async (settings, { to, cc, bcc, subject, html, attachmentPath, attachmentName }) => {
  const transporter = createTransporter(settings);
  const mailOptions = {
    from: `"${settings.senderName || settings.companyName}" <${settings.senderEmail}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc?.length ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    bcc: bcc?.length ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
    subject,
    html,
  };
  if (attachmentPath && fs.existsSync(attachmentPath)) {
    mailOptions.attachments = [{ filename: attachmentName || path.basename(attachmentPath), path: attachmentPath }];
  }
  await transporter.sendMail(mailOptions);
};

// --- Public API ---

const sendEmail = async ({ to, cc = [], bcc = [], subject, message, reportId, sentBy, templateName, templateVars }) => {
  const settings = await Settings.findOne();
  if (!settings?.smtpHost) throw Object.assign(new Error('SMTP not configured'), { statusCode: 503 });

  let attachmentPath = null;
  let attachmentName = null;
  if (reportId) {
    const report = await Report.findById(reportId);
    if (report?.filePath && fs.existsSync(report.filePath)) {
      attachmentPath = report.filePath;
      attachmentName = `${report.reportName}.${report.format === 'excel' ? 'xlsx' : report.format}`;
    }
  }

  // Build HTML body — prefer template over raw message
  const html = templateName
    ? renderTemplate(templateName, { COMPANY: settings.companyName || 'Company', ...(templateVars || {}) })
    : (message || '');

  const emailRecord = await EmailHistory.create({
    to: Array.isArray(to) ? to : [to],
    cc,
    bcc,
    subject,
    message: html,
    attachmentPath,
    attachmentName,
    report: reportId || null,
    sentBy: sentBy || null,
    status: 'pending',
  });

  try {
    await dispatchEmail(settings, {
      to: Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject,
      html,
      attachmentPath,
      attachmentName,
    });
    emailRecord.status = 'success';
    emailRecord.sentAt = new Date();
    await emailRecord.save();
    logger.info(`Email sent to: ${Array.isArray(to) ? to.join(', ') : to} | Subject: ${subject}`);
    logAudit({
      action: 'SEND_EMAIL',
      module: 'email',
      status: 'success',
      userId: sentBy || null,
      details: { to: Array.isArray(to) ? to : [to], subject, emailId: emailRecord._id },
    });
    return emailRecord;
  } catch (err) {
    emailRecord.status = 'failed';
    emailRecord.failureReason = err.message;
    emailRecord.retryCount += 1;
    await emailRecord.save();
    logger.error(`Email failed: ${err.message}`);
    logAudit({
      action: 'SEND_EMAIL',
      module: 'email',
      status: 'failure',
      userId: sentBy || null,
      details: { to: Array.isArray(to) ? to : [to], subject, reason: err.message },
    });
    throw Object.assign(new Error(`Email sending failed: ${err.message}`), { statusCode: 502, emailRecord });
  }
};

const retryEmail = async (id) => {
  const record = await EmailHistory.findById(id);
  if (!record) throw Object.assign(new Error('Email record not found'), { statusCode: 404 });
  if (record.status !== 'failed') throw Object.assign(new Error('Only failed emails can be retried'), { statusCode: 400 });

  const settings = await Settings.findOne();
  if (!settings?.smtpHost) throw Object.assign(new Error('SMTP not configured'), { statusCode: 503 });

  record.status = 'pending';
  await record.save();

  try {
    await dispatchEmail(settings, {
      to: record.to,
      cc: record.cc,
      bcc: record.bcc,
      subject: record.subject,
      html: record.message || '',
      attachmentPath: record.attachmentPath,
      attachmentName: record.attachmentName,
    });
    record.status = 'success';
    record.sentAt = new Date();
    record.failureReason = null;
    await record.save();
    logger.info(`Email retry succeeded: ${record.subject}`);
    logAudit({
      action: 'RETRY_EMAIL',
      module: 'email',
      status: 'success',
      details: { emailId: id, subject: record.subject },
    });
    return record;
  } catch (err) {
    record.status = 'failed';
    record.failureReason = err.message;
    record.retryCount += 1;
    await record.save();
    logAudit({
      action: 'RETRY_EMAIL',
      module: 'email',
      status: 'failure',
      details: { emailId: id, reason: err.message },
    });
    throw Object.assign(new Error(`Retry failed: ${err.message}`), { statusCode: 502 });
  }
};

const sendTestEmail = async (toEmail, sentBy) => {
  const settings = await Settings.findOne();
  if (!settings?.smtpHost) throw Object.assign(new Error('SMTP not configured'), { statusCode: 400 });

  return sendEmail({
    to: [toEmail],
    subject: `[Test] SMTP Connection Verified — ${settings.companyName || 'Timesheet System'}`,
    templateName: 'testEmail',
    templateVars: { COMPANY: settings.companyName || 'Timesheet System', SUBJECT: 'SMTP Test' },
    sentBy,
  });
};

const validateSmtp = async () => {
  const settings = await Settings.findOne();
  if (!settings?.smtpHost) throw Object.assign(new Error('SMTP not configured'), { statusCode: 400 });
  const transporter = createTransporter(settings);
  await transporter.verify();
  return { connected: true, host: settings.smtpHost, port: settings.smtpPort };
};

const getHistory = async (query) => {
  const { getPagination, buildPaginationMeta } = require('../utils/paginationHelper');
  const { page, limit, skip, sort } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { subject: { $regex: query.search, $options: 'i' } },
      { to: { $elemMatch: { $regex: query.search, $options: 'i' } } },
    ];
  }
  const [data, total] = await Promise.all([
    EmailHistory.find(filter).populate('sentBy', 'fullName').populate('report', 'reportName').sort(sort).skip(skip).limit(limit),
    EmailHistory.countDocuments(filter),
  ]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const getById = async (id) => {
  const e = await EmailHistory.findById(id).populate('sentBy', 'fullName').populate('report', 'reportName');
  if (!e) throw Object.assign(new Error('Email record not found'), { statusCode: 404 });
  return e;
};

const remove = async (id) => {
  const e = await EmailHistory.findByIdAndDelete(id);
  if (!e) throw Object.assign(new Error('Email record not found'), { statusCode: 404 });
};

const getStats = async () => {
  const [total, success, failed, pending] = await Promise.all([
    EmailHistory.countDocuments(),
    EmailHistory.countDocuments({ status: 'success' }),
    EmailHistory.countDocuments({ status: 'failed' }),
    EmailHistory.countDocuments({ status: 'pending' }),
  ]);
  // Last 30 days trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const trend = await EmailHistory.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]);
  return { total, success, failed, pending, trend };
};

// Check if same-day email to same recipient list on same subject was already sent (dedup for scheduled)
const isDuplicateScheduled = async (to, subject) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const existing = await EmailHistory.findOne({
    to: { $all: to },
    subject,
    status: 'success',
    sentBy: null, // scheduler-sent emails have sentBy=null
    sentAt: { $gte: todayStart, $lte: todayEnd },
  });
  return !!existing;
};

module.exports = {
  sendEmail, retryEmail, sendTestEmail, validateSmtp,
  getHistory, getById, remove, getStats, isDuplicateScheduled,
  renderTemplate,
};
