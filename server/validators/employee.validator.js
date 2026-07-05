const { body } = require('express-validator');

const employeeValidator = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  body('status').optional({ checkFalsy: true }).isIn(['active', 'inactive']),
  body('dailyTarget').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('weeklyTarget').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body('monthlyTarget').optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

module.exports = { employeeValidator };
