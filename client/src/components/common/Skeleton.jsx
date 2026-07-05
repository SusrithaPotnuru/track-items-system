const Skeleton = ({ className = '', rows = 1 }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
    ))}
  </div>
);

export const TableSkeleton = ({ cols = 5, rows = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-b border-gray-100">
        {Array.from({ length: cols }).map((__, j) => (
          <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
