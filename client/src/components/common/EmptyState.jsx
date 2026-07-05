import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ title = 'No data found', description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <FiInbox className="w-12 h-12 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</h3>
    {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
