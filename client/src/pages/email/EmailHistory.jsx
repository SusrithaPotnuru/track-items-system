import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiTrash2, FiRefreshCw, FiMail, FiSettings } from 'react-icons/fi';
import { getEmailHistory, deleteEmailRecord, retryEmail, getEmailStats } from '../../services/email.service';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import usePagination from '../../hooks/usePagination';
import { formatDateTime } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

const StatCard = ({ label, value, color }) => (
  <div className="card p-4 flex flex-col gap-1">
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value ?? 0}</span>
  </div>
);

const EmailHistory = () => {
  const { page, limit, setPage } = usePagination();
  const { toasts, toast, removeToast } = useToast();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await getEmailHistory(params);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load email history');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const res = await getEmailStats();
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      await retryEmail(id);
      toast.success('Email resent successfully');
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteEmailRecord(deleteId);
      setDeleteId(null);
      toast.success('Email record deleted');
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'to', label: 'Recipients',
      render: (v) => (
        <div className="max-w-[180px] truncate" title={v?.join(', ')}>
          {v?.join(', ')}
        </div>
      ),
    },
    {
      key: 'subject', label: 'Subject',
      render: (v) => <div className="max-w-[200px] truncate" title={v}>{v}</div>,
    },
    { key: 'status', label: 'Status', render: (v) => <Badge value={v} /> },
    { key: 'sentBy', label: 'Sent By', render: (v) => v?.fullName || <span className="text-gray-400 text-xs italic">Scheduler</span> },
    { key: 'sentAt', label: 'Sent At', render: (v) => formatDateTime(v) },
    { key: 'retryCount', label: 'Retries', render: (v) => v || 0 },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.status === 'failed' && (
            <Button
              variant="ghost" size="sm"
              className="text-blue-500 hover:text-blue-700"
              loading={retryingId === row._id}
              onClick={() => handleRetry(row._id)}
              title="Retry"
            >
              <FiRefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(row._id)} title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiMail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="page-title">Email History</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/email/settings">
            <Button variant="secondary" size="sm"><FiSettings className="mr-1.5" />Email Settings</Button>
          </Link>
          <Link to="/email/send">
            <Button size="sm"><FiSend className="mr-1.5" />Send Report</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} color="text-gray-800 dark:text-gray-100" />
          <StatCard label="Success" value={stats.success} color="text-green-600 dark:text-green-400" />
          <StatCard label="Failed" value={stats.failed} color="text-red-600 dark:text-red-400" />
          <StatCard label="Pending" value={stats.pending} color="text-yellow-600 dark:text-yellow-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by subject or recipient…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
          Clear
        </Button>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No emails sent yet"
        emptyMessage="Send a report or configure the scheduler to send automated emails."
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        danger
        confirmLabel="Delete"
        title="Delete Email Record"
        message="Remove this email record from history? This action cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default EmailHistory;
