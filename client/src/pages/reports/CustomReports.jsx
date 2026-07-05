import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { FiBarChart2, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import {
  getReports, generateCustom, getReportAnalytics, downloadReport, deleteReport,
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
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import { toISODate } from '../../utils/dateUtils';
import { ReportsTabs } from './Reports';
import PreviewModal from './PreviewModal';

const SUBTYPE_OPTIONS = [
  { value: 'employee-summary', label: 'Employee Summary' },
  { value: 'department-summary', label: 'Department Summary' },
  { value: 'project-summary', label: 'Project Summary' },
  { value: 'top-performers', label: 'Top Performers' },
  { value: 'low-productivity', label: 'Low Productivity' },
  { value: 'missing-entries', label: 'Missing Entries' },
  { value: 'holiday-working-days', label: 'Holiday Calendar' },
];

const CustomReports = () => {
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      startDate: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toISODate(now),
      subType: 'employee-summary',
    },
  });

  const watchSubType = watch('subType');

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
      const res = await getReports({ page, limit, reportType: 'custom', sort: '-generatedAt' });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  const buildFilters = (formData) => {
    const f = {
      departmentId: formData.departmentId || undefined,
      employeeId: formData.employeeId || undefined,
      projectId: formData.projectId || undefined,
    };
    if (formData.subType === 'top-performers' && formData.limit) f.limit = parseInt(formData.limit);
    if (formData.subType === 'low-productivity' && formData.threshold) f.threshold = parseFloat(formData.threshold);
    return f;
  };

  const handlePreview = async (formData) => {
    setPreviewLoading(true);
    try {
      const res = await getReportAnalytics({
        subType: formData.subType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        ...buildFilters(formData),
      });
      const subtypeLabel = SUBTYPE_OPTIONS.find((s) => s.value === formData.subType)?.label || formData.subType;
      const period = `${subtypeLabel}: ${formData.startDate} to ${formData.endDate}`;
      setPreview({
        rows: res.data.data.rows,
        summary: res.data.data.summary,
        period,
        formData,
      });
      setPreviewOpen(true);
    } catch { toast.error('Failed to load preview'); }
    finally { setPreviewLoading(false); }
  };

  const handleExportFromPreview = async (format) => {
    const { formData } = preview;
    try {
      const res = await generateCustom({
        startDate: formData.startDate,
        endDate: formData.endDate,
        subType: formData.subType,
        format,
        filters: buildFilters(formData),
      });
      const reportId = res.data.data._id;
      const reportName = res.data.data.reportName;
      const dlRes = await downloadReport(reportId);
      const url = URL.createObjectURL(dlRes.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${reportName}.${format === 'excel' ? 'xlsx' : format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
      setPreviewOpen(false);
      setGenerateOpen(false);
      load();
    } catch { toast.error('Export failed'); }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await downloadReport(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
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
    { key: 'startDate', label: 'From', render: (v) => formatDate(v) },
    { key: 'endDate', label: 'To', render: (v) => formatDate(v) },
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

  const needsDeptFilter = !['holiday-working-days'].includes(watchSubType);
  const needsEmpFilter = ['employee-summary', 'top-performers', 'low-productivity'].includes(watchSubType);
  const needsProjectFilter = !['holiday-working-days', 'missing-entries'].includes(watchSubType);
  const needsLimit = watchSubType === 'top-performers';
  const needsThreshold = watchSubType === 'low-productivity';

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ReportsTabs active="custom" />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Custom Reports</h1>
        <Button onClick={() => setGenerateOpen(true)}>
          <FiBarChart2 className="mr-1" />Generate Custom Report
        </Button>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No custom reports generated yet"
      />

      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Custom Report" size="md">
        <form onSubmit={handleSubmit(handlePreview)} className="space-y-4">
          <Dropdown
            label="Report Type *"
            options={SUBTYPE_OPTIONS}
            error={errors.subType?.message}
            {...register('subType', { required: true })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              max={toISODate(now)}
              error={errors.startDate?.message}
              {...register('startDate', { required: 'Start date required' })}
            />
            <Input
              label="End Date *"
              type="date"
              max={toISODate(now)}
              error={errors.endDate?.message}
              {...register('endDate', { required: 'End date required' })}
            />
          </div>

          {/* Subtype-specific options */}
          {needsLimit && (
            <Input label="Top N (max 100)" type="number" min="1" max="100" placeholder="10" {...register('limit')} />
          )}
          {needsThreshold && (
            <Input label="Threshold % (below = low)" type="number" min="0" max="100" placeholder="75" {...register('threshold')} />
          )}

          {/* Filters */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Filters (optional)</p>
            <div className="grid grid-cols-1 gap-3">
              {needsDeptFilter && (
                <Dropdown label="Department" options={departments} placeholder="All departments" {...register('departmentId')} />
              )}
              {needsEmpFilter && (
                <Dropdown label="Employee" options={employees} placeholder="All employees" {...register('employeeId')} />
              )}
              {needsProjectFilter && (
                <Dropdown label="Project" options={projects} placeholder="All projects" {...register('projectId')} />
              )}
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

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        preview={preview}
        subType={preview?.formData?.subType || 'employee-summary'}
        onExport={handleExportFromPreview}
        title="Custom Report Preview"
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

export default CustomReports;
