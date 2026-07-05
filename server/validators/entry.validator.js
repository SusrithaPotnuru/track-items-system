const { body } = require('express-validator');

const taskRules = [
  body('tasks').isArray({ min: 1 }).withMessage('At least one task is required'),
  body('tasks.*.taskName').trim().notEmpty().withMessage('Task name is required'),
  body('tasks.*.completedItems')
    .isInt({ min: 0 })
    .withMessage('Completed items must be a whole number >= 0'),
  body('tasks.*.workingHours')
    .isFloat({ min: 0, max: 24 })
    .withMessage('Working hours must be between 0 and 24'),
  body('tasks.*.description').optional({ checkFalsy: true }).trim(),
  body('tasks.*.remarks').optional({ checkFalsy: true }).trim(),
];

// Used for POST /entries
const createEntryValidator = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('employee').isMongoId().withMessage('Valid employee ID is required'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  ...taskRules,
];

// Used for PUT /entries/:id — only date and tasks can change
const updateEntryValidator = [
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Valid date is required'),
  ...taskRules,
];

const rejectValidator = [
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required'),
];

module.exports = { createEntryValidator, updateEntryValidator, rejectValidator };
