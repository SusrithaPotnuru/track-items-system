import api from './api';

export const getAuditLogs = (params) => api.get('/audit-logs', { params });
export const getAuditLog = (id) => api.get(`/audit-logs/${id}`);
export const getAuditLogStats = () => api.get('/audit-logs/stats');
export const exportAuditLogs = (params) => api.get('/audit-logs/export', { params, responseType: 'blob' });
