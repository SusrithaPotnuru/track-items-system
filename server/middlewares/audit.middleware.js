const { logAudit, auditFromReq } = require('../utils/auditHelper');

// Map HTTP method + URL segments to a human-readable action name
const deriveAction = (method, url) => {
  const path = url.split('?')[0].toLowerCase();

  // Special sub-resource patterns take priority
  if (method === 'PUT' && path.endsWith('/submit')) return 'SUBMIT';
  if (method === 'PUT' && path.endsWith('/approve')) return 'APPROVE';
  if (method === 'PUT' && path.endsWith('/reject')) return 'REJECT';
  if (method === 'POST' && path.includes('/retry')) return 'RETRY_EMAIL';
  if (method === 'POST' && path.includes('/generate/weekly')) return 'GENERATE_REPORT';
  if (method === 'POST' && path.includes('/generate/monthly')) return 'GENERATE_REPORT';
  if (method === 'POST' && path.includes('/generate/custom')) return 'GENERATE_REPORT';
  if (method === 'GET' && path.includes('/download')) return 'DOWNLOAD_REPORT';
  if (method === 'GET' && path.includes('/export')) return 'EXPORT';
  if (method === 'POST' && path.includes('/import')) return 'BULK_IMPORT';

  const MAP = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE', GET: 'READ' };
  return MAP[method] || method;
};

/**
 * Auto-audits write (POST/PUT/PATCH/DELETE) operations.
 * Pass `skipRead: false` to also audit GET requests.
 */
const auditMiddleware = (module, options = {}) => async (req, res, next) => {
  const { skipRead = true, actionOverride = null } = options;
  if (skipRead && req.method === 'GET') return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (req.user) {
      const status = res.statusCode < 400 ? 'success' : 'failure';
      logAudit({
        ...auditFromReq(req),
        action: actionOverride || deriveAction(req.method, req.originalUrl),
        module,
        status,
        details: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
        },
      });
    }
    return originalJson(body);
  };
  next();
};

module.exports = auditMiddleware;
