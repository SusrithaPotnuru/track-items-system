import api from './api';

export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const uploadEmployeePhoto = (id, formData) =>
  api.post(`/employees/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
