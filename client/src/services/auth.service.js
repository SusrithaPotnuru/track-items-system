import api from './api';

export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const uploadProfilePhoto = (formData) =>
  api.post('/auth/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword = (data) => api.put('/auth/change-password', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
