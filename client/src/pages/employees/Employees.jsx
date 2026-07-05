import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { getEmployees, deleteEmployee } from '../../services/employee.service';
import { getDepartments } from '../../services/department.service';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/common/Table';
import SearchBox from '../../components/common/SearchBox';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import usePagination from '../../hooks/usePagination';
import { formatDate } from '../../utils/formatters';

const Employees = () => {
  const { isAdmin } = useAuth();
  const { toasts, toast, removeToast } = useToast();
  const { page, setPage, reset: resetPage } = usePagination();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [departments, setDepartments] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getDepartments({ limit: 100, status: 'active' })
      .then((r) => setDepartments(r.data.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({
        page,
        search,
        department: deptFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortOrder('asc'); }
    resetPage();
  };

  const handleSearch = (val) => { setSearch(val); resetPage(); };
  const handleDeptFilter = (e) => { setDeptFilter(e.target.value); resetPage(); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); resetPage(); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEmployee(deleteId);
      toast.success('Employee deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'employeeId', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (v) => v?.name || '—' },
    { key: 'designation', label: 'Designation' },
    { key: 'joiningDate', label: 'Joined', sortable: true, render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge value={v} /> },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link to={`/employees/${row._id}`}>
            <button
              className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              title="View"
            >
              <FiEye className="w-4 h-4" />
            </button>
          </Link>
          {isAdmin && (
            <Link to={`/employees/${row._id}/edit`}>
              <button
                className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={() => setDeleteId(row._id)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your workforce</p>
        </div>
        {isAdmin && (
          <Link to="/employees/add">
            <Button>
              <FiPlus className="w-4 h-4" />
              Add Employee
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBox
          onSearch={handleSearch}
          placeholder="Search by name, ID, email..."
          className="w-full sm:w-72"
        />
        <select
          value={deptFilter}
          onChange={handleDeptFilter}
          className="input-field w-full sm:w-48"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
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
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No employees found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This cannot be undone."
        danger
        confirmLabel="Delete"
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Employees;
