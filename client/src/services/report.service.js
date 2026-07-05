import api from './api';

export const getReports = (params) => api.get('/reports', { params });
export const getReport = (id) => api.get(`/reports/${id}`);
export const getReportSummary = () => api.get('/reports/summary');
export const getReportAnalytics = (params) => api.get('/reports/analytics', { params });
export const generateWeekly = (data) => api.post('/reports/generate/weekly', data);
export const generateMonthly = (data) => api.post('/reports/generate/monthly', data);
export const generateCustom = (data) => api.post('/reports/generate/custom', data);
export const downloadReport = (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' });
export const deleteReport = (id) => api.delete(`/reports/${id}`);
