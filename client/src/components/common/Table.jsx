import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

const Table = ({ columns, data, loading, pagination, onPageChange, sortBy, sortOrder, onSort, emptyTitle }) => {
  const renderSort = (key) => {
    if (!onSort) return null;
    return (
      <button onClick={() => onSort(key)} className="ml-1 inline-flex flex-col">
        <FiChevronUp className={`w-3 h-3 ${sortBy === key && sortOrder === 'asc' ? 'text-primary-600' : 'text-gray-300'}`} />
        <FiChevronDown className={`w-3 h-3 -mt-1 ${sortBy === key && sortOrder === 'desc' ? 'text-primary-600' : 'text-gray-300'}`} />
      </button>
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable && renderSort(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length}><TableSkeleton cols={columns.length} /></td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={columns.length}><EmptyState title={emptyTitle || 'No records found'} /></td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row._id || i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
};

export default Table;
