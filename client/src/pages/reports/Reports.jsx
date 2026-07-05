import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FiFileText, FiBarChart2, FiCalendar, FiSliders, FiDownload, FiTrash2,
} from 'react-icons/fi';
import { getReportSummary, downloadReport, deleteReport } from '../../services/report.service';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import ToastContainer from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import { MONTH_NAMES } from '../../utils/constants';

const PERF_COLORS = {
  'Excellent': '#22c55e',
  'Very Good': '#84cc16',
  'Good': '#eab308',
  'Average': '#f97316',
  'Needs Improvement': '#ef4444',
};

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#0284c7', '#7c3aed'];

const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const cls = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  }[color];
  return (
    <div className={`card p-4 ${cls}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
};

const ReportsTabs = ({ active }) => (
  <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
    {[
      { to: '/reports', label: 'Overview', id: 'overview' },
      { to: '/reports/weekly', label: 'Weekly', id: 'weekly' },
      { to: '/reports/monthly', label: 'Monthly', id: 'monthly' },
      { to: '/reports/custom', label: 'Custom', id: 'custom' },
      { to: '/reports/analytics', label: 'Analytics', id: 'analytics' },
    ].map((tab) => (
      <Link
        key={tab.id}
        to={tab.to}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
          active === tab.id
            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        {tab.label}
      </Link>
    ))}
  </nav>
);

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  const load = () => {
    setLoading(true);
    getReportSummary()
      .then((r) => { setSummary(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (id, name) => {
    try {
      const res = await downloadReport(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
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

  if (loading) return <Loader />;

  const monthlyTrend = (summary?.monthlyTrend || []).map((d) => ({
    name: `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`,
    Items: d.items,
    Hours: d.hours,
  }));

  const deptData = (summary?.deptBreakdown || []).map((d) => ({
    name: d.name,
    Items: d.totalItems,
  }));

  const perfData = (summary?.performanceDistribution || []).map((d) => ({
    name: d._id || 'Unknown',
    value: d.count,
  }));

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ReportsTabs active="overview" />

      <div className="flex items-center justify-between">
        <h1 className="page-title">Reports Overview</h1>
        <div className="flex gap-2">
          <Link to="/reports/custom">
            <Button variant="secondary" size="sm"><FiSliders className="mr-1" />Custom Report</Button>
          </Link>
          <Link to="/reports/weekly">
            <Button size="sm"><FiFileText className="mr-1" />Generate Report</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={summary?.totalReports} color="blue" />
        <StatCard label="This Month's Items" value={summary?.monthlyItems?.toLocaleString()} sub={`${summary?.monthlyEntries || 0} entries`} color="green" />
        <StatCard label="This Week Items" value={summary?.weeklyItems?.toLocaleString()} sub={`${(summary?.weeklyHours || 0).toFixed(1)}h worked`} color="purple" />
        <StatCard label="Reports This Month" value={summary?.monthReports} color="orange" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">
            Monthly Items Trend (Last 12 months)
          </h3>
          {monthlyTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Items" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">
            Department Breakdown (This Month)
          </h3>
          {deptData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Items" radius={[0, 4, 4, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Performance Distribution */}
      {perfData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm">
            Performance Distribution (This Month)
          </h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie data={perfData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {perfData.map((entry, i) => (
                    <Cell key={i} fill={PERF_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {perfData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PERF_COLORS[d.name] || '#94a3b8' }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {summary?.recentReports?.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Recent Reports</h3>
            <Link to="/reports/weekly" className="text-xs text-primary-600 hover:underline dark:text-primary-400">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {summary.recentReports.map((r) => (
              <div key={r._id} className="flex items-center gap-3 px-4 py-3">
                <FiFileText className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.reportName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.generatedBy?.fullName} · {formatDateTime(r.generatedAt)} · {formatFileSize(r.fileSize)}
                  </p>
                </div>
                <Badge value={r.format?.toUpperCase()} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(r._id, r.reportName)}>
                    <FiDownload className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => setDeleteId(r._id)}>
                    <FiTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/reports/weekly', icon: FiCalendar, label: 'Weekly Reports', desc: 'Generate and download weekly summaries' },
          { to: '/reports/monthly', icon: FiBarChart2, label: 'Monthly Reports', desc: 'View monthly productivity data' },
          { to: '/reports/analytics', icon: FiSliders, label: 'Analytics', desc: 'Interactive charts and filters' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card p-5 hover:shadow-md transition-shadow group">
            <Icon className="w-6 h-6 text-primary-600 mb-3" />
            <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

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

export { ReportsTabs };
export default Reports;
