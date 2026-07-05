import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { FiRefreshCw, FiFileText, FiGrid, FiFile } from 'react-icons/fi';
import { getReportAnalytics, generateCustom, downloadReport } from '../../services/report.service';
import { getDepartments } from '../../services/department.service';
import { getEmployees } from '../../services/employee.service';
import { getProjects } from '../../services/project.service';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { toISODate } from '../../utils/dateUtils';
import { ReportsTabs } from './Reports';
import { getProductivityLevel } from '../../utils/constants';

const SUBTYPE_OPTIONS = [
  { value: 'employee-summary', label: 'Employee Summary' },
  { value: 'department-summary', label: 'Department Summary' },
  { value: 'project-summary', label: 'Project Summary' },
  { value: 'top-performers', label: 'Top Performers' },
  { value: 'low-productivity', label: 'Low Productivity' },
  { value: 'missing-entries', label: 'Missing Entries' },
  { value: 'holiday-working-days', label: 'Holiday Calendar' },
];

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#0284c7', '#ec4899'];

const PERF_LEVEL_COLORS = {
  'Excellent': '#22c55e',
  'Very Good': '#84cc16',
  'Good': '#eab308',
  'Average': '#f97316',
  'Needs Improvement': '#ef4444',
};

const fmtCell = (key, val) => {
  if (val === null || val === undefined) return '—';
  if (['avgProductivityScore', 'complianceRate'].includes(key)) return `${Number(val).toFixed(1)}%`;
  if (key === 'totalHours') return `${Number(val).toFixed(1)}h`;
  if (key === 'avgItemsPerHour') return Number(val).toFixed(2);
  return String(val);
};

const TABLE_CONFIGS = {
  'employee-summary': {
    cols: [
      { key: 'employeeId', label: 'Emp ID' },
      { key: 'employeeName', label: 'Name' },
      { key: 'departmentName', label: 'Department' },
      { key: 'totalItems', label: 'Items' },
      { key: 'totalHours', label: 'Hours' },
      { key: 'entryCount', label: 'Days' },
      { key: 'avgItemsPerHour', label: 'Items/Hr' },
      { key: 'avgProductivityScore', label: 'Score' },
    ],
    chartKey: 'employeeName',
    chartValueKey: 'totalItems',
    chartLabel: 'Total Items by Employee',
  },
  'department-summary': {
    cols: [
      { key: 'departmentName', label: 'Department' },
      { key: 'employeeCount', label: 'Employees' },
      { key: 'totalItems', label: 'Items' },
      { key: 'totalHours', label: 'Hours' },
      { key: 'entryCount', label: 'Days' },
      { key: 'avgItemsPerHour', label: 'Items/Hr' },
      { key: 'avgProductivityScore', label: 'Score' },
    ],
    chartKey: 'departmentName',
    chartValueKey: 'totalItems',
    chartLabel: 'Total Items by Department',
  },
  'project-summary': {
    cols: [
      { key: 'projectCode', label: 'Code' },
      { key: 'projectName', label: 'Project' },
      { key: 'employeeCount', label: 'Employees' },
      { key: 'totalItems', label: 'Items' },
      { key: 'totalHours', label: 'Hours' },
      { key: 'entryCount', label: 'Days' },
      { key: 'avgItemsPerHour', label: 'Items/Hr' },
    ],
    chartKey: 'projectName',
    chartValueKey: 'totalItems',
    chartLabel: 'Total Items by Project',
  },
  'top-performers': {
    cols: [
      { key: 'rank', label: '#' },
      { key: 'employeeId', label: 'Emp ID' },
      { key: 'employeeName', label: 'Name' },
      { key: 'departmentName', label: 'Department' },
      { key: 'totalItems', label: 'Items' },
      { key: 'totalHours', label: 'Hours' },
      { key: 'avgProductivityScore', label: 'Score' },
      { key: 'performanceLevel', label: 'Level' },
    ],
    chartKey: 'employeeName',
    chartValueKey: 'avgProductivityScore',
    chartLabel: 'Top Performers – Productivity Score',
  },
  'low-productivity': {
    cols: [
      { key: 'employeeId', label: 'Emp ID' },
      { key: 'employeeName', label: 'Name' },
      { key: 'departmentName', label: 'Department' },
      { key: 'totalItems', label: 'Items' },
      { key: 'entryCount', label: 'Days' },
      { key: 'avgProductivityScore', label: 'Score' },
      { key: 'performanceLevel', label: 'Level' },
      { key: 'dailyTargetSnapshot', label: 'Target' },
    ],
    chartKey: 'employeeName',
    chartValueKey: 'avgProductivityScore',
    chartLabel: 'Low Productivity – Score',
  },
  'missing-entries': {
    cols: [
      { key: 'employeeId', label: 'Emp ID' },
      { key: 'employeeName', label: 'Name' },
      { key: 'departmentName', label: 'Department' },
      { key: 'expectedDays', label: 'Expected' },
      { key: 'submittedDays', label: 'Submitted' },
      { key: 'missingDays', label: 'Missing' },
      { key: 'complianceRate', label: 'Compliance' },
    ],
    chartKey: 'employeeName',
    chartValueKey: 'missingDays',
    chartLabel: 'Missing Entry Days',
  },
  'holiday-working-days': {
    cols: [
      { key: 'date', label: 'Date' },
      { key: 'dayName', label: 'Day' },
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Name / Reason' },
    ],
    chartKey: null,
    chartValueKey: null,
    chartLabel: null,
  },
};

const AnalyticsReports = () => {
  const now = new Date();
  const [subType, setSubType] = useState('employee-summary');
  const [startDate, setStartDate] = useState(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toISODate(now));
  const [deptId, setDeptId] = useState('');
  const [empId, setEmpId] = useState('');
  const [projId, setProjId] = useState('');
  const [limitVal, setLimitVal] = useState('10');
  const [thresholdVal, setThresholdVal] = useState('75');

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [exporting, setExporting] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    Promise.all([
      getDepartments({ limit: 200, status: 'active' }),
      getEmployees({ limit: 200, status: 'active' }),
      getProjects({ limit: 200, status: 'active' }),
    ]).then(([d, e, p]) => {
      setDepartments([{ value: '', label: 'All departments' }, ...d.data.data.map((x) => ({ value: x._id, label: x.name }))]);
      setEmployees([{ value: '', label: 'All employees' }, ...e.data.data.map((x) => ({ value: x._id, label: `${x.name} (${x.employeeId})` }))]);
      setProjects([{ value: '', label: 'All projects' }, ...p.data.data.map((x) => ({ value: x._id, label: x.name }))]);
    });
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const params = {
        subType,
        startDate,
        endDate,
        departmentId: deptId || undefined,
        employeeId: empId || undefined,
        projectId: projId || undefined,
      };
      if (subType === 'top-performers' && limitVal) params.limit = limitVal;
      if (subType === 'low-productivity' && thresholdVal) params.threshold = thresholdVal;

      const res = await getReportAnalytics(params);
      setRows(res.data.data.rows || []);
      setSummary(res.data.data.summary || null);
      setHasLoaded(true);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [subType, startDate, endDate, deptId, empId, projId, limitVal, thresholdVal]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const filters = {
        departmentId: deptId || undefined,
        employeeId: empId || undefined,
        projectId: projId || undefined,
      };
      if (subType === 'top-performers' && limitVal) filters.limit = parseInt(limitVal);
      if (subType === 'low-productivity' && thresholdVal) filters.threshold = parseFloat(thresholdVal);

      const res = await generateCustom({ startDate, endDate, subType, format, filters });
      const reportId = res.data.data._id;
      const reportName = res.data.data.reportName;
      const dlRes = await downloadReport(reportId);
      const url = URL.createObjectURL(dlRes.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${reportName}.${format === 'excel' ? 'xlsx' : format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  const config = TABLE_CONFIGS[subType] || TABLE_CONFIGS['employee-summary'];
  const chartData = config.chartKey
    ? rows.slice(0, 20).map((r) => ({
        name: String(r[config.chartKey] || '').slice(0, 15),
        [config.chartValueKey]: Number(r[config.chartValueKey] || 0),
        _level: r.performanceLevel || '',
      }))
    : [];

  const needsDept = !['holiday-working-days'].includes(subType);
  const needsEmp = ['employee-summary', 'top-performers', 'low-productivity'].includes(subType);
  const needsProj = !['holiday-working-days', 'missing-entries'].includes(subType);

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ReportsTabs active="analytics" />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Analytics</h1>
        {hasLoaded && rows.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={exporting === 'pdf'} onClick={() => handleExport('pdf')}>
              <FiFileText className="mr-1 text-red-500" />PDF
            </Button>
            <Button variant="secondary" size="sm" loading={exporting === 'excel'} onClick={() => handleExport('excel')}>
              <FiGrid className="mr-1 text-green-600" />Excel
            </Button>
            <Button variant="secondary" size="sm" loading={exporting === 'csv'} onClick={() => handleExport('csv')}>
              <FiFile className="mr-1 text-blue-500" />CSV
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Report Type</label>
            <select
              className="input-field text-sm"
              value={subType}
              onChange={(e) => { setSubType(e.target.value); setHasLoaded(false); }}
            >
              {SUBTYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Start Date</label>
            <input type="date" className="input-field text-sm" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">End Date</label>
            <input type="date" className="input-field text-sm" value={endDate} min={startDate} max={toISODate(now)} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={loadAnalytics} loading={loading}>
              <FiRefreshCw className="mr-1" />Load
            </Button>
          </div>
        </div>

        {/* Optional filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {needsDept && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Department</label>
              <select className="input-field text-sm" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          )}
          {needsEmp && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Employee</label>
              <select className="input-field text-sm" value={empId} onChange={(e) => setEmpId(e.target.value)}>
                {employees.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          )}
          {needsProj && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Project</label>
              <select className="input-field text-sm" value={projId} onChange={(e) => setProjId(e.target.value)}>
                {projects.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}
          {subType === 'top-performers' && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Top N</label>
              <input type="number" className="input-field text-sm" min="1" max="100" value={limitVal} onChange={(e) => setLimitVal(e.target.value)} />
            </div>
          )}
          {subType === 'low-productivity' && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Threshold %</label>
              <input type="number" className="input-field text-sm" min="0" max="100" value={thresholdVal} onChange={(e) => setThresholdVal(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading && <Loader />}

      {!loading && hasLoaded && (
        <>
          {/* Summary */}
          {summary && (
            <div className="card p-4 flex flex-wrap gap-6">
              {Object.entries(summary).map(([k, v]) => (
                <div key={k} className="text-center">
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{v}</p>
                  <p className="text-xs text-gray-400 capitalize">{k}</p>
                </div>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">
              No data found for the selected filters and period.
            </div>
          ) : (
            <>
              {/* Chart */}
              {config.chartKey && chartData.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-4">{config.chartLabel}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          name.includes('Score') || name.includes('compliance') ? `${value}%` : value,
                          name,
                        ]}
                      />
                      <Bar dataKey={config.chartValueKey} radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => {
                          const color = entry._level
                            ? PERF_LEVEL_COLORS[entry._level] || CHART_COLORS[i % CHART_COLORS.length]
                            : CHART_COLORS[i % CHART_COLORS.length];
                          return <Cell key={i} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {SUBTYPE_OPTIONS.find((s) => s.value === subType)?.label}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {rows.length} record{rows.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                        {config.cols.map((c) => (
                          <th key={c.key} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs uppercase tracking-wide">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                          {config.cols.map((c) => (
                            <td key={c.key} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {c.key === 'performanceLevel' ? (
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${PERF_LEVEL_COLORS[row[c.key]] || '#94a3b8'}20`,
                                    color: PERF_LEVEL_COLORS[row[c.key]] || '#94a3b8',
                                  }}
                                >
                                  {row[c.key] || '—'}
                                </span>
                              ) : (
                                fmtCell(c.key, row[c.key])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!loading && !hasLoaded && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm">Select filters and click <strong>Load</strong> to view analytics.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
