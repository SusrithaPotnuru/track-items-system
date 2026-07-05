import api from './api';

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getDashboardCharts = () => api.get('/dashboard/charts');
export const getTopPerformers = () => api.get('/dashboard/top-performers');
export const getRecentActivities = () => api.get('/dashboard/recent-activities');
