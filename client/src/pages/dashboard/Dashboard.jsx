import { useEffect, useState } from 'react';
import { FiUsers, FiFolderPlus, FiClock, FiAlertCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import StatCard from '../../components/common/StatCard';
import { TableSkeleton } from '../../components/common/Skeleton';
import { getDashboardStats, getDashboardCharts, getTopPerformers } from '../../services/dashboard.service';
import { formatDate, getProductivityLevel } from '../../utils/formatters';
import { MONTH_NAMES } from '../../utils/constants';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c, p] = await Promise.all([getDashboardStats(), getDashboardCharts(), getTopPerformers()]);
        setStats(s.data.data);
        setCharts(c.data.data);
        setPerformers(p.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const monthlyData = charts?.monthlyTrend?.map((d) => ({
    name: `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`.slice(0, 6),
    items: d.items,
    hours: d.hours,
  })) || [];

  const deptData = charts?.departmentBreakdown?.map((d) => ({ name: d.name, value: d.totalItems })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats?.totalEmployees} icon={FiUsers} color="blue" subtitle={`${stats?.activeEmployees} active`} />
        <StatCard title="Active Projects" value={stats?.activeProjects} icon={FiFolderPlus} color="green" />
        <StatCard title="Entries This Month" value={stats?.monthEntries} icon={FiClock} color="purple" />
        <StatCard title="Pending Approvals" value={stats?.pendingApprovals} icon={FiAlertCircle} color="yellow" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Productivity Trend</h2>
          {loading ? <TableSkeleton rows={4} cols={1} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Items" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Department Breakdown</h2>
          {loading ? <TableSkeleton rows={4} cols={1} /> : deptData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Top Performers This Month</h2>
        {loading ? <TableSkeleton rows={5} cols={4} /> : !performers.length ? (
          <p className="text-sm text-gray-400 py-4">No approved entries this month yet.</p>
        ) : (
          <div className="space-y-3">
            {performers.slice(0, 5).map((p, i) => {
              const score = Math.min(100, Math.round((p.totalItems / 1000) * 100));
              const level = getProductivityLevel(score);
              return (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                      <span className="text-gray-500">{p.totalItems} items</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: level.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
