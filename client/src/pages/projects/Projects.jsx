import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { getProjects, deleteProject } from '../../services/project.service';
import Table from '../../components/common/Table';
import SearchBox from '../../components/common/SearchBox';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown from '../../components/common/Dropdown';
import ToastContainer from '../../components/common/Toast';
import usePagination from '../../hooks/usePagination';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { PROJECT_STATUS, PRIORITY } from '../../utils/constants';

const Projects = () => {
  const { isAdmin } = useAuth();
  const { page, limit, setPage, reset: resetPage } = usePagination();
  const { toasts, toast, removeToast } = useToast();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects({ page, limit, search, status: statusFilter, priority: priorityFilter, sortBy, sortOrder });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    resetPage();
  };

  const handleSearch = (val) => { setSearch(val); resetPage(); };
  const handleStatus = (e) => { setStatusFilter(e.target.value); resetPage(); };
  const handlePriority = (e) => { setPriorityFilter(e.target.value); resetPage(); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(deleteId);
      setDeleteId(null);
      toast.success('Project deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    ...PROJECT_STATUS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ') })),
  ];

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    ...Object.values(PRIORITY).map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
  ];

  const columns = [
    { key: 'projectCode', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', render: (v) => v?.name || '—' },
    { key: 'status', label: 'Status', render: (v) => <Badge value={v} /> },
    { key: 'priority', label: 'Priority', render: (v) => <Badge value={v} /> },
    { key: 'assignedEmployees', label: 'Team', render: (v) => v?.length ?? 0 },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link to={`/projects/${row._id}`}>
            <Button variant="ghost" size="sm"><FiEye /></Button>
          </Link>
          {isAdmin && (
            <Link to={`/projects/${row._id}/edit`}>
              <Button variant="ghost" size="sm"><FiEdit2 /></Button>
            </Link>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(row._id)} className="text-red-500 hover:text-red-600">
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
        <h1 className="page-title">Projects</h1>
        {isAdmin && (
          <Link to="/projects/add">
            <Button><FiPlus className="mr-1" />Add Project</Button>
          </Link>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchBox onSearch={handleSearch} placeholder="Search by name or code..." className="flex-1 min-w-48" />
        <Dropdown
          options={statusOptions}
          value={statusFilter}
          onChange={handleStatus}
          placeholder={null}
          className="w-40"
        />
        <Dropdown
          options={priorityOptions}
          value={priorityFilter}
          onChange={handlePriority}
          placeholder={null}
          className="w-40"
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
        emptyTitle="No projects found"
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        message="Delete this project? Existing entries linked to it will not be deleted."
        danger
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Projects;
