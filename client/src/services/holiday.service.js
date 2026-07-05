import api from './api';

export const getHolidays = (params) => api.get('/holidays', { params });
export const getHoliday = (id) => api.get(`/holidays/${id}`);
export const getCalendar = (year, month) => api.get(`/holidays/calendar/${year}/${month}`);
export const createHoliday = (data) => api.post('/holidays', data);
export const updateHoliday = (id, data) => api.put(`/holidays/${id}`, data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`);
