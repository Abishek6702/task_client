import { useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import api from '../utils/api';
import { useToast } from './Toast';
import { Avatar } from './ui';

const ProjectDivisions = ({ project, canManage }) => {
  const { addToast } = useToast();
  const [divisions, setDivisions] = useState([]);
  const [divisionTypes, setDivisionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals state
  const [isAddDivisionModalOpen, setIsAddDivisionModalOpen] = useState(false);
  const [isAssignMembersModalOpen, setIsAssignMembersModalOpen] = useState(false);
  
  const [form, setForm] = useState(null);
  const [memberEditor, setMemberEditor] = useState(null);

  const load = async () => {
    try {
      const response = await api.get(`/divisions?projectId=${project._id}`);
      setDivisions(response.data.data || []);
      const typesResponse = await api.get('/divisions/organization');
      setDivisionTypes(typesResponse.data.data || []);
    } catch (error) {
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to load divisions.' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [project._id]);

  const saveDivision = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const selectedType = divisionTypes.find(type => type._id === form.organizationDivisionId);
      const customName = String(form.name || '').trim();
      const payload = { 
        projectId: project._id, 
        name: customName || selectedType?.name || form.name || '', 
        organizationDivisionId: form.organizationDivisionId, 
        description: form.description, 
        members: form.members || [] 
      };
      if (form._id) await api.put(`/divisions/${form._id}`, payload);
      else await api.post('/divisions', payload);
      setForm(null);
      setIsAddDivisionModalOpen(false);
      await load();
      addToast({ type: 'success', message: 'Division saved.' });
    } catch (error) { 
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to save division.' }); 
    } finally { setSaving(false); }
  };

  const saveMembers = async (division, members) => {
    try {
      await api.put(`/divisions/${division._id}`, { members });
      setMemberEditor(null);
      setIsAssignMembersModalOpen(false);
      await load();
      addToast({ type: 'success', message: 'Division members updated.' });
    } catch (error) { 
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to update division members.' }); 
    }
  };

  const deleteDivision = async (division) => {
    if (!window.confirm(`Delete the ${division.name} division? Existing tasks will not be deleted.`)) return;
    try { 
      await api.delete(`/divisions/${division._id}`); 
      await load(); 
      addToast({ type: 'success', message: 'Division deleted.' }); 
    } catch (error) { 
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to delete division.' }); 
    }
  };

  const openAddDivision = () => {
    setForm({ name: '', description: '', members: [], organizationDivisionId: '' });
    setIsAddDivisionModalOpen(true);
  };

  const openAssignMembers = (division) => {
    setMemberEditor(division);
    setIsAssignMembersModalOpen(true);
  };

  if (loading) return <div className="card p-5 text-sm text-slate-500">Loading divisions...</div>;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Project Divisions</h3>
          <p className="text-xs text-slate-500 mt-1">Configure divisions and assign members to them.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary text-xs" onClick={openAddDivision}>
            <Plus className="h-4 w-4 mr-1" /> Add Division
          </button>
        )}
      </div>

      {divisions.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
          No project divisions have been configured yet.<br/>
          <span className="text-xs mt-1 block">Please create project divisions before assigning members.</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {divisions.map(division => (
            <div key={division._id} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                <div>
                  <h4 className="font-medium text-slate-900">{division.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{division.members.length} member{division.members.length !== 1 ? 's' : ''}</p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button className="icon-button" title="Edit division" onClick={() => { setForm({ ...division, members: division.members.map(member => member._id) }); setIsAddDivisionModalOpen(true); }}>
                      <Edit3 className="h-4 w-4 text-slate-400 hover:text-brand-600" />
                    </button>
                    <button className="icon-button" title="Delete division" onClick={() => deleteDivision(division)}>
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1">
                {division.members.length > 0 ? (
                  <div className="space-y-2">
                    {division.members.map(member => (
                      <div key={member._id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                          <span className="font-medium text-slate-700">{member.firstName} {member.lastName}</span>
                        </div>
                        {canManage && (
                          <button className="text-xs text-red-500 hover:text-red-700 transition-colors" onClick={() => saveMembers(division, division.members.filter(item => item._id !== member._id).map(item => item._id))}>
                            <UserMinus className="h-3.5 w-3.5 inline mr-1" /> Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No members assigned to this division.</p>
                )}
              </div>
              
              {canManage && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button className="w-full py-1.5 flex justify-center items-center text-xs font-medium text-brand-600 hover:bg-brand-50 rounded transition-colors" onClick={() => openAssignMembers(division)}>
                    <Plus className="h-3.5 w-3.5 inline mr-1" /> Assign Members
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAddDivisionModalOpen && form && (
        <DivisionFormModal 
          form={form} 
          setForm={setForm} 
          saving={saving} 
          divisionTypes={divisionTypes} 
          onSubmit={saveDivision} 
          onCancel={() => setIsAddDivisionModalOpen(false)} 
        />
      )}

      {isAssignMembersModalOpen && memberEditor && (
        <AssignMembersModal 
          division={memberEditor} 
          project={project} 
          onCancel={() => setIsAssignMembersModalOpen(false)} 
          onSave={saveMembers} 
        />
      )}
    </div>
  );
};

const DivisionFormModal = ({ form, setForm, saving, onSubmit, onCancel, divisionTypes = [] }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{form._id ? 'Edit Division' : 'Add Project Division'}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {!form._id && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Division</label>
              <select required className="input-field" value={form.organizationDivisionId || ''} onChange={event => {
                const selectedType = divisionTypes.find(type => type._id === event.target.value);
                setForm({ ...form, organizationDivisionId: event.target.value, name: form.name || selectedType?.name || '' });
              }}>
                <option value="">Select organization division</option>
                {divisionTypes.filter(type => type.isActive !== false).map(type => (
                  <option key={type._id} value={type._id}>{type.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Division Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter division name"
              value={form.name || ''}
              onChange={event => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
             <textarea className="input-field resize-none" rows={3} placeholder="Description (optional)" value={form.description || ''} onChange={event => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={onCancel}>Cancel</button>
            <button disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (form._id ? 'Save Division' : 'Add Division')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignMembersModal = ({ division, project, onCancel, onSave }) => {
  const [selected, setSelected] = useState(division.members.map(member => member._id));
  const [search, setSearch] = useState('');
  const existing = new Set(selected);
  
  const organizationDivisionId = division.organizationDivisionId?._id || division.organizationDivisionId;
  const eligible = (project.members || []).filter(member => 
    member.isActive !== false && 
    (!organizationDivisionId || (member.divisionCapabilities || []).some(capability => String(capability?._id || capability) === String(organizationDivisionId)))
  );

  const filtered = eligible.filter(m => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  const handleToggle = (id) => {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Assign Members to {division.name}</h2>
            <p className="text-xs text-slate-500 mt-1">Only members eligible for {division.name} are shown</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search members..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No eligible members found.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map(member => (
                <label key={member._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    checked={existing.has(member._id)} 
                    onChange={() => handleToggle(member._id)} 
                  />
                  <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-slate-50 rounded-b-xl">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={() => onSave(division, selected)}>Assign Members</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDivisions;
