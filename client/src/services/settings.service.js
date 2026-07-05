import api from './api';

export const getSettings = () => api.get('/settings');
export const updateGeneral = (data) => api.put('/settings/general', data);
export const updateProductivity = (data) => api.put('/settings/productivity', data);
export const updateSmtp = (data) => api.put('/settings/smtp', data);
export const testSmtp = () => api.post('/settings/smtp/test');
export const updateSecurity = (data) => api.put('/settings/security', data);
export const updateScheduler = (data) => api.put('/settings/scheduler', data);
export const uploadLogo = (formData) =>
  api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
