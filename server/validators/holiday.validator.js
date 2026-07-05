const { body } = require('express-validator');

const holidayValidator = [
  body('name').trim().notEmpty().withMessage('Holiday name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['national', 'festival', 'company', 'emergency']).withMessage('Invalid holiday type'),
  body('status').optional({ checkFalsy: true }).isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('description').optional({ checkFalsy: true }).trim(),
];

module.exports = { holidayValidator };
