import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle, FolderKanban, ChevronRight, Users } from 'lucide-react';
import api from '../utils/api';
import { Badge, Skeleton, SkeletonRow, Avatar } from '../components/ui';

const KpiCard = ({ title, value, icon: Icon, iconColor, bgColor, loading }) => (
  <div className="card p-5">
    {loading ? (
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-12" />
      </div>
    ) : (
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`${bgColor} p-2 rounded-md`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [workload, setWorkload] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          api.get('/reports/dashboard'),
          api.get('/projects?status=Active'),
          api.get(`/tasks?assignedTo=${user._id}`),
        ];
        
        if (['organization_admin', 'project_manager'].includes(user?.role)) {
          promises.push(api.get('/reports/workload'));
        }

        const results = await Promise.all(promises);
        setStats(results[0].data.data);
        setProjects(results[1].data.data.slice(0, 5));
        setMyTasks(results[2].data.data.filter(t => t.status !== 'Done').slice(0, 5));
        
        if (results[3]) {
          setWorkload(results[3].data.data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTasks = myTasks
    .filter(t => t.dueDate && new Date(t.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{greeting}, {user?.firstName}.</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {overdueTasks.length > 0
            ? `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need your attention.`
            : "Here's what's happening across your workspace today."}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Projects" value={stats?.activeProjects ?? '–'} icon={FolderKanban} iconColor="text-brand-600" bgColor="bg-brand-50" loading={loading} />
        <KpiCard title="Open Tasks" value={stats?.openTasks ?? '–'} icon={Clock} iconColor="text-blue-600" bgColor="bg-blue-50" loading={loading} />
        <KpiCard title="Completed" value={stats?.completedTasks ?? '–'} icon={CheckCircle2} iconColor="text-green-600" bgColor="bg-green-50" loading={loading} />
        <KpiCard title="Overdue" value={stats?.overdueTasks ?? '–'} icon={AlertCircle} iconColor="text-red-600" bgColor="bg-red-50" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Active Projects</h2>
            <Link to="/projects" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : projects.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No active projects found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map(project => (
                <Link key={project._id} to={`/projects/${project._id}/board`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {project.projectCode?.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700 transition-colors">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.projectCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-1.5">
                        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-500 w-8">{project.progress || 0}%</span>
                    </div>
                    <Badge label={project.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Upcoming Tasks */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Deadlines</h2>
            <Link to="/tasks/me" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              My tasks <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : upcomingTasks.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No upcoming deadlines.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingTasks.map(task => {
                const dueDate = new Date(task.dueDate);
                const isToday = dueDate.toDateString() === new Date().toDateString();
                const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={task._id} to={`/tasks/me`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.projectId?.name}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isToday ? (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Today</span>
                      ) : diffDays === 1 ? (
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Tomorrow</span>
                      ) : (
                        <span className="text-xs text-slate-500">{diffDays}d left</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Role-based extra widget for Admins/Managers */}
        {['organization_admin', 'project_manager'].includes(user?.role) && (
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Team Workload</h2>
              <Link to="/reports" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : workload.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No workload data.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workload.map(member => (
                  <div key={member._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={`${member.user?.firstName} ${member.user?.lastName}`} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {member.user?.firstName} {member.user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{member.user?.role?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-brand-600">{member.taskCount}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
