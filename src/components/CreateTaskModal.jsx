import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, X } from 'lucide-react';
import api from '../utils/api';
import { useToast } from './Toast';

const CreateTaskModal = ({ projectId, project, onClose, onCreated }) => {
  const { user } = useSelector(state => state.auth);
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '',
    priority: 'Medium', status: 'To Do',
    startDate: '', dueDate: '', estimatedHours: '',
    labels: '', reportingTo: '',
  });
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!projectId) return;
      try {
        const res = await api.get(`/projects/${projectId}`);
        setMembers((res.data.data.members || []).filter(m => m.isActive !== false));
      } catch (err) { console.error(err); }
    };
    fetchMembers();
  }, [projectId]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addAssignee = (e) => {
    const id = e.target.value;
    if (id && !selectedAssignees.includes(id)) {
      setSelectedAssignees(prev => [...prev, id]);
    }
    e.target.value = ''; // reset dropdown
  };

  const removeAssignee = (id) => setSelectedAssignees(prev => prev.filter(a => a !== id));

  const getSelectedMemberData = () =>
    members.filter(m => selectedAssignees.includes(m._id));

  const availableForAssign = members.filter(m => !selectedAssignees.includes(m._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        projectId,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        assignedTo: selectedAssignees,
        reportingTo: form.reportingTo || undefined,
      };
      const res = await api.post('/tasks', payload);
      addToast({ type: 'success', message: 'Task created successfully!' });
      onCreated(res.data.data);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create task.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-slate-900">Create Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="label-field">Task Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input-field" placeholder="Brief, descriptive task name" />
          </div>

          {/* Description */}
          <div>
            <label className="label-field">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="What needs to be done?" />
          </div>

          {/* Assignees — dropdown + chips */}
          {members.length > 0 && (
            <div>
              <label className="label-field">Assignees</label>
              {/* Selected chips */}
              {selectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                  {getSelectedMemberData().map(m => (
                    <span key={m._id} className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-full px-2.5 py-1 text-xs font-medium">
                      <span className="h-4 w-4 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[9px] font-bold">
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </span>
                      {m.firstName} {m.lastName}
                      <button type="button" onClick={() => removeAssignee(m._id)} className="text-brand-400 hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Dropdown to add */}
              {availableForAssign.length > 0 && (
                <select onChange={addAssignee} defaultValue="" className="input-field">
                  <option value="">Select assignee to add…</option>
                  {availableForAssign.map(m => (
                    <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role?.replace('_', ' ')})</option>
                  ))}
                </select>
              )}
              {selectedAssignees.length === 0 && <p className="text-xs text-slate-400 mt-1">No assignees selected</p>}
            </div>
          )}

          {/* Reporting To — single dropdown */}
          {members.length > 0 && (
            <div>
              <label className="label-field">Reporting To</label>
              <select name="reportingTo" value={form.reportingTo} onChange={handleChange} className="input-field">
                <option value="">— None —</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role?.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option>To Do</option><option>In Progress</option><option>Review</option><option>Done</option>
                <option>Blocked</option><option>On Hold</option>
              </select>
            </div>
            <div>
              <label className="label-field">Estimated Hours</label>
              <input name="estimatedHours" type="number" min="0" value={form.estimatedHours} onChange={handleChange} className="input-field" placeholder="e.g. 4" />
            </div>
            <div>
              <label className="label-field">Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Due Date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field">Labels <span className="text-slate-400 font-normal">(comma-separated)</span></label>
            <input name="labels" value={form.labels} onChange={handleChange} className="input-field" placeholder="e.g. frontend, bug, urgent" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
