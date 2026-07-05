import api from './api';

export const getEntries = (params) => api.get('/entries', { params });
export const getEntry = (id) => api.get(`/entries/${id}`);
export const checkDate = (params) => api.get('/entries/check-date', { params });
export const createEntry = (data) => api.post('/entries', data);
export const updateEntry = (id, data) => api.put(`/entries/${id}`, data);
export const deleteEntry = (id) => api.delete(`/entries/${id}`);
export const submitEntry = (id) => api.put(`/entries/${id}/submit`);
export const approveEntry = (id) => api.put(`/entries/${id}/approve`);
export const rejectEntry = (id, data) => api.put(`/entries/${id}/reject`, data);
