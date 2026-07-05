const logger = require('../config/logger');

const FIELD_LABELS = {
  name: 'Name',
  code: 'Code',
  email: 'Email address',
  employeeId: 'Employee ID',
  projectCode: 'Project code',
  phone: 'Phone number',
  date: 'Date',
};

const normalizeMongoError = (err) => {
  // Duplicate unique key → 409 Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const label = FIELD_LABELS[field] || field;
    let value = err.keyValue?.[field];
    // Format Date values to readable date string
    if (value instanceof Date) value = value.toISOString().split('T')[0];
    err.statusCode = 409;
    err.message = value
      ? `${label} "${value}" is already in use`
      : `${label} already exists`;
  }
  // Invalid ObjectId → 400
  if (err.name === 'CastError') {
    err.statusCode = 400;
    err.message = 'Invalid ID format';
  }
  return err;
};

const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  normalizeMongoError(err);
  const statusCode = err.statusCode || 500;
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  });
};

module.exports = { notFound, errorHandler };
