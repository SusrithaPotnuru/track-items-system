import { capitalize } from '../../utils/formatters';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';

const CUSTOM_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  planning: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  // Holiday types
  national: 'bg-red-100 text-red-700',
  festival: 'bg-yellow-100 text-yellow-700',
  company: 'bg-blue-100 text-blue-700',
  emergency: 'bg-orange-100 text-orange-700',
  ...STATUS_COLORS,
  ...PRIORITY_COLORS,
};

const Badge = ({ value, className = '' }) => {
  const colorClass = CUSTOM_COLORS[value] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {capitalize(value)}
    </span>
  );
};

export default Badge;
