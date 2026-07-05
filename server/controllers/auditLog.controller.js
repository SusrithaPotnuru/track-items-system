const fs = require('fs');
const auditLogService = require('../services/auditLog.service');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getLogs = async (req, res) => {
  const result = await auditLogService.getLogs(req.query);
  return sendSuccess(res, 'Audit logs fetched', result.data, 200, result.pagination);
};

const getById = async (req, res) => {
  const log = await auditLogService.getById(req.params.id);
  return sendSuccess(res, 'Audit log fetched', log);
};

const getStats = async (req, res) => {
  const stats = await auditLogService.getStats();
  return sendSuccess(res, 'Audit log stats fetched', stats);
};

const exportLogs = async (req, res) => {
  const { format = 'pdf', ...rest } = req.query;
  const { filePath, fileName } = await auditLogService.exportLogs({ format, ...rest });

  const mimeTypes = {
    pdf: 'application/pdf',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
  };
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', mimeTypes[format] || 'application/octet-stream');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('end', () => { try { fs.unlinkSync(filePath); } catch {} });
  stream.on('error', () => sendError(res, 'Export streaming failed', 500));
};

module.exports = { getLogs, getById, getStats, exportLogs };
