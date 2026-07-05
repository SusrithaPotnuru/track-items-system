const { body } = require('express-validator');

const generalValidator = [
  body('companyName').optional().trim().notEmpty(),
  body('timezone').optional().trim(),
  body('currency').optional().trim(),
  body('dateFormat').optional().trim(),
  body('language').optional().trim(),
];

const productivityValidator = [
  body('defaultWorkingHours').optional().isFloat({ min: 1, max: 24 }),
  body('weekOffDays').optional().isArray(),
  body('weekOffDays.*').optional().isInt({ min: 0, max: 6 }),
  body('dailyTarget').optional().isFloat({ min: 1 }),
  body('weeklyTarget').optional().isFloat({ min: 1 }),
  body('monthlyTarget').optional().isFloat({ min: 1 }),
  body('defaultReportFormat').optional().isIn(['pdf', 'excel', 'csv']),
  body('managerEmails').optional().isArray(),
  body('managerEmails.*').optional().isEmail(),
];

const smtpValidator = [
  body('smtpHost').optional().trim(),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }),
  body('smtpUsername').optional().trim(),
  body('smtpPassword').optional(),
  body('senderEmail').optional().isEmail(),
  body('senderName').optional().trim(),
];

const securityValidator = [
  body('sessionTimeout').optional().isInt({ min: 1 }),
  body('passwordMinLength').optional().isInt({ min: 6, max: 32 }),
  body('maxLoginAttempts').optional().isInt({ min: 1 }),
];

const schedulerValidator = [
  body('schedulerEnabled').optional().isBoolean(),
  body('schedulerFrequency').optional().isIn(['weekly', 'monthly', 'custom']),
  body('schedulerDay').optional().isInt({ min: 0 }),
  body('schedulerTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
  body('dailyReminderEnabled').optional().isBoolean(),
  body('dailyReminderTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
  body('pendingApprovalEnabled').optional().isBoolean(),
];

module.exports = { generalValidator, productivityValidator, smtpValidator, securityValidator, schedulerValidator };
