import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Users, Edit2, X, Loader2, UserCheck, UserX } from 'lucide-react';
import { Avatar, Badge, Skeleton, EmptyState } from '../components/ui';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

const ROLES = ['organization_admin', 'project_manager', 'team_lead', 'employee', 'viewer'];
const ROLE_LABELS = {
  organization_admin: 'Org Admin',
  project_manager: 'Project Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
  viewer: 'Viewer',
};

const DivisionTypes = () => {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => { 
    try { 
      const res = await api.get('/divisions/organization'); 
      setItems(res.data.data || []); 
    } catch (err) { 
      addToast({ type: 'error', message: err.response?.data?.message || 'Unable to load division types.' }); 
    } 
  };
  useEffect(() => { load(); }, []);

  const save = async (event) => { 
    event.preventDefault(); 
    setSaving(true);
    try { 
      if (editing) await api.put(`/divisions/organization/${editing._id}`, { name, description }); 
      else await api.post('/divisions/organization', { name, description }); 
      closeModal();
      await load(); 
      addToast({ type: 'success', message: 'Division type saved.' }); 
    } catch (err) { 
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to save division type.' }); 
    } finally {
      setSaving(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setName(item.name);
      setDescription(item.description || '');
    } else {
      setEditing(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setName('');
    setDescription('');
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Organization Division Types</h2>
          <p className="text-xs text-slate-500 mt-1">These define capabilities available to organization users.</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-secondary text-xs flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Division
        </button>
      </div>
      
      {items.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
          No organization divisions configured yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map(item => (
            <div key={item._id} className="flex items-start justify-between border border-slate-200 bg-slate-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>}
              </div>
              <button 
                className="text-slate-400 hover:text-brand-600 transition-colors p-1 flex-shrink-0" 
                onClick={() => openModal(item)}
                title="Edit Division"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{editing ? 'Edit Division Type' : 'Add Division Type'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Division Name *</label>
                <input required className="input-field" placeholder="e.g. Frontend" value={name} onChange={event => setName(event.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Optional description" value={description} onChange={event => setDescription(event.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-secondary flex-1" onClick={closeModal}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Add Division')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InviteModal = ({ onClose, onCreated }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee', department: '' });
  const [saving, setSaving] = useState(false);
  const [divisionTypes, setDivisionTypes] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  useEffect(() => { api.get('/divisions/organization').then(res => setDivisionTypes(res.data.data || [])).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/users', { ...form, divisionCapabilities: capabilities });
      addToast({ type: 'success', message: `User ${form.firstName} ${form.lastName} created successfully.` });
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Add Team Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
              <input required className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
              <input required className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
            </div>
          </div>
          {divisionTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Divisions this employee can work in</label>
              <div className="space-y-0.5 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {divisionTypes.map(division => {
                  const isSelected = capabilities.includes(division._id);
                  return (
                    <label key={division._id} className="flex items-center p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{division.name}</span>
                      </div>
                      <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => setCapabilities(current => current.includes(division._id) ? current.filter(id => id !== division._id) : [...current, division._id])} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
            <input required type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
            <input required type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" minLength={6} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role *</label>
              <select required className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <input className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditRoleModal = ({ user: editUser, onClose, onUpdated }) => {
  const { addToast } = useToast();
  const [role, setRole] = useState(editUser.role);
  const [isActive, setIsActive] = useState(editUser.isActive);
  const [saving, setSaving] = useState(false);
  const [divisionTypes, setDivisionTypes] = useState([]);
  const [capabilities, setCapabilities] = useState(editUser.divisionCapabilities || []);
  useEffect(() => { api.get('/divisions/organization').then(res => setDivisionTypes(res.data.data || [])).catch(() => {}); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/users/${editUser._id}`, { role, isActive, divisionCapabilities: capabilities });
      addToast({ type: 'success', message: 'User updated.' });
      onUpdated(res.data.data);
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to update user.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Edit {editUser.firstName} {editUser.lastName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
            <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Account Status</p>
              <p className="text-xs text-slate-500">{isActive ? 'Active — can log in' : 'Inactive — access revoked'}</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
          {divisionTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Divisions this employee can work in</label>
              <div className="space-y-0.5 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {divisionTypes.map(division => {
                  const isSelected = capabilities.includes(division._id);
                  return (
                    <label key={division._id} className="flex items-center p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{division.name}</span>
                      </div>
                      <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => setCapabilities(current => current.includes(division._id) ? current.filter(id => id !== division._id) : [...current, division._id])} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { user: currentUser } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        const res = await api.get(`/users?${params}`);
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, search, roleFilter]);

  const canManage = ['organization_admin'].includes(currentUser?.role);

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} total · {activeCount} active members
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowInvite(true)} className="btn btn-primary flex-shrink-0">
            <Plus className="h-4 w-4 mr-2" /> Add Member
          </button>
        )}
      </div>

      {canManage && <DivisionTypes />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }} className="input-field max-w-48">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-9 w-9 rounded" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
              <Skeleton className="h-5 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No users found" message="Try adjusting your search or filters." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {canManage && (
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName} ${u.lastName}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-700">{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-slate-600">{u.department || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3.5 text-right">
                      {u._id !== currentUser._id && (
                        <button
                          onClick={() => setEditingUser(u)}
                          className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            {filtered.length} users on this page{pagination?.total != null ? ` of ${pagination.total}` : ''}
          </div>
          <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages || pagination?.pages} onPageChange={setPage} />
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onCreated={(newUser) => setUsers(prev => [...prev, newUser])}
        />
      )}
      {editingUser && (
        <EditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={(updatedUser) => {
            setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
          }}
        />
      )}
    </div>
  );
};

export default Team;
