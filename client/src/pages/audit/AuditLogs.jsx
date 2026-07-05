import { useState, useEffect, useCallback } from 'react';
import {
  getAuditLogs, getAuditLogStats, exportAuditLogs,
} from '../../services/auditLog.service';
import useToast from '../../hooks/useToast';
import ToastContainer from '../../components/common/Toast';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import Pagination from '../../components/common/Pagination';
import {
  FiSearch, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiCheckCircle, FiXCircle, FiInfo, FiFilter,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const MODULES = ['', 'auth', 'employee', 'project', 'entry', 'holiday', 'report', 'email', 'settings', 'department', 'scheduler', 'profile', 'analytics'];
const ACTIONS = [
  '', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'FORGOT_PASSWORD', 'RESET_PASSWORD',
  'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'BULK_IMPORT',
  'SUBMIT', 'APPROVE', 'REJECT',
  'GENERATE_REPORT', 'DOWNLOAD_REPORT',
  'SEND_EMAIL', 'RETRY_EMAIL',
  'SCHEDULER_RUN', 'SCHEDULER_TOGGLE',
  'SETTINGS_UPDATED', 'SMTP_TEST',
];
const STATUSES = ['', 'success', 'failure', 'info'];
const ROLES = ['', 'admin', 'manager'];

// ─── Badge helpers ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    success: { cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: <FiCheckCircle className="inline mr-1" /> },
    failure: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: <FiXCircle className="inline mr-1" /> },
    info:    { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: <FiInfo className="inline mr-1" /> },
  };
  const s = map[status] || map.info;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.icon}{status}
    </span>
  );
};

const ModuleBadge = ({ module }) => {
  const colours = {
    auth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    entry: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    report: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    email: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    settings: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    scheduler: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    analytics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  };
  const cls = colours[module] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {module}
    </span>
  );
};

const fmtDateTime = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Stats bar ─────────────────────────────────────────────────────────────────
const StatsBar = ({ stats }) => {
  if (!stats) return null;
  const { byStatus = {}, total = 0 } = stats;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total', value: total, cls: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
        { label: 'Success', value: byStatus.success || 0, cls: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
        { label: 'Failure', value: byStatus.failure || 0, cls: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
        { label: 'Info', value: byStatus.info || 0, cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
      ].map(({ label, value, cls }) => (
        <div key={label} className={`rounded-lg border p-3 ${cls}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Expanded detail panel ─────────────────────────────────────────────────────
const DetailPanel = ({ log }) => (
  <tr className="bg-gray-50 dark:bg-gray-900">
    <td colSpan={8} className="px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Browser / OS</p>
          <p className="text-gray-600 dark:text-gray-400">{log.browser || '—'} / {log.os || '—'}</p>
        </div>
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</p>
          <p className="text-gray-600 dark:text-gray-400">{log.ipAddress || '—'}</p>
        </div>
        {log.details && (
          <div className="sm:col-span-2">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Details</p>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs overflow-auto max-h-40 text-gray-700 dark:text-gray-300">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </td>
  </tr>
);

// ─── Select helper ─────────────────────────────────────────────────────────────
const Sel = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
  >
    <option value="">{placeholder}</option>
    {options.filter(Boolean).map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
);

// ─── Main component ────────────────────────────────────────────────────────────
const AuditLogs = () => {
  const { page, limit, setPage } = usePagination(25);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [userRole, setUserRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debouncedSearch = useDebounce(search, 300);
  const { toasts, showToast, removeToast } = useToast();

  const activeFilterCount = [module, action, status, userRole, startDate, endDate].filter(Boolean).length;

  const loadStats = useCallback(async () => {
    try {
      const res = await getAuditLogStats();
      setStats(res.data.data);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search: debouncedSearch, module, action, status, userRole };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getAuditLogs(params);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      showToast('Failed to load audit logs', 'error');
    }
    setLoading(false);
  }, [page, limit, debouncedSearch, module, action, status, userRole, startDate, endDate]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const params = { format, module, action, status, userRole, search: debouncedSearch };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await exportAuditLogs(params);
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Audit logs exported as ${format.toUpperCase()}`, 'success');
    } catch {
      showToast('Export failed', 'error');
    }
    setExportLoading(false);
  };

  const handleReset = () => {
    setSearch('');
    setModule('');
    setAction('');
    setStatus('');
    setUserRole('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const toggleRow = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track every system action — login, CRUD, approvals, exports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { load(); loadStats(); }}
            className="btn btn-secondary flex items-center gap-1.5 text-sm"
            title="Refresh"
          >
            <FiRefreshCw size={14} /> Refresh
          </button>
          {['pdf', 'excel', 'csv'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={exportLoading}
              className="btn btn-secondary flex items-center gap-1.5 text-sm"
            >
              <FiDownload size={14} /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Search + Filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, action, module, IP…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn flex items-center gap-1.5 text-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FiFilter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Module</label>
              <Sel value={module} onChange={(v) => { setModule(v); setPage(1); }} options={MODULES} placeholder="All Modules" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Action</label>
              <Sel value={action} onChange={(v) => { setAction(v); setPage(1); }} options={ACTIONS} placeholder="All Actions" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <Sel value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUSES} placeholder="All Statuses" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
              <Sel value={userRole} onChange={(v) => { setUserRole(v); setPage(1); }} options={ROLES} placeholder="All Roles" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="mt-3 text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <FiSearch className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No audit logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {['Time', 'User', 'Role', 'Action', 'Module', 'Status', 'IP', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((log) => (
                  <>
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => toggleRow(log._id)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {fmtDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {log.userName || <span className="text-gray-400">System</span>}
                      </td>
                      <td className="px-4 py-3">
                        {log.userRole ? (
                          <span className="capitalize text-xs text-gray-600 dark:text-gray-400">{log.userRole}</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ModuleBadge module={log.module} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status || 'info'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {expandedId === log._id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </td>
                    </tr>
                    {expandedId === log._id && <DetailPanel key={`${log._id}-detail`} log={log} />}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default AuditLogs;
