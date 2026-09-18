import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid, Area, AreaChart,
} from 'recharts';
import api from '../utils/api';
import { Skeleton } from '../components/ui';
import { format, subDays } from 'date-fns';

const STATUS_COLORS = {
  'To Do':      '#94a3b8',
  'In Progress':'#3b82f6',
  'Review':     '#f59e0b',
  'Done':       '#22c55e',
  'Blocked':    '#ef4444',
  'On Hold':    '#f97316',
  'Cancelled':  '#6b7280',
};

const PRIORITY_COLORS = {
  'Low':      '#94a3b8',
  'Medium':   '#3b82f6',
  'High':     '#f59e0b',
  'Critical': '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, workloadRes, statsRes, projectsRes] = await Promise.all([
          api.get('/tasks?limit=500'),
          api.get('/reports/workload'),
          api.get('/reports/dashboard'),
          api.get('/projects'),
        ]);
        setTasks(tasksRes.data.data);
        setWorkload(workloadRes.data.data);
        setStats(statsRes.data.data);
        setProjects(projectsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Status breakdown
  const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  // Priority breakdown
  const byPriority = tasks.reduce((acc, t) => { const p = t.priority || 'Medium'; acc[p] = (acc[p] || 0) + 1; return acc; }, {});
  const priorityData = Object.entries(byPriority).map(([name, value]) => ({ name, value }));

  // Team workload
  const workloadData = workload
    .filter(w => w.user)
    .map(w => ({ name: `${w.user.firstName} ${w.user.lastName?.[0] || ''}.`, tasks: w.taskCount }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 10);

  // Project completion rates
  const projectData = projects
    .map(p => ({
      name: p.projectCode || p.name.slice(0, 10),
      progress: p.progress || 0,
      status: p.status,
    }))
    .slice(0, 8);

  // Task creation trend (last 14 days by createdAt)
  const trendMap = {};
  for (let i = 13; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'MMM d');
    trendMap[day] = 0;
  }
  tasks.forEach(t => {
    const day = format(new Date(t.createdAt), 'MMM d');
    if (trendMap.hasOwnProperty(day)) trendMap[day]++;
  });
  const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

  const kpis = [
    { label: 'Active Projects', value: stats?.activeProjects ?? '–', bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-100' },
    { label: 'Total Tasks',     value: tasks.length,                  bg: 'bg-slate-50',  text: 'text-slate-700', border: 'border-slate-200' },
    { label: 'Completed',       value: stats?.completedTasks ?? '–',  bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-100' },
    { label: 'In Progress',     value: tasks.filter(t => t.status === 'In Progress').length, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    { label: 'Overdue',         value: stats?.overdueTasks ?? '–',    bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-100' },
    { label: 'Completion Rate', value: tasks.length > 0 ? `${Math.round((stats?.completedTasks || 0) / tasks.length * 100)}%` : '0%', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Analytics and performance overview for your organization.</p>
      </div>

      {/* KPI Row */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map(item => (
            <div key={item.label} className={`card p-4 border ${item.border} ${item.bg}`}>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider leading-tight">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.text}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Task Trend */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks Created — Last 14 Days</h3>
        {loading ? <Skeleton className="h-48 w-full" /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Tasks" stroke="#0d9488" strokeWidth={2} fill="url(#taskGrad)" dot={{ r: 3, fill: '#0d9488' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Status</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : statusData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Priority</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : priorityData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2} dataKey="value">
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Workload */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Workload (Open Tasks)</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : workloadData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No workload data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={workloadData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tasks" name="Open Tasks" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project Progress */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Project Completion Rate</h3>
          {loading ? <Skeleton className="h-48 w-full" /> : projectData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No projects yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} formatter={v => [`${v}%`, 'Progress']} />
                <Bar dataKey="progress" name="Completion" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
