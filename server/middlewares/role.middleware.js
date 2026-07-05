const { sendError } = require('../utils/responseHelper');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 'Access denied: insufficient permissions', 403);
  }
  next();
};

module.exports = requireRole;
