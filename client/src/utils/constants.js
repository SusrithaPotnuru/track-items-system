export const STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const PROJECT_STATUS = ['planning', 'active', 'completed', 'on-hold', 'cancelled'];

export const HOLIDAY_TYPES = ['national', 'festival', 'company', 'emergency'];

export const REPORT_TYPES = ['weekly', 'monthly', 'custom'];

export const EXPORT_FORMATS = ['pdf', 'excel', 'csv'];

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
};

export const PRODUCTIVITY_LEVELS = [
  { min: 100, label: 'Excellent', color: '#22c55e' },
  { min: 90, label: 'Very Good', color: '#84cc16' },
  { min: 75, label: 'Good', color: '#eab308' },
  { min: 60, label: 'Average', color: '#f97316' },
  { min: 0, label: 'Needs Improvement', color: '#ef4444' },
];

export const getProductivityLevel = (score) => {
  if (score >= 100) return PRODUCTIVITY_LEVELS[0];
  if (score >= 90) return PRODUCTIVITY_LEVELS[1];
  if (score >= 75) return PRODUCTIVITY_LEVELS[2];
  if (score >= 60) return PRODUCTIVITY_LEVELS[3];
  return PRODUCTIVITY_LEVELS[4];
};

export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
