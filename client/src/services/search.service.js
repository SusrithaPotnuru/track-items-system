import api from './api';

export const search = (q, type) => api.get('/search', { params: { q, type } });
