import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../services/holiday.service';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import SearchBox from '../../components/common/SearchBox';
import ToastContainer from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import { HOLIDAY_TYPES } from '../../utils/constants';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = CURRENT_YEAR - 1 + i;
    return { value: String(y), label: String(y) };
  }),
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...HOLIDAY_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const HolidayManagement = () => {
  const { page, limit, setPage, reset: resetPage } = usePagination();
  const { toasts, toast, removeToast } = useToast();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHolidays({
        page, limit, search,
        type: typeFilter, status: statusFilter, year: yearFilter,
        sortBy, sortOrder,
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, statusFilter, yearFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
    resetPage();
  };

  const handleSearch = (v) => { setSearch(v); resetPage(); };
  const handleType = (e) => { setTypeFilter(e.target.value); resetPage(); };
  const handleStatus = (e) => { setStatusFilter(e.target.value); resetPage(); };
  const handleYear = (e) => { setYearFilter(e.target.value); resetPage(); };

  const openAdd = () => {
    setEditItem(null);
    reset({ status: 'active', type: 'national' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    reset({ ...item, date: item.date?.split('T')[0] });
    setFormError('');
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    try {
      setFormError('');
      if (editItem) {
        await updateHoliday(editItem._id, formData);
        toast.success('Holiday updated');
      } else {
        await createHoliday(formData);
        toast.success('Holiday created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save holiday');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHoliday(deleteId);
      setDeleteId(null);
      toast.success('Holiday deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (v) => formatDate(v) },
    { key: 'type', label: 'Type', render: (v) => <Badge value={v} /> },
    { key: 'status', label: 'Status', render: (v) => <Badge value={v} /> },
    { key: 'description', label: 'Description', render: (v) => v || '—' },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <FiEdit2 />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row._id)}
            className="text-red-500 hover:text-red-600"
          >
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Manage Holidays</h1>
        <div className="flex gap-2">
          <Link to="/holidays">
            <Button variant="secondary" size="sm"><FiCalendar className="mr-1" />View Calendar</Button>
          </Link>
          <Button onClick={openAdd}><FiPlus className="mr-1" />Add Holiday</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <SearchBox onSearch={handleSearch} placeholder="Search by name..." className="flex-1 min-w-48" />
        <Dropdown options={TYPE_OPTIONS} value={typeFilter} onChange={handleType} placeholder={null} className="w-36" />
        <Dropdown options={STATUS_OPTIONS} value={statusFilter} onChange={handleStatus} placeholder={null} className="w-36" />
        <Dropdown options={YEAR_OPTIONS} value={yearFilter} onChange={handleYear} placeholder={null} className="w-32" />
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
        emptyTitle="No holidays found"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Holiday' : 'Add Holiday'}>
        {formError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name *"
            placeholder="Independence Day"
            error={errors.name?.message}
            {...register('name', { required: 'Holiday name is required' })}
          />
          <Input
            label="Date *"
            type="date"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <Dropdown
            label="Type *"
            placeholder={null}
            options={HOLIDAY_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            error={errors.type?.message}
            {...register('type', { required: 'Type is required' })}
          />
          <Dropdown
            label="Status"
            placeholder={null}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            {...register('status')}
          />
          <Input label="Description" placeholder="Optional description..." {...register('description')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editItem ? 'Save Changes' : 'Create Holiday'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Holiday"
        message="Delete this holiday? This cannot be undone."
        danger
        confirmLabel="Delete"
      />
    </div>
  );
};

export default HolidayManagement;
