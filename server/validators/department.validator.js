const { body } = require('express-validator');

const departmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().toUpperCase().withMessage('Department code is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

module.exports = { departmentValidator };
