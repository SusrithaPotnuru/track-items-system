const AuditLog = require('../models/AuditLog.model');
const logger = require('../config/logger');

/**
 * Fire-and-forget audit log writer. Safe to call from anywhere —
 * errors are caught and logged to Winston without crashing the caller.
 */
const logAudit = (data) => {
  AuditLog.create(data).catch((err) =>
    logger.error(`Audit log failed: ${err.message}`)
  );
};

/**
 * Build a logAudit payload from an Express request object.
 * Used by controllers/middlewares that have access to req.
 */
const auditFromReq = (req, overrides = {}) => {
  const ua = req.headers['user-agent'] || '';
  const browser = ua.match(/(Edg|Firefox|Chrome|Safari|Opera|MSIE|Trident)/)?.[1] || 'Unknown';
  const os = ua.match(/(Windows NT|Mac OS X|Linux|Android|iPhone OS)/)?.[1]?.replace(/_/g, '.') || 'Unknown';

  return {
    userId: req.user?.id || null,
    userName: req.user?.fullName || null,
    userRole: req.user?.role || null,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    browser,
    os,
    ...overrides,
  };
};

module.exports = { logAudit, auditFromReq };
