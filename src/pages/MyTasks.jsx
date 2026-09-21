import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react';
import { Badge, Skeleton } from '../components/ui';
import TaskDetailsModal from '../components/TaskDetailsModal';
import api from '../utils/api';
import { format, isToday, isPast, isFuture, startOfDay } from 'date-fns';

const STATUS_ICON = {
  'Done': <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />,
  'In Progress': <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />,
  'Blocked': <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
};

const QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filter, setFilter] = useState('all'); // Quick filter
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const { user } = useSelector(state => state.auth);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/tasks?assignedTo=${user._id}&page=${page}&limit=20`;
      if (projectId) url += `&projectId=${projectId}`;
      if (priority) url += `&priority=${priority}`;
      if (search) url += `&search=${search}`; // if backend supports it, otherwise local filter
      
      const res = await api.get(url);
      setTasks(res.data.data);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: res.data.data.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects?status=Active');
        setProjects(res.data.data);
      } catch (err) {
        // ignore
      }
    };
    if (user?._id) {
      fetchProjects();
      fetchTasks(1);
    }
  }, [user, projectId, priority]); // re-fetch when project or priority changes

  const today = startOfDay(new Date());

  const filtered = tasks.filter(task => {
    // Quick filter
    if (filter === 'today') {
      if (!task.dueDate || !isToday(new Date(task.dueDate))) return false;
    } else if (filter === 'upcoming') {
      if (!task.dueDate || !isFuture(new Date(task.dueDate)) || isToday(new Date(task.dueDate))) return false;
    } else if (filter === 'overdue') {
      if (!task.dueDate || !isPast(new Date(task.dueDate)) || isToday(new Date(task.dueDate)) || task.status === 'Done') return false;
    } else if (filter === 'completed') {
      if (task.status !== 'Done') return false;
    }
    // Search
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Priority filter
    if (priority && task.priority !== priority) return false;
    return true;
  });

  const overdueCount   = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'Done').length;
  const todayCount     = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length;
  const upcomingCount  = tasks.filter(t => t.dueDate && isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length;
  const completedCount = tasks.filter(t => t.status === 'Done').length;

  const TAB_COUNTS = {
    all: tasks.length,
    today: todayCount,
    upcoming: upcomingCount,
    overdue: overdueCount,
    completed: completedCount,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {overdueCount > 0
            ? <span className="text-red-600 font-medium">{overdueCount} overdue task{overdueCount > 1 ? 's' : ''} need attention.</span>
            : 'Everything assigned to you.'}
        </p>
      </div>

      {/* Quick filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {QUICK_FILTERS.map(f => {
          const count = TAB_COUNTS[f.id];
          const isOverdueTab = f.id === 'overdue';
          const badgeColor = isOverdueTab && count > 0
            ? 'bg-red-100 text-red-700'
            : 'bg-slate-100 text-slate-600';
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === f.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks locally..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-field max-w-xs">
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field max-w-36">
          <option value="">All Priority</option>
          <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
        </select>
      </div>

      {/* Task table */}
      {loading ? (
        <div className="card divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-32" /></div>
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900">No tasks found</p>
          <p className="text-sm text-slate-500 mt-1">
            {search || priority ? 'Try adjusting your filters.' : filter === 'completed' ? 'No completed tasks yet.' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filtered.map(task => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'Done';
                  return (
                    <tr 
                      key={task._id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${task.status === 'Done' ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedTaskId(task._id)}
                    >
                      <td className="px-4 py-3">
                        {STATUS_ICON[task.status] || <Circle className="h-4 w-4 text-slate-300" />}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{task.taskCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {task.projectId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><Badge label={task.priority || 'Medium'} showDot /></td>
                      <td className="px-4 py-3"><Badge label={task.status} /></td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : isToday(new Date(task.dueDate)) ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                            {isOverdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : <span className="text-sm text-slate-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {filtered.length} visible (Total: {pagination.total})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchTasks(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary py-1 text-xs"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchTasks(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-secondary py-1 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {pagination.pages <= 1 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
              Showing {filtered.length} tasks
            </div>
          )}
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
          }}
        />
      )}
    </div>
  );
};

export default MyTasks;
