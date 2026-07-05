import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiCheck, FiX, FiSend } from 'react-icons/fi';
import {
  getEntries, deleteEntry, submitEntry, approveEntry, rejectEntry,
} from '../../services/entry.service';
import { getEmployees } from '../../services/employee.service';
import { getProjects } from '../../services/project.service';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown from '../../components/common/Dropdown';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ToastContainer from '../../components/common/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const Entries = () => {
  const { isAdmin, user } = useAuth();
  const isManager = user?.role === 'manager';
  const canApproveReject = isAdmin || isManager;

  const { page, limit, setPage, reset: resetPage } = usePagination();
  const { toasts, toast, removeToast } = useToast();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [acting, setActing] = useState(null); // entry id currently being acted on

  useEffect(() => {
    Promise.all([
      getEmployees({ limit: 200, status: 'active' }),
      getProjects({ limit: 200 }),
    ]).then(([eRes, pRes]) => {
      setEmployees([
        { value: '', label: 'All Employees' },
        ...eRes.data.data.map((e) => ({ value: e._id, label: `${e.name} (${e.employeeId})` })),
      ]);
      setProjects([
        { value: '', label: 'All Projects' },
        ...pRes.data.data.map((p) => ({ value: p._id, label: p.name })),
      ]);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEntries({
        page, limit, status: statusFilter,
        employee: employeeFilter, project: projectFilter,
        startDate, endDate, sortBy, sortOrder,
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, employeeFilter, projectFilter, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
    resetPage();
  };

  const handleSubmit = async (id) => {
    setActing(id);
    try {
      await submitEntry(id);
      toast.success('Entry submitted for review');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit entry');
    } finally {
      setActing(null);
    }
  };

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveEntry(id);
      toast.success('Entry approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve entry');
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEntry(deleteId);
      setDeleteId(null);
      toast.success('Entry deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await rejectEntry(rejectId, { rejectionReason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      toast.success('Entry rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject entry');
    } finally {
      setRejecting(false);
    }
  };

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDate(v) },
    { key: 'employee', label: 'Employee', render: (v) => v ? `${v.name} (${v.employeeId})` : '—' },
    { key: 'project', label: 'Project', render: (v) => v?.name || '—' },
    { key: 'totalItems', label: 'Items', sortable: true },
    { key: 'totalHours', label: 'Hours', render: (v) => `${v}h` },
    { key: 'productivityScore', label: 'Score', sortable: true, render: (v) => `${v}%` },
    { key: 'status', label: 'Status', render: (v) => <Badge value={v} /> },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link to={`/entries/${row._id}`}>
            <Button variant="ghost" size="sm" title="View"><FiEye /></Button>
          </Link>
          {['draft', 'rejected'].includes(row.status) && (
            <Link to={`/entries/${row._id}/edit`}>
              <Button variant="ghost" size="sm" title="Edit"><FiEdit2 /></Button>
            </Link>
          )}
          {['draft', 'rejected'].includes(row.status) && (
            <Button
              variant="ghost"
              size="sm"
              title="Submit"
              className="text-blue-500 hover:text-blue-600"
              loading={acting === row._id}
              onClick={() => handleSubmit(row._id)}
            >
              <FiSend />
            </Button>
          )}
          {row.status === 'submitted' && canApproveReject && (
            <>
              <Button
                variant="ghost"
                size="sm"
                title="Approve"
                className="text-green-600 hover:text-green-700"
                loading={acting === row._id}
                onClick={() => handleApprove(row._id)}
              >
                <FiCheck />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Reject"
                className="text-red-500 hover:text-red-600"
                onClick={() => { setRejectId(row._id); setRejectReason(''); }}
              >
                <FiX />
              </Button>
            </>
          )}
          {row.status === 'draft' && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600"
              title="Delete"
              onClick={() => setDeleteId(row._id)}
            >
              <FiTrash2 />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Daily Entries</h1>
        <Link to="/entries/add">
          <Button><FiPlus className="mr-1" />Add Entry</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Dropdown
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
          placeholder={null}
          className="w-36"
        />
        <Dropdown
          options={employees}
          value={employeeFilter}
          onChange={(e) => { setEmployeeFilter(e.target.value); resetPage(); }}
          placeholder={null}
          className="w-52"
        />
        <Dropdown
          options={projects}
          value={projectFilter}
          onChange={(e) => { setProjectFilter(e.target.value); resetPage(); }}
          placeholder={null}
          className="w-44"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); resetPage(); }}
          className="w-40"
          placeholder="From date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); resetPage(); }}
          className="w-40"
          placeholder="To date"
        />
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No entries found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        confirmLabel="Delete"
        title="Delete Entry"
        message="Delete this draft entry? This cannot be undone."
      />

      <Modal
        open={!!rejectId}
        onClose={() => { setRejectId(null); setRejectReason(''); }}
        title="Reject Entry"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Provide a reason for rejection. The employee will be able to edit and resubmit the entry.
          </p>
          <textarea
            className="input-field h-28 resize-none"
            placeholder="Rejection reason (required)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => { setRejectId(null); setRejectReason(''); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={rejecting}
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              Reject Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Entries;
