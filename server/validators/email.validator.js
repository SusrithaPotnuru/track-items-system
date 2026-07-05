const { body } = require('express-validator');

const sendEmailValidator = [
  body('to').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('to.*').isEmail().withMessage('Invalid recipient email'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').optional().trim(),
  body('reportId').optional().isMongoId().withMessage('Invalid report ID'),
  body('cc').optional().isArray(),
  body('cc.*').optional().isEmail(),
  body('bcc').optional().isArray(),
  body('bcc.*').optional().isEmail(),
];

const testEmailValidator = [
  body('email').isEmail().withMessage('Valid email address is required'),
];

module.exports = { sendEmailValidator, testEmailValidator };
