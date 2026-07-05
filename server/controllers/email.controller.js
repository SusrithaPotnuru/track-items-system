const emailService = require('../services/email.service');
const { sendSuccess } = require('../utils/responseHelper');

const send = async (req, res) => {
  const result = await emailService.sendEmail({ ...req.body, sentBy: req.user.id });
  return sendSuccess(res, 'Email sent successfully', result, 201);
};

const sendTest = async (req, res) => {
  const result = await emailService.sendTestEmail(req.body.email, req.user.id);
  return sendSuccess(res, 'Test email sent successfully', result);
};

const validateSmtp = async (req, res) => {
  const result = await emailService.validateSmtp();
  return sendSuccess(res, 'SMTP connection verified', result);
};

const retryEmail = async (req, res) => {
  const result = await emailService.retryEmail(req.params.id);
  return sendSuccess(res, 'Email retried successfully', result);
};

const getHistory = async (req, res) => {
  const result = await emailService.getHistory(req.query);
  return sendSuccess(res, 'Email history fetched', result.data, 200, result.pagination);
};

const getStats = async (req, res) => {
  const result = await emailService.getStats();
  return sendSuccess(res, 'Email stats fetched', result);
};

const getById = async (req, res) => {
  const record = await emailService.getById(req.params.id);
  return sendSuccess(res, 'Email record fetched', record);
};

const remove = async (req, res) => {
  await emailService.remove(req.params.id);
  return sendSuccess(res, 'Email record deleted');
};

module.exports = { send, sendTest, validateSmtp, retryEmail, getHistory, getStats, getById, remove };
