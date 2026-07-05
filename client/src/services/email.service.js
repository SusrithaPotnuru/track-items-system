import api from './api';

export const sendEmail = (data) => api.post('/emails/send', data);
export const sendTestEmail = (email) => api.post('/emails/test', { email });
export const validateSmtp = () => api.post('/emails/validate-smtp');
export const retryEmail = (id) => api.post(`/emails/${id}/retry`);
export const getEmailHistory = (params) => api.get('/emails/history', { params });
export const getEmailStats = () => api.get('/emails/stats');
export const getEmailRecord = (id) => api.get(`/emails/${id}`);
export const deleteEmailRecord = (id) => api.delete(`/emails/${id}`);

export const getSchedulerStatus = () => api.get('/scheduler/status');
export const toggleScheduler = (type, enabled) => api.post('/scheduler/toggle', { type, enabled });
export const runSchedulerJob = (type = 'report') => api.post('/scheduler/run', { type });
export const getSchedulerLogs = (params) => api.get('/scheduler/logs', { params });
