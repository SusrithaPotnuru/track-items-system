import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiBarChart2, FiDownload, FiTrash2, FiEye, FiFileText,
  FiFile, FiGrid,
} from 'react-icons/fi';
import {
  getReports, generateWeekly, getReportAnalytics, downloadReport, deleteReport,
} from '../../services/report.service';
import { getDepartments } from '../../services/department.service';
import { getEmployees } from '../../services/employee.service';
import { getProjects } from '../../services/project.service';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import usePagination from '../../hooks/usePagination';
import { formatDateTime, formatFileSize } from '../../utils/formatters';
import { EXPORT_FORMATS } from '../../utils/constants';
import { getWeekNumber, toISODate } from '../../utils/dateUtils';
import { ReportsTabs } from './Reports';
import PreviewModal from './PreviewModal';

const WeeklyReports = () => {
  const now = new Date();
  const { page, limit, setPage } = usePagination();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const { toasts, toast, removeToast } = useToast();

  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { year: now.getFullYear(), week: getWeekNumber(now), format: 'pdf' },
  });

  const watchYear = watch('year');
  const watchWeek = watch('week');

  useEffect(() => {
    Promise.all([
      getDepartments({ limit: 200, status: 'active' }),
      getEmployees({ limit: 200, status: 'active' }),
      getProjects({ limit: 200, status: 'active' }),
    ]).then(([d, e, p]) => {
      setDepartments(d.data.data.map((x) => ({ value: x._id, label: x.name })));
      setEmployees(e.data.data.map((x) => ({ value: x._id, label: `${x.name} (${x.employeeId})` })));
      setProjects(p.data.data.map((x) => ({ value: x._id, label: x.name })));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports({ page, limit, reportType: 'weekly', sort: '-generatedAt' });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  const getWeekStartDate = (year, week) => {
    const jan4 = new Date(year, 0, 4);
    const dow = jan4.getDay() || 7;
    const week1Mon = new Date(jan4);
    week1Mon.setDate(jan4.getDate() - dow + 1);
    const start = new Date(week1Mon);
    start.setDate(week1Mon.getDate() + (week - 1) * 7);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { start: toISODate(start), end: toISODate(end) };
  };

  const buildFilters = (formData) => ({
    departmentId: formData.departmentId || undefined,
    employeeId: formData.employeeId || undefined,
    projectId: formData.projectId || undefined,
  });

  const handlePreview = async (formData) => {
    const { start, end } = getWeekStartDate(Number(formData.year), Number(formData.week));
    setPreviewLoading(true);
    try {
      const res = await getReportAnalytics({
        subType: 'employee-summary',
        startDate: start,
        endDate: end,
        ...buildFilters(formData),
      });
      const period = `W${formData.week} ${formData.year} (${start} to ${end})`;
      setPreview({ rows: res.data.data.rows, summary: res.data.data.summary, period, formData });
      setPreviewOpen(true);
    } catch { toast.error('Failed to load preview'); }
    finally { setPreviewLoading(false); }
  };

  const handleExportFromPreview = async (format) => {
    const { formData } = preview;
    try {
      const res = await generateWeekly({
        year: Number(formData.year),
        week: Number(formData.week),
        format,
        filters: buildFilters(formData),
      });
      const reportId = res.data.data._id;
      const reportName = res.data.data.reportName;
      const dlRes = await downloadReport(reportId);
      triggerDownload(dlRes.data, `${reportName}.${format === 'excel' ? 'xlsx' : format}`);
      toast.success(`${format.toUpperCase()} exported`);
      setPreviewOpen(false);
      setGenerateOpen(false);
      load();
    } catch { toast.error('Export failed'); }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await downloadReport(id);
      triggerDownload(res.data, name);
    } catch { toast.error('Download failed'); }
  };

  const triggerDownload = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReport(deleteId);
      setDeleteId(null);
      toast.success('Report deleted');
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'reportName', label: 'Report Name', sortable: true },
    { key: 'generatedAt', label: 'Generated', render: (v) => formatDateTime(v), sortable: true },
    { key: 'generatedBy', label: 'By', render: (v) => v?.fullName || '—' },
    { key: 'format', label: 'Format', render: (v) => v?.toUpperCase() },
    { key: 'fileSize', label: 'Size', render: (v) => formatFileSize(v) },
    { key: 'downloadCount', label: 'Downloads' },
    {
      key: '_id', label: 'Actions', render: (_, row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleDownload(row._id, row.reportName)}>
            <FiDownload className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => setDeleteId(row._id)}>
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ReportsTabs active="weekly" />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Weekly Reports</h1>
        <Button onClick={() => setGenerateOpen(true)}>
          <FiBarChart2 className="mr-1" />Generate Weekly Report
        </Button>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No weekly reports generated yet"
      />

      {/* Generate Modal */}
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Weekly Report" size="md">
        <form onSubmit={handleSubmit(handlePreview)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Year *"
              type="number"
              error={errors.year?.message}
              {...register('year', { required: true, min: { value: 2020, message: 'Min 2020' } })}
            />
            <Input
              label="Week Number *"
              type="number"
              min="1"
              max="53"
              error={errors.week?.message}
              {...register('week', { required: true, min: 1, max: 53 })}
            />
          </div>
          {watchYear && watchWeek && (() => {
            try {
              const { start, end } = getWeekStartDate(Number(watchYear), Number(watchWeek));
              return <p className="text-xs text-gray-400">Period: {start} to {end}</p>;
            } catch { return null; }
          })()}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Filters (optional)</p>
            <div className="grid grid-cols-1 gap-3">
              <Dropdown label="Department" options={departments} placeholder="All departments" {...register('departmentId')} />
              <Dropdown label="Employee" options={employees} placeholder="All employees" {...register('employeeId')} />
              <Dropdown label="Project" options={projects} placeholder="All projects" {...register('projectId')} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={previewLoading}>
              <FiEye className="mr-1" />Preview
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        preview={preview}
        subType="employee-summary"
        onExport={handleExportFromPreview}
        title="Weekly Report Preview"
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Report"
        message="Delete this report and its file? This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
};

export default WeeklyReports;
