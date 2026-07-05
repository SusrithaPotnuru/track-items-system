import { MONTH_NAMES, PRODUCTIVITY_LEVELS } from './constants';

export const formatDate = (date, opts = {}) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatNumber = (n, decimals = 0) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toFixed(decimals);
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
};

export const getProductivityLevel = (score) =>
  PRODUCTIVITY_LEVELS.find((l) => score >= l.min) || PRODUCTIVITY_LEVELS[PRODUCTIVITY_LEVELS.length - 1];

export const getMonthName = (month) => MONTH_NAMES[(month - 1) % 12];

export const truncate = (str, len = 40) =>
  str && str.length > len ? str.slice(0, len) + '…' : str || '';
