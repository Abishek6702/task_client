import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronRight, Plus, Users, BarChart3, Calendar, LayoutGrid, List, Activity, Settings } from 'lucide-react';
import api from '../utils/api';
import { Badge, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';
import ProjectBoard from './ProjectBoard';
import TaskTable from '../components/TaskTable';
import ProjectMembers from '../components/ProjectMembers';
import ProjectDivisions from '../components/ProjectDivisions';
import ActivityList from '../components/ActivityList';
import Pagination from '../components/Pagination';
import { format } from 'date-fns';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks', icon: List },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useSelector(state => state.auth);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [taskPagination, setTaskPagination] = useState(null);
  const [taskPage, setTaskPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStatsTab, setActiveStatsTab] = useState('all');
  const [updating, setUpdating] = useState(false);
  const { addToast } = useToast();
  const isAdmin = ['organization_admin'].includes(user?.role);
  
  // Settings Form State
  const [editForm, setEditForm] = useState(null);

  const fetchProject = async (requestedTaskPage = taskPage) => {
    try {
      const [projRes, taskRes, summaryRes, divRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}&page=${requestedTaskPage}&limit=20`),
        api.get(`/projects/${id}/summary`),
        api.get(`/divisions?projectId=${id}`)
      ]);
      setProject(projRes.data.data);
      setTasks(taskRes.data.data);
      setTaskPagination(taskRes.data.pagination);
      setSummary(summaryRes.data.data);
      setDivisions(divRes.data.data || []);
      setTaskPage(taskRes.data.pagination?.page || requestedTaskPage);
      setEditForm(projRes.data.data);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load project details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setTaskPage(1); fetchProject(1); }, [id]);

  const canManage = project && (
    user?.role === 'organization_admin' ||
    project.managerId?._id === user?._id ||
    project.managerId === user?._id
  );

  const canCreateTask = project && (
    canManage ||
    ((user?.role === 'employee' || user?.role === 'team_lead') && 
     project.members?.some(m => String(m._id || m) === String(user?._id)))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-16 text-slate-500 text-sm">Project not found.</div>;
  }

  const taskStats = {
    total: summary?.totalTasks ?? tasks.length,
    done: summary?.completedTasks ?? tasks.filter(t => t.status === 'Done').length,
    inProgress: summary?.statusBreakdown?.find(item => item._id === 'In Progress')?.count ?? tasks.filter(t => t.status === 'In Progress').length,
    todo: summary?.statusBreakdown?.find(item => item._id === 'To Do')?.count ?? tasks.filter(t => t.status === 'To Do').length,
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.put(`/projects/${id}`, editForm);
      setProject(res.data.data);
      addToast({ type: 'success', message: 'Project updated successfully' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (force = false) => {
    if (!window.confirm(`Are you sure you want to ${force ? 'permanently delete' : 'archive/delete'} this project?`)) return;
    try {
      const res = await api.delete(`/projects/${id}${force ? '?force=true' : ''}`);
      if (res.data.archived) {
        addToast({ type: 'success', message: res.data.message });
        fetchProject(); // refresh to show archived status
      } else {
        addToast({ type: 'success', message: 'Project deleted' });
        navigate('/projects');
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Delete failed' });
    }
  };

  const visibleTabs = canManage ? [...TABS, { id: 'settings', label: 'Settings', icon: Settings }] : TABS;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/projects" className="text-slate-500 hover:text-slate-700">Projects</Link>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="text-slate-900 font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {project.projectCode?.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{project.projectCode}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <Badge label={project.status} />
                <Badge label={project.priority || 'Medium'} showDot />
                <span className="text-xs text-slate-500">
                  Manager: <span className="font-medium text-slate-700">{project.managerId?.firstName} {project.managerId?.lastName}</span>
                </span>
                {project.dueDate && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {format(new Date(project.dueDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold text-slate-900">{project.progress || 0}%</p>
              <p className="text-xs text-slate-500">Complete</p>
            </div>
            <div className="w-20 hidden sm:block">
              <div className="bg-slate-200 rounded-full h-1.5">
                <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Task stats Tabbed View */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          {/* Show division tabs only for admins */}
          {isAdmin && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveStatsTab('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeStatsTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Tasks
              </button>
              {divisions?.map(div => (
                <button
                  key={div._id}
                  onClick={() => setActiveStatsTab(div._id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                    activeStatsTab === div._id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {div.name}
                </button>
              ))}
              {summary?.divisionBreakdown?.find(d => !d._id) && (
                <button
                  onClick={() => setActiveStatsTab('unassigned')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                    activeStatsTab === 'unassigned'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  No Division
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {(() => {
              let currentStats = taskStats;

              // For admins switching division tabs, filter by that division's breakdown
              if (isAdmin && activeStatsTab !== 'all') {
                const divIdToFind = activeStatsTab === 'unassigned' ? null : activeStatsTab;
                const found = summary?.divisionBreakdown?.find(d =>
                  divIdToFind === null ? !d._id : String(d._id) === String(divIdToFind)
                );
                currentStats = found || { total: 0, todo: 0, inProgress: 0, done: 0 };
              }
              // Employees: backend already filtered summary to their own tasks, use taskStats directly

              return [
                { label: 'Total', value: currentStats.total, color: 'text-slate-700' },
                { label: 'To Do', value: currentStats.todo, color: 'text-slate-600' },
                { label: 'In Progress', value: currentStats.inProgress, color: 'text-blue-600' },
                { label: 'Done', value: currentStats.done, color: 'text-green-600' },
              ].map(s => (
                <div key={s.label} className="text-center bg-slate-50 rounded-lg p-3">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] uppercase text-slate-500 font-medium mt-1">{s.label}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Project Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd><Badge label={project.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Priority</dt>
                <dd><Badge label={project.priority || 'Medium'} showDot /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Start Date</dt>
                <dd className="text-slate-900">{project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Due Date</dt>
                <dd className="text-slate-900">{project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Members</dt>
                <dd className="text-slate-900">{project.members?.length || 0} people</dd>
              </div>
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Task Progress</h3>
            <div className="space-y-3">
              {[
                { label: 'Done', count: taskStats.done, total: taskStats.total, color: 'bg-green-500' },
                { label: 'In Progress', count: taskStats.inProgress, total: taskStats.total, color: 'bg-blue-500' },
                { label: 'To Do', count: taskStats.todo, total: taskStats.total, color: 'bg-slate-300' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-500">{item.count} / {item.total}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'tasks' && (
        <>
          <TaskTable projectId={id} tasks={tasks} setTasks={setTasks} canManage={canManage} canCreateTask={canCreateTask} project={project} onRefresh={() => fetchProject(taskPage)} />
          <div className="card mt-4">
            <Pagination page={taskPagination?.page || taskPage} totalPages={taskPagination?.totalPages || taskPagination?.pages} onPageChange={fetchProject} />
          </div>
        </>
      )}
      {activeTab === 'board' && (
      <ProjectBoard projectId={id} projectData={project} canManage={canManage} canCreateTask={canCreateTask} />
      )}
      {activeTab === 'members' && (
        <div className="space-y-6"><ProjectMembers project={project} canManage={canManage} onRefresh={fetchProject} /><ProjectDivisions project={project} canManage={canManage} /></div>
      )}
      {activeTab === 'activity' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Project Timeline</h3>
          <ActivityList entityType="project" entityId={id} />
        </div>
      )}
      {activeTab === 'settings' && canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Project Settings</h3>
              <p className="text-sm text-slate-500">Update project details and status.</p>
            </div>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="label-field">Project Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="label-field">Description</label>
                  <textarea value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="input-field min-h-[100px]" />
                </div>
                <div>
                  <label className="label-field">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="input-field">
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="input-field">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Start Date</label>
                  <input type="date" value={editForm.startDate ? editForm.startDate.split('T')[0] : ''} onChange={e => setEditForm({ ...editForm, startDate: e.target.value || null })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Due Date</label>
                  <input type="date" value={editForm.dueDate ? editForm.dueDate.split('T')[0] : ''} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value || null })} className="input-field" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button type="submit" disabled={updating} className="btn btn-primary">
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="card p-6 border-red-200 bg-red-50/30 flex flex-col items-start gap-4 h-fit">
            <div>
              <h3 className="text-lg font-medium text-red-700">Danger Zone</h3>
              <p className="text-xs text-red-600 mt-1">Once you delete a project, there is no going back. Please be certain.</p>
            </div>
            {user?.role === 'organization_admin' ? (
              <div className="space-y-3 w-full border-t border-red-200 pt-4">
                <button onClick={() => handleDeleteProject(false)} className="btn w-full border-red-200 text-red-600 hover:bg-red-50 text-sm justify-center">
                  Archive / Soft Delete
                </button>
                <button onClick={() => handleDeleteProject(true)} className="btn btn-danger w-full text-sm justify-center">
                  Permanently Delete
                </button>
              </div>
            ) : (
              <p className="text-xs text-red-600 font-medium">Only Organization Admins can delete projects.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
