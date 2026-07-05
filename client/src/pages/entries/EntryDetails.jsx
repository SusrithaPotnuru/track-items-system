import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiEdit2, FiSend, FiCheck, FiX, FiClock, FiUser,
} from 'react-icons/fi';
import { getEntry, submitEntry, approveEntry, rejectEntry } from '../../services/entry.service';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { getProductivityLevel } from '../../utils/constants';

const LEVEL_COLORS = {
  'Excellent':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Very Good':        'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  'Good':             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Average':          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Needs Improvement':'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const HISTORY_ICONS = {
  created:   { icon: FiClock, cls: 'text-gray-400' },
  updated:   { icon: FiEdit2, cls: 'text-blue-400' },
  submitted: { icon: FiSend, cls: 'text-blue-500' },
  approved:  { icon: FiCheck, cls: 'text-green-500' },
  rejected:  { icon: FiX, cls: 'text-red-500' },
};

const Field = ({ label, children, span = 1 }) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{children}</div>
  </div>
);

const EntryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const isManager = user?.role === 'manager';
  const canApproveReject = isAdmin || isManager;

  const { toasts, toast, removeToast } = useToast();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = () =>
    getEntry(id)
      .then((r) => { setEntry(r.data.data); setLoading(false); })
      .catch(() => navigate('/entries'));

  useEffect(() => { load(); }, [id]);

  const handleSubmit = async () => {
    setActing(true);
    try {
      await submitEntry(id);
      toast.success('Entry submitted for review');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setActing(false); }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await approveEntry(id);
      toast.success('Entry approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActing(true);
    try {
      await rejectEntry(id, { rejectionReason: rejectReason });
      setRejectOpen(false);
      setRejectReason('');
      toast.success('Entry rejected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally { setActing(false); }
  };

  if (loading) return <Loader />;
  if (!entry) return null;

  const level = getProductivityLevel(entry.productivityScore || 0);
  const levelColor = LEVEL_COLORS[entry.performanceLevel] || LEVEL_COLORS['Needs Improvement'];

  return (
    <div className="max-w-3xl space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/entries">
          <Button variant="ghost" size="sm"><FiArrowLeft /></Button>
        </Link>
        <h1 className="page-title flex-1">Entry Details</h1>
        <Badge value={entry.status} />

        {['draft', 'rejected'].includes(entry.status) && (
          <Link to={`/entries/${id}/edit`}>
            <Button size="sm" variant="secondary"><FiEdit2 className="mr-1" />Edit</Button>
          </Link>
        )}
        {['draft', 'rejected'].includes(entry.status) && (
          <Button size="sm" loading={acting} onClick={handleSubmit}>
            <FiSend className="mr-1" />Submit
          </Button>
        )}
        {entry.status === 'submitted' && canApproveReject && (
          <>
            <Button
              size="sm"
              loading={acting}
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FiCheck className="mr-1" />Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => { setRejectOpen(true); setRejectReason(''); }}
            >
              <FiX className="mr-1" />Reject
            </Button>
          </>
        )}
      </div>

      {/* Rejection reason */}
      {entry.status === 'rejected' && entry.rejectionReason && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700 dark:text-red-300">{entry.rejectionReason}</p>
        </div>
      )}

      {/* Productivity Score Card */}
      <div className={`card p-5 flex items-center gap-6 ${levelColor}`}>
        <div className="text-center">
          <p className="text-4xl font-bold">{entry.productivityScore}%</p>
          <p className="text-xs uppercase tracking-wide mt-1 font-medium">Productivity</p>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{entry.totalItems}</p>
            <p className="text-xs uppercase tracking-wide">Items Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{entry.totalHours}h</p>
            <p className="text-xs uppercase tracking-wide">Hours Worked</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{entry.avgItemsPerHour}</p>
            <p className="text-xs uppercase tracking-wide">Avg/Hour</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold">{entry.performanceLevel}</span>
          <p className="text-xs mt-0.5">Target: {entry.dailyTargetSnapshot} items</p>
        </div>
      </div>

      {/* Entry metadata */}
      <div className="card p-5 grid grid-cols-2 gap-4">
        <Field label="Date">{formatDate(entry.date)}</Field>
        <Field label="Employee">
          {entry.employee?.name} ({entry.employee?.employeeId})
        </Field>
        <Field label="Project">{entry.project?.name} ({entry.project?.projectCode})</Field>
        <Field label="Department">{entry.department?.name || '—'}</Field>
        <Field label="Avg Hours/Task">{entry.avgHoursPerTask}h</Field>
        <Field label="Created By">{entry.createdBy?.fullName || '—'}</Field>
        {entry.submittedBy && (
          <Field label="Submitted">
            {entry.submittedBy?.fullName} · {formatDateTime(entry.submittedAt)}
          </Field>
        )}
        {entry.approvedBy && (
          <Field label="Approved">
            {entry.approvedBy?.fullName} · {formatDateTime(entry.approvedAt)}
          </Field>
        )}
        {entry.rejectedBy && (
          <Field label="Rejected By">
            {entry.rejectedBy?.fullName} · {formatDateTime(entry.rejectedAt)}
          </Field>
        )}
      </div>

      {/* Tasks */}
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Tasks ({entry.tasks?.length})
        </h3>
        {entry.tasks?.map((t, i) => (
          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm space-y-1">
            <p className="font-medium text-gray-800 dark:text-gray-200">{t.taskName}</p>
            {t.description && <p className="text-gray-500 dark:text-gray-400">{t.description}</p>}
            <div className="flex gap-6 text-gray-500 dark:text-gray-400">
              <span>Items: <strong className="text-gray-800 dark:text-gray-200">{t.completedItems}</strong></span>
              <span>Hours: <strong className="text-gray-800 dark:text-gray-200">{t.workingHours}h</strong></span>
            </div>
            {t.remarks && <p className="text-xs text-gray-400">{t.remarks}</p>}
          </div>
        ))}
      </div>

      {/* History Timeline */}
      {entry.history?.length > 0 && (
        <div className="card p-5 space-y-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Approval History
          </h3>
          <div className="space-y-3">
            {entry.history.map((h, i) => {
              const { icon: Icon, cls } = HISTORY_ICONS[h.action] || HISTORY_ICONS.created;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${cls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {h.action}
                      </span>
                      {h.toStatus && h.fromStatus !== h.toStatus && (
                        <span className="text-xs text-gray-400">
                          {h.fromStatus} → {h.toStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {h.byName && (
                        <span className="flex items-center gap-1">
                          <FiUser className="w-3 h-3" />{h.byName}
                        </span>
                      )}
                      <span>{formatDateTime(h.at)}</span>
                    </div>
                    {h.note && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">{h.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectReason(''); }}
        title="Reject Entry"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The employee will be notified and can edit and resubmit the entry.
          </p>
          <textarea
            className="input-field h-28 resize-none"
            placeholder="Rejection reason (required)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={acting}
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

export default EntryDetails;
