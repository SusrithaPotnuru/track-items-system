const settingsService = require('../services/settings.service');
const { sendSuccess } = require('../utils/responseHelper');
const { logAudit, auditFromReq } = require('../utils/auditHelper');
const path = require('path');

const get = async (req, res) => {
  const settings = await settingsService.getSettings();
  return sendSuccess(res, 'Settings fetched', settings);
};

const updateGeneral = async (req, res) => {
  const settings = await settingsService.updateSection('general', req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'general', fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'General settings updated', settings);
};

const updateProductivity = async (req, res) => {
  const settings = await settingsService.updateSection('productivity', req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'productivity', fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'Productivity settings updated', settings);
};

const updateSmtp = async (req, res) => {
  const body = { ...req.body };
  delete body.smtpPassword; // never log passwords
  const settings = await settingsService.updateSection('smtp', req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'smtp', fields: Object.keys(body) },
  });
  return sendSuccess(res, 'SMTP settings updated', settings);
};

const testSmtp = async (req, res) => {
  const result = await settingsService.testSmtp();
  logAudit({
    ...auditFromReq(req),
    action: 'SMTP_TEST',
    module: 'settings',
    status: 'success',
  });
  return sendSuccess(res, 'SMTP connection successful', result);
};

const updateSecurity = async (req, res) => {
  const settings = await settingsService.updateSection('security', req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'security', fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'Security settings updated', settings);
};

const updateScheduler = async (req, res) => {
  const settings = await settingsService.updateSection('scheduler', req.body);
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'scheduler', fields: Object.keys(req.body) },
  });
  return sendSuccess(res, 'Scheduler settings updated', settings);
};

const uploadLogo = async (req, res) => {
  if (!req.file) { const e = new Error('No file'); e.statusCode = 400; throw e; }
  const logoPath = `/uploads/logos/${req.file.filename}`;
  await settingsService.updateSection('general', { companyLogo: logoPath });
  logAudit({
    ...auditFromReq(req),
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    status: 'success',
    details: { section: 'general', field: 'companyLogo' },
  });
  return sendSuccess(res, 'Logo uploaded', { companyLogo: logoPath });
};

module.exports = { get, updateGeneral, updateProductivity, updateSmtp, testSmtp, updateSecurity, updateScheduler, uploadLogo };
