import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { getEntry, updateEntry, checkDate } from '../../services/entry.service';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { FiPlus, FiTrash2, FiSave, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { toISODate } from '../../utils/dateUtils';
import { formatDate } from '../../utils/formatters';

const AUTOSAVE_DELAY = 12000;

const RunningTotals = ({ tasks }) => {
  const items = tasks.reduce((s, t) => s + Number(t.completedItems || 0), 0);
  const hours = tasks.reduce((s, t) => s + Number(t.workingHours || 0), 0);
  const avg = hours > 0 ? (items / hours).toFixed(2) : 0;
  const hoursOver = hours > 24;

  return (
    <div className={`card p-4 grid grid-cols-3 gap-4 text-center ${hoursOver ? 'border-red-300 dark:border-red-700' : ''}`}>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Items</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{items}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Hours</p>
        <p className={`text-2xl font-bold ${hoursOver ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
          {hours.toFixed(1)}h
        </p>
        {hoursOver && <p className="text-xs text-red-500 mt-0.5">Exceeds 24h limit</p>}
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">Avg Items/Hour</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{avg}</p>
      </div>
    </div>
  );
};

const EditEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entryMeta, setEntryMeta] = useState(null); // employee, project, department (readonly)
  const [dateWarning, setDateWarning] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const lastSavedRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const {
    register, handleSubmit, control, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });
  const watchedValues = watch();
  const watchDate = watch('date');
  const watchTasks = watch('tasks');

  useEffect(() => {
    getEntry(id).then((res) => {
      const e = res.data.data;
      if (!['draft', 'rejected'].includes(e.status)) {
        navigate(`/entries/${id}`);
        return;
      }
      setEntryMeta({
        employee: e.employee,
        project: e.project,
        department: e.department,
        status: e.status,
        rejectionReason: e.rejectionReason,
      });
      reset({
        date: toISODate(e.date),
        tasks: e.tasks.map((t) => ({
          taskName: t.taskName || '',
          completedItems: t.completedItems ?? '',
          workingHours: t.workingHours ?? '',
          description: t.description || '',
          remarks: t.remarks || '',
        })),
      });
      const serialized = JSON.stringify({ date: toISODate(e.date), tasks: e.tasks });
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
      setLoading(false);
    }).catch(() => {
      navigate('/entries');
    });
  }, [id, reset, navigate]);

  // Date warning
  useEffect(() => {
    if (!watchDate || !entryMeta?.employee?._id) { setDateWarning(''); return; }
    checkDate({ date: watchDate, employeeId: entryMeta.employee._id })
      .then((r) => {
        const d = r.data.data;
        if (d.isFuture) setDateWarning('Cannot create entry for a future date');
        else if (d.isHoliday) setDateWarning(`Holiday: ${d.holidayName}`);
        else if (d.isWeekOff) setDateWarning('This day is a week-off');
        else if (d.entryExists && d.existingEntryId?.toString() !== id) {
          setDateWarning('Another entry already exists for this employee on this date');
        } else setDateWarning('');
      })
      .catch(() => setDateWarning(''));
  }, [watchDate, entryMeta, id]);

  const formatPayload = useCallback((values) => ({
    date: values.date,
    tasks: (values.tasks || []).map((t) => ({
      ...t,
      completedItems: Number(t.completedItems) || 0,
      workingHours: Number(t.workingHours) || 0,
    })),
  }), []);

  const doAutoSave = useCallback(async (values) => {
    const serialized = JSON.stringify(values);
    if (serialized === lastSavedRef.current) return;
    setSaveStatus('saving');
    try {
      await updateEntry(id, formatPayload(values));
      lastSavedRef.current = serialized;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [id, formatPayload]);

  // Debounced autosave
  useEffect(() => {
    if (loading) return;
    const serialized = JSON.stringify(watchedValues);
    if (serialized === lastSavedRef.current) return;
    setSaveStatus('pending');
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doAutoSave(watchedValues), AUTOSAVE_DELAY);
    return () => clearTimeout(autoSaveTimer.current);
  }, [JSON.stringify(watchedValues), loading]);

  const shouldBlock = saveStatus === 'pending' || saveStatus === 'saving';
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    const handler = (e) => {
      if (shouldBlock) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldBlock]);

  const onSubmit = async (data) => {
    if (dateWarning) return;
    const totalHours = (data.tasks || []).reduce((s, t) => s + Number(t.workingHours || 0), 0);
    if (totalHours > 24) { setError('Total working hours cannot exceed 24h'); return; }
    try {
      setError('');
      clearTimeout(autoSaveTimer.current);
      await updateEntry(id, formatPayload(data));
      lastSavedRef.current = JSON.stringify(data);
      setSaveStatus('saved');
      navigate(`/entries/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update entry');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Edit Entry</h1>
        <SaveStatusBadge status={saveStatus} />
      </div>

      {/* Rejection reason banner */}
      {entryMeta?.status === 'rejected' && entryMeta.rejectionReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 dark:bg-red-900/20 dark:border-red-800">
          <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Entry was rejected</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{entryMeta.rejectionReason}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-start gap-2">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {dateWarning && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300">
          {dateWarning}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Readonly entry info */}
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              max={toISODate(new Date())}
              error={errors.date?.message}
              {...register('date', { required: 'Date is required' })}
            />
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Employee</p>
              <div className="input-field bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed">
                {entryMeta?.employee?.name} ({entryMeta?.employee?.employeeId})
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Project</p>
              <div className="input-field bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed">
                {entryMeta?.project?.name} ({entryMeta?.project?.projectCode})
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Department</p>
              <div className="input-field bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed">
                {entryMeta?.department?.name || '—'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Employee and project cannot be changed after creation.</p>
        </div>

        {/* Tasks */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tasks</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ taskName: '', completedItems: '', workingHours: '', description: '', remarks: '' })}
            >
              <FiPlus className="mr-1" />Add Task
            </Button>
          </div>

          {fields.map((field, i) => (
            <div key={field.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Task {i + 1}</span>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Input
                label="Task Name *"
                placeholder="What did you work on?"
                error={errors.tasks?.[i]?.taskName?.message}
                {...register(`tasks.${i}.taskName`, { required: 'Task name is required' })}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Completed Items *"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  error={errors.tasks?.[i]?.completedItems?.message}
                  {...register(`tasks.${i}.completedItems`, { required: 'Required', min: { value: 0, message: 'Must be >= 0' } })}
                />
                <Input
                  label="Working Hours *"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="0.0"
                  error={errors.tasks?.[i]?.workingHours?.message}
                  {...register(`tasks.${i}.workingHours`, { required: 'Required', min: { value: 0, message: 'Must be >= 0' } })}
                />
                <Input
                  label="Description"
                  placeholder="Optional..."
                  {...register(`tasks.${i}.description`)}
                />
              </div>
              <Input
                label="Remarks"
                placeholder="Any notes..."
                {...register(`tasks.${i}.remarks`)}
              />
            </div>
          ))}
        </div>

        {/* Running totals */}
        <RunningTotals tasks={watchTasks || []} />

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!!dateWarning}>
            <FiSave className="mr-1" />Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/entries/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Unsaved Changes"
        message="You have unsaved changes. Leave without saving?"
        confirmLabel="Leave"
        danger
      />
    </div>
  );
};

const SaveStatusBadge = ({ status }) => {
  if (status === 'idle') return null;
  const config = {
    pending: { label: 'Unsaved changes', cls: 'text-yellow-600 dark:text-yellow-400' },
    saving: { label: 'Auto-saving...', cls: 'text-blue-500 dark:text-blue-400' },
    saved: { label: 'Saved', cls: 'text-green-600 dark:text-green-400' },
    error: { label: 'Auto-save failed', cls: 'text-red-500' },
  };
  const { label, cls } = config[status] || {};
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
};

export default EditEntry;
