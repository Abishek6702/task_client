import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Filter } from 'lucide-react';
import api from '../utils/api';
import { Badge, EmptyState, Skeleton } from '../components/ui';
import Pagination from '../components/Pagination';
import { format } from 'date-fns';
import CreateProjectModal from '../components/CreateProjectModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useSelector(state => state.auth);

  const fetchProjects = async (requestedPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(requestedPage), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/projects?${params}`);
      setProjects(res.data.data);
      setPagination(res.data.pagination);
      setPage(res.data.pagination?.page || requestedPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(1); }, [filterStatus]);

  const canCreate = ['organization_admin', 'project_manager'].includes(user?.role);

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.projectCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track your organization's projects.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary flex-shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field pl-9 pr-8 appearance-none"
          >
            <option value="">All Status</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            message={search || filterStatus ? 'Try adjusting your filters.' : 'Get started by creating your first project.'}
            action={canCreate ? (
              <button onClick={() => setShowCreate(true)} className="btn btn-primary mx-auto">
                <Plus className="h-4 w-4 mr-2" /> New Project
              </button>
            ) : null}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Manager</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filtered.map(project => (
                  <tr key={project._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link to={`/projects/${project._id}`} className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {project.projectCode?.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">{project.name}</p>
                          <p className="text-xs text-slate-500">{project.projectCode}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{project.managerId?.firstName} {project.managerId?.lastName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={project.priority || 'Medium'} showDot />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={project.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">
                        {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination?.page || 1} totalPages={pagination?.totalPages || pagination?.pages} onPageChange={fetchProjects} />
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProjects(); }}
        />
      )}
    </div>
  );
};

export default Projects;
