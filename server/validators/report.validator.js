const { body, query } = require('express-validator');

const SUBTYPES = [
  'employee-summary', 'department-summary', 'project-summary',
  'top-performers', 'low-productivity', 'missing-entries', 'holiday-working-days',
];

const filterBodyRules = [
  body('filters.employeeId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid employee ID'),
  body('filters.departmentId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid department ID'),
  body('filters.projectId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid project ID'),
  body('filters.status').optional({ checkFalsy: true }).isIn(['draft', 'submitted', 'approved', 'rejected']),
  body('filters.limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  body('filters.threshold').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
];

const weeklyReportValidator = [
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year required'),
  body('week').isInt({ min: 1, max: 53 }).withMessage('Valid week number (1-53) required'),
  body('format').optional({ checkFalsy: true }).isIn(['pdf', 'excel', 'csv']),
  ...filterBodyRules,
];

const monthlyReportValidator = [
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month (1-12) required'),
  body('format').optional({ checkFalsy: true }).isIn(['pdf', 'excel', 'csv']),
  ...filterBodyRules,
];

const customReportValidator = [
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('subType').optional({ checkFalsy: true }).isIn(SUBTYPES).withMessage('Invalid report subtype'),
  body('format').optional({ checkFalsy: true }).isIn(['pdf', 'excel', 'csv']),
  ...filterBodyRules,
];

const analyticsQueryValidator = [
  query('startDate').isISO8601().withMessage('Valid start date required'),
  query('endDate').isISO8601().withMessage('Valid end date required'),
  query('subType').optional({ checkFalsy: true }).isIn(SUBTYPES),
  query('employeeId').optional({ checkFalsy: true }).isMongoId(),
  query('departmentId').optional({ checkFalsy: true }).isMongoId(),
  query('projectId').optional({ checkFalsy: true }).isMongoId(),
  query('status').optional({ checkFalsy: true }).isIn(['draft', 'submitted', 'approved', 'rejected']),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }),
  query('threshold').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }),
];

module.exports = {
  weeklyReportValidator,
  monthlyReportValidator,
  customReportValidator,
  analyticsQueryValidator,
};
