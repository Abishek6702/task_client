import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useToast } from './Toast';

const CreateProjectModal = ({ onClose, onCreated }) => {
  const { user } = useSelector(state => state.auth);
  const { addToast } = useToast();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', projectCode: '', description: '',
    managerId: '', priority: 'Medium', status: 'Planning',
    startDate: '', dueDate: '',
  });

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get('/users');
        setManagers(res.data.data.filter(u => ['organization_admin','project_manager','team_lead'].includes(u.role)));
      } catch (err) { console.error(err); }
    };
    fetchManagers();
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', form);
      addToast({ type: 'success', message: 'Project created successfully!' });
      onCreated();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create project' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Create New Project</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-field">Project Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="e.g. Website Redesign" />
            </div>
            <div>
              <label className="label-field">Project Code *</label>
              <input name="projectCode" value={form.projectCode} onChange={handleChange} required className="input-field" placeholder="e.g. WEB" maxLength={6} />
            </div>
            <div>
              <label className="label-field">Manager *</label>
              <select name="managerId" value={form.managerId} onChange={handleChange} required className="input-field">
                <option value="">Select Manager</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option>Planning</option><option>Active</option><option>On Hold</option>
              </select>
            </div>
            <div>
              <label className="label-field">Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Due Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Project description..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
