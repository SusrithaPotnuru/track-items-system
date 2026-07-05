import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FiRefreshCw, FiFileText, FiGrid, FiFile, FiTrendingUp, FiTrendingDown,
  FiUsers, FiClock, FiBarChart2, FiAlertCircle, FiChevronDown, FiX,
} from 'react-icons/fi';
import {
  getAnalyticsKpi, getMonthlyTrend, getWeeklyTrend, getYearlyTrend,
  getDepartmentAnalytics, getProjectAnalytics,
  getTopEmployees, getLowPerformers,
  getApprovalTime, getRejectionAnalytics,
  exportAnalytics, clearAnalyticsCache,
} from '../../services/analytics.service';
import { getDepartments } from '../../services/department.service';
import { getEmployees } from '../../services/employee.service';
import { getProjects } from '../../services/project.service';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { toISODate } from '../../utils/dateUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#0284c7', '#ec4899', '#6366f1', '#14b8a6'];

const PERF_COLORS = {
  Excellent: '#22c55e', 'Very Good': '#84cc16', Good: '#eab308',
  Average: '#f97316', 'Needs Improvement': '#ef4444',
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'monthly', label: 'Monthly Trend' },
  { id: 'weekly', label: 'Weekly Trend' },
  { id: 'yearly', label: 'Yearly Trend' },
  { id: 'departments', label: 'Departments' },
  { id: 'projects', label: 'Projects' },
  { id: 'performers', label: 'Performers' },
  { id: 'workflow', label: 'Workflow' },
];

const now = new Date();
const thisYearStart = toISODate(new Date(now.getFullYear(), 0, 1));

// ─── Small components ─────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon: Icon, color, sub, growth }) => (
  <div className="card p-4 flex items-start gap-3">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {growth !== undefined && growth !== null && (
        <p className={`text-xs mt-0.5 flex items-center gap-0.5 font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {growth >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
          {Math.abs(growth)}% vs last month
        </p>
      )}
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{children}</h3>
);

const ChartCard = ({ title, children, action }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <SectionTitle>{title}</SectionTitle>
      {action}
    </div>
    {children}
  </div>
);

const EmptyChart = ({ message = 'No data for this period' }) => (
  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{message}</div>
);

const LevelBadge = ({ level }) => (
  <span
    className="px-2 py-0.5 rounded-full text-xs font-medium"
    style={{ backgroundColor: `${PERF_COLORS[level] || '#94a3b8'}20`, color: PERF_COLORS[level] || '#94a3b8' }}
  >
    {level || '—'}
  </span>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FilterBar = ({ filters, setFilters, departments, employees, projects, onRefresh, loading, activeTab }) => {
  const showDeptFilter = !['yearly', 'workflow'].includes(activeTab);
  const showEmpFilter = ['performers', 'overview'].includes(activeTab);
  const showProjFilter = ['projects', 'overview'].includes(activeTab);
  const showWeeks = activeTab === 'weekly';
  const showYear = activeTab === 'monthly';
  const showThreshold = activeTab === 'performers';

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {showYear ? (
          <div>
            <label className="label-sm">Year</label>
            <select className="input-field text-sm" value={filters.year || now.getFullYear()}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
              {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="label-sm">Start Date</label>
              <input type="date" className="input-field text-sm" value={filters.startDate}
                max={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label-sm">End Date</label>
              <input type="date" className="input-field text-sm" value={filters.endDate}
                min={filters.startDate} max={toISODate(now)}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </>
        )}
        {showDeptFilter && (
          <div>
            <label className="label-sm">Department</label>
            <select className="input-field text-sm" value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
              {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        )}
        {showEmpFilter && (
          <div>
            <label className="label-sm">Employee</label>
            <select className="input-field text-sm" value={filters.employee}
              onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}>
              {employees.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
        )}
        {showProjFilter && (
          <div>
            <label className="label-sm">Project</label>
            <select className="input-field text-sm" value={filters.project}
              onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))}>
              {projects.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        )}
        {showWeeks && (
          <div>
            <label className="label-sm">Weeks Back</label>
            <input type="number" className="input-field text-sm" min="1" max="52"
              value={filters.weeks || 12}
              onChange={(e) => setFilters((f) => ({ ...f, weeks: e.target.value }))} />
          </div>
        )}
        {showThreshold && (
          <div>
            <label className="label-sm">Low Threshold %</label>
            <input type="number" className="input-field text-sm" min="0" max="100"
              value={filters.threshold || 75}
              onChange={(e) => setFilters((f) => ({ ...f, threshold: e.target.value }))} />
          </div>
        )}
        <div className="flex items-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-1.5 text-sm"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Export Controls ──────────────────────────────────────────────────────────

const EXPORT_SUBTYPES = {
  overview: 'productivity',
  monthly: 'monthly-trend',
  weekly: 'weekly-trend',
  yearly: 'yearly-trend',
  departments: 'department',
  projects: 'project',
  performers: 'top-performers',
  workflow: 'approval-time',
};

const ExportBar = ({ activeTab, filters, toast }) => {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    try {
      setExporting(format);
      const subType = EXPORT_SUBTYPES[activeTab] || 'productivity';
      const params = { subType, format, ...filters };
      const res = await exportAnalytics(params);
      const ext = format === 'excel' ? 'xlsx' : format;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${subType}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('pdf')}
        disabled={!!exporting}
        className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
      >
        <FiFileText className="w-3 h-3 text-red-500" />{exporting === 'pdf' ? '…' : 'PDF'}
      </button>
      <button
        onClick={() => handleExport('excel')}
        disabled={!!exporting}
        className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
      >
        <FiGrid className="w-3 h-3 text-green-600" />{exporting === 'excel' ? '…' : 'Excel'}
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={!!exporting}
        className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
      >
        <FiFile className="w-3 h-3 text-blue-500" />{exporting === 'csv' ? '…' : 'CSV'}
      </button>
    </div>
  );
};

// ─── Drill-Down Panel ─────────────────────────────────────────────────────────

const DrillDownPanel = ({ type, value, filters, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!value) return;
    setLoading(true);
    const params = { ...filters };
    if (type === 'department') params.department = value.id;
    getTopEmployees({ ...params, limit: 20 })
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, value, filters]);

  if (!value) return null;

  return (
    <div className="card border-2 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
          Drill-Down: <span className="text-blue-600 dark:text-blue-400">{value.name}</span> — Top Employees
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <FiX className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      {loading ? (
        <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-sm">No employee data for this department in the selected period.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['#', 'ID', 'Name', 'Items', 'Hours', 'Score', 'Level'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 text-gray-500">{r.rank}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{r.employeeId}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{r.employeeName}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.totalItems}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{r.totalHours?.toFixed(1)}h</td>
                  <td className="px-3 py-2 font-medium">{r.avgProductivityScore}%</td>
                  <td className="px-3 py-2"><LevelBadge level={r.performanceLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab Views ────────────────────────────────────────────────────────────────

const OverviewTab = ({ kpi, productivity, deptData, topPerformers }) => {
  const fmt = (n) => n?.toLocaleString() ?? '—';

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Items" value={fmt(kpi?.totalItems)} icon={FiBarChart2} color="bg-blue-600" sub={`This month: ${fmt(kpi?.monthlyItems)}`} growth={kpi?.itemsGrowth} />
        <KpiCard label="Total Hours" value={kpi?.totalHours?.toLocaleString()} icon={FiClock} color="bg-purple-600" sub={`This month: ${kpi?.monthlyHours}h`} growth={kpi?.hoursGrowth} />
        <KpiCard label="Active Employees" value={kpi?.activeEmployees} icon={FiUsers} color="bg-teal-600" />
        <KpiCard label="Pending Approvals" value={kpi?.pendingApprovals} icon={FiAlertCircle} color="bg-amber-500" />
        <KpiCard label="Avg Score" value={kpi?.avgProductivityScore != null ? `${kpi.avgProductivityScore}%` : '—'} icon={FiTrendingUp} color="bg-green-600" />
        <KpiCard label="Rejected" value={kpi?.rejectedCount} icon={FiX} color="bg-red-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Daily Productivity — Items (Last 30 Days)">
          {productivity?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={productivity}>
                <defs>
                  <linearGradient id="gradItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalItems" name="Items" stroke="#2563eb" fill="url(#gradItems)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Department Distribution — Items (YTD)">
          {deptData?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptData} dataKey="totalItems" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v.toLocaleString(), 'Items']} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Top performers mini */}
      {topPerformers?.length > 0 && (
        <ChartCard title={`Top ${topPerformers.length} Performers — Productivity Score`}>
          <ResponsiveContainer width="100%" height={Math.max(160, topPerformers.length * 32)}>
            <BarChart data={topPerformers} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="employeeName" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Bar dataKey="avgProductivityScore" name="Score" radius={[0, 4, 4, 0]}>
                {topPerformers.map((r, i) => <Cell key={i} fill={PERF_COLORS[r.performanceLevel] || CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

const MonthlyTab = ({ data, filters }) => (
  <div className="space-y-5">
    <ChartCard title={`Monthly Trend — ${filters.year || now.getFullYear()}`}>
      {data?.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="totalItems" name="Items" fill="#2563eb" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="right" dataKey="totalHours" name="Hours" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartCard>

    {data?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Monthly Data Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['Month', 'Total Items', 'Total Hours', 'Entries'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.monthName}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalItems.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours}h</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.entryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const WeeklyTab = ({ data }) => (
  <div className="space-y-5">
    <ChartCard title="Weekly Productivity Trend">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="totalItems" name="Items" fill="#0891b2" radius={[3, 3, 0, 0]} />
            <Bar dataKey="totalHours" name="Hours" fill="#059669" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartCard>

    {data?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Weekly Data Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['Week', 'Total Items', 'Total Hours', 'Entries'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.label}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalItems.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours}h</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.entryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const YearlyTab = ({ data }) => (
  <div className="space-y-5">
    <ChartCard title="Year-over-Year Comparison">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="totalItems" name="Items" fill="#2563eb" radius={[3, 3, 0, 0]} />
            <Bar dataKey="entryCount" name="Entries" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            <Bar dataKey="employeeCount" name="Employees" fill="#059669" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartCard>

    {data?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['Year', 'Total Items', 'Total Hours', 'Entries', 'Employees'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 font-bold text-gray-800 dark:text-gray-200">{r.year}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalItems?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours?.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.entryCount}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.employeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const DepartmentsTab = ({ data, filters, onDrillDown }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title="Items by Department">
        {data?.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
            <BarChart data={data.map((d) => ({ ...d, name: d.name }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalItems" name="Items" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>

      <ChartCard title="Department Share (Pie)">
        {data?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="totalItems" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''}
                onClick={(_, i) => onDrillDown({ id: data[i]?._id, name: data[i]?.name })}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} cursor="pointer" />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
        <p className="text-xs text-gray-400 text-center mt-1">Click a slice to drill into department employees</p>
      </ChartCard>
    </div>

    {data?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Department Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['Department', 'Employees', 'Items', 'Hours', 'Entries', 'Items/Hr', 'Drill'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.employeeCount}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalItems?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours?.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.entryCount}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.avgItemsPerHour?.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onDrillDown({ id: r._id, name: r.name })}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Employees
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const ProjectsTab = ({ data }) => (
  <div className="space-y-5">
    <ChartCard title="Items by Project">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalItems" name="Items" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartCard>

    {data?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['Project', 'Code', 'Employees', 'Items', 'Hours', 'Items/Hr'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{r.code}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.employeeCount}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalItems?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours?.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.avgItemsPerHour?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const PerformersTab = ({ topData, lowData, lowSummary }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title={`Top ${topData?.length || 0} Performers — Score`}>
        {topData?.length ? (
          <ResponsiveContainer width="100%" height={Math.max(160, topData.length * 32)}>
            <BarChart data={topData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="employeeName" width={110} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Bar dataKey="avgProductivityScore" name="Score" radius={[0, 4, 4, 0]}>
                {topData.map((r, i) => <Cell key={i} fill={PERF_COLORS[r.performanceLevel] || '#22c55e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </ChartCard>

      <ChartCard title={`Low Performers (< ${lowSummary?.threshold ?? 75}%) — Score`}
        action={lowSummary ? <span className="text-xs text-gray-400">{lowSummary.count} employees · Avg {lowSummary.avgScore}%</span> : null}>
        {lowData?.length ? (
          <ResponsiveContainer width="100%" height={Math.max(160, lowData.length * 32)}>
            <BarChart data={lowData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="employeeName" width={110} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Bar dataKey="avgProductivityScore" name="Score" radius={[0, 4, 4, 0]}>
                {lowData.map((r, i) => <Cell key={i} fill={PERF_COLORS[r.performanceLevel] || '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart message={`No employees below ${lowSummary?.threshold ?? 75}% threshold`} />}
      </ChartCard>
    </div>

    {topData?.length > 0 && (
      <div className="card overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Top Performers Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                {['#', 'ID', 'Name', 'Department', 'Items', 'Hours', 'Score', 'Level'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topData.map((r, i) => (
                <tr key={i} className={`border-t border-gray-50 dark:border-gray-700 ${i % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">{r.rank}</td>
                  <td className="px-4 py-2.5 text-gray-500">{r.employeeId}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{r.employeeName}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.departmentName}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-200">{r.totalItems}</td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{r.totalHours?.toFixed(1)}h</td>
                  <td className="px-4 py-2.5 font-semibold">{r.avgProductivityScore}%</td>
                  <td className="px-4 py-2.5"><LevelBadge level={r.performanceLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const WorkflowTab = ({ approvalData, rejectionData }) => {
  const fmt = (n) => n?.toLocaleString() ?? '—';
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(rejectionData?.totalSubmitted)}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Submitted</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{fmt(rejectionData?.totalRejected)}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Rejected</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{rejectionData?.rejectionRate ?? '—'}%</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Rejection Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Avg Approval Time by Department (hours)"
          action={approvalData?.overall ? <span className="text-xs text-gray-400">Overall avg: {approvalData.overall.avgHours}h</span> : null}>
          {approvalData?.byDepartment?.length ? (
            <ResponsiveContainer width="100%" height={Math.max(160, approvalData.byDepartment.length * 36)}>
              <BarChart data={approvalData.byDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
                <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}h`, 'Avg Time']} />
                <Bar dataKey="avgHours" name="Avg Hours" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No approval data — entries need both submittedAt and approvedAt dates" />}
        </ChartCard>

        <ChartCard title="Rejections by Department">
          {rejectionData?.byDepartment?.length ? (
            <ResponsiveContainer width="100%" height={Math.max(160, rejectionData.byDepartment.length * 36)}>
              <BarChart data={rejectionData.byDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Rejections" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No rejections in the selected period" />}
        </ChartCard>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Analytics = () => {
  const { toast, toasts, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [drillDown, setDrillDown] = useState(null);

  const [filters, setFilters] = useState({
    startDate: thisYearStart,
    endDate: toISODate(now),
    year: String(now.getFullYear()),
    department: '',
    employee: '',
    project: '',
    weeks: '12',
    threshold: '75',
    limit: '10',
  });

  const [departments, setDepartments] = useState([{ value: '', label: 'All Departments' }]);
  const [employees, setEmployees] = useState([{ value: '', label: 'All Employees' }]);
  const [projects, setProjects] = useState([{ value: '', label: 'All Projects' }]);

  // Data state per tab
  const [kpi, setKpi] = useState(null);
  const [productivity, setProductivity] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [projData, setProjData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [lowData, setLowData] = useState([]);
  const [lowSummary, setLowSummary] = useState(null);
  const [approvalData, setApprovalData] = useState(null);
  const [rejectionData, setRejectionData] = useState(null);

  // Load reference data once
  useEffect(() => {
    Promise.all([
      getDepartments({ limit: 200, status: 'active' }),
      getEmployees({ limit: 200, status: 'active' }),
      getProjects({ limit: 200, status: 'active' }),
    ]).then(([d, e, p]) => {
      setDepartments([{ value: '', label: 'All Departments' }, ...d.data.data.map((x) => ({ value: x._id, label: x.name }))]);
      setEmployees([{ value: '', label: 'All Employees' }, ...e.data.data.map((x) => ({ value: x._id, label: `${x.name} (${x.employeeId})` }))]);
      setProjects([{ value: '', label: 'All Projects' }, ...p.data.data.map((x) => ({ value: x._id, label: x.name }))]);
    }).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const p = {};
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;
    if (filters.department) p.department = filters.department;
    if (filters.employee) p.employee = filters.employee;
    if (filters.project) p.project = filters.project;
    return p;
  }, [filters]);

  const loadTab = useCallback(async (tab) => {
    setLoading(true);
    setDrillDown(null);
    const params = buildParams();

    try {
      switch (tab) {
        case 'overview': {
          const [kpiRes, prodRes, deptRes, topRes] = await Promise.all([
            getAnalyticsKpi(params),
            getProductivity({ ...params, startDate: toISODate(new Date(now.getTime() - 30 * 86400000)), endDate: params.endDate || toISODate(now) }),
            getDepartmentAnalytics({ startDate: `${now.getFullYear()}-01-01`, endDate: toISODate(now) }),
            getTopEmployees({ ...params, limit: 10 }),
          ]);
          setKpi(kpiRes.data.data);
          setProductivity(prodRes.data.data);
          setDeptData(deptRes.data.data);
          setTopPerformers(topRes.data.data);
          break;
        }
        case 'monthly': {
          const res = await getMonthlyTrend({ ...params, year: filters.year });
          setMonthlyData(res.data.data);
          break;
        }
        case 'weekly': {
          const res = await getWeeklyTrend({ ...params, weeks: filters.weeks });
          setWeeklyData(res.data.data);
          break;
        }
        case 'yearly': {
          const res = await getYearlyTrend();
          setYearlyData(res.data.data);
          break;
        }
        case 'departments': {
          const res = await getDepartmentAnalytics(params);
          setDeptData(res.data.data);
          break;
        }
        case 'projects': {
          const res = await getProjectAnalytics(params);
          setProjData(res.data.data);
          break;
        }
        case 'performers': {
          const [topRes, lowRes] = await Promise.all([
            getTopEmployees({ ...params, limit: filters.limit || 10 }),
            getLowPerformers({ ...params, threshold: filters.threshold, limit: 20 }),
          ]);
          setTopPerformers(topRes.data.data);
          setLowData(lowRes.data.data.rows);
          setLowSummary(lowRes.data.data.summary);
          break;
        }
        case 'workflow': {
          const [appRes, rejRes] = await Promise.all([
            getApprovalTime(params),
            getRejectionAnalytics(params),
          ]);
          setApprovalData(appRes.data.data);
          setRejectionData(rejRes.data.data);
          break;
        }
      }
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [buildParams, filters]);

  // Load on mount and tab change
  useEffect(() => { loadTab(activeTab); }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleClearCache = async () => {
    try {
      await clearAnalyticsCache();
      toast.success('Cache cleared — next load will fetch fresh data');
      loadTab(activeTab);
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiBarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="page-title">Analytics</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ExportBar activeTab={activeTab} filters={filters} toast={toast} />
          <button
            onClick={handleClearCache}
            className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
            title="Clear server-side cache and refresh"
          >
            <FiRefreshCw className="w-3 h-3" />Cache
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        departments={departments}
        employees={employees}
        projects={projects}
        onRefresh={() => loadTab(activeTab)}
        loading={loading}
        activeTab={activeTab}
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="card h-64 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab kpi={kpi} productivity={productivity} deptData={deptData} topPerformers={topPerformers} />
          )}
          {activeTab === 'monthly' && <MonthlyTab data={monthlyData} filters={filters} />}
          {activeTab === 'weekly' && <WeeklyTab data={weeklyData} />}
          {activeTab === 'yearly' && <YearlyTab data={yearlyData} />}
          {activeTab === 'departments' && (
            <>
              <DepartmentsTab data={deptData} filters={filters} onDrillDown={setDrillDown} />
              {drillDown && (
                <DrillDownPanel
                  type="department"
                  value={drillDown}
                  filters={buildParams()}
                  onClose={() => setDrillDown(null)}
                />
              )}
            </>
          )}
          {activeTab === 'projects' && <ProjectsTab data={projData} />}
          {activeTab === 'performers' && <PerformersTab topData={topPerformers} lowData={lowData} lowSummary={lowSummary} />}
          {activeTab === 'workflow' && <WorkflowTab approvalData={approvalData} rejectionData={rejectionData} />}
        </>
      )}
    </div>
  );
};

export default Analytics;
