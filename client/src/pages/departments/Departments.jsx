import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/department.service';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchBox from '../../components/common/SearchBox';
import ToastContainer from '../../components/common/Toast';
import DepartmentForm from '../../components/forms/DepartmentForm';
import useToast from '../../hooks/useToast';
import usePagination from '../../hooks/usePagination';
import { formatDate } from '../../utils/formatters';

const Departments = () => {
  const { isAdmin } = useAuth();
  const { toasts, toast, removeToast } = useToast();
  const { page, setPage, reset: resetPage } = usePagination();

  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDepartments({
        page,
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      setDepartments(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
    resetPage();
  };

  const handleSearch = (val) => { setSearch(val); resetPage(); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); resetPage(); };

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await createDepartment(data);
      toast.success('Department created successfully');
      setShowAdd(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await updateDepartment(selected._id, data);
      toast.success('Department updated successfully');
      setShowEdit(false);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteDepartment(selected._id);
      toast.success('Department deleted');
      setShowDelete(false);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete department');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => { setSelected(row); setShowEdit(true); };
  const openDelete = (row) => { setSelected(row); setShowDelete(true); };
  const closeEdit = () => { setShowEdit(false); setSelected(null); };
  const closeDelete = () => { setShowDelete(false); setSelected(null); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    {
      key: 'description',
      label: 'Description',
      render: (v) => (
        <span className="text-gray-500 dark:text-gray-400">{v || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge value={v} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (v) => formatDate(v),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) =>
        isAdmin ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              title="Edit"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => openDelete(row)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage organizational departments
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAdd(true)}>
            <FiPlus className="w-4 h-4" />
            Add Department
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBox
          onSearch={handleSearch}
          placeholder="Search by name or code..."
          className="w-full sm:w-72"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <Table
        columns={columns}
        data={departments}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No departments found"
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Department">
        <DepartmentForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>

      <Modal open={showEdit} onClose={closeEdit} title="Edit Department">
        <DepartmentForm
          onSubmit={handleUpdate}
          onCancel={closeEdit}
          defaultValues={selected}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${selected?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={saving}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Departments;
