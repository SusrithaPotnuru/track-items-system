const { body } = require('express-validator');

const projectValidator = [
  body('projectCode').trim().notEmpty().toUpperCase().withMessage('Project code is required'),
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('department').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid department ID'),
  body('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid start date'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('status').optional({ checkFalsy: true }).isIn(['planning', 'active', 'completed', 'on-hold', 'cancelled']),
  body('priority').optional({ checkFalsy: true }).isIn(['low', 'medium', 'high', 'critical']),
  body('assignedEmployees').optional({ checkFalsy: true }).isArray(),
  body('assignedEmployees.*').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid employee ID'),
];

module.exports = { projectValidator };
