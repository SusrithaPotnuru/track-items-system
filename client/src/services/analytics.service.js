import api from './api';

export const getProductivity = (params) => api.get('/analytics/productivity', { params });
export const getMonthlyTrend = (params) => api.get('/analytics/trends/monthly', { params });
export const getWeeklyTrend = (params) => api.get('/analytics/trends/weekly', { params });
export const getYearlyTrend = () => api.get('/analytics/trends/yearly');
export const getDepartmentAnalytics = (params) => api.get('/analytics/department', { params });
export const getProjectAnalytics = (params) => api.get('/analytics/project', { params });
export const getTopEmployees = (params) => api.get('/analytics/employees/top', { params });
export const getLowPerformers = (params) => api.get('/analytics/employees/low', { params });
export const getApprovalTime = (params) => api.get('/analytics/approval-time', { params });
export const getRejectionAnalytics = (params) => api.get('/analytics/rejections', { params });
export const getAnalyticsKpi = (params) => api.get('/analytics/kpi', { params });
export const getEmployeeScore = (employeeId, params) => api.get(`/analytics/score/${employeeId}`, { params });
export const exportAnalytics = (params) => api.get('/analytics/export', { params, responseType: 'blob' });
export const clearAnalyticsCache = () => api.delete('/analytics/cache');
