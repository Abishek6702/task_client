import { useEffect, useState, useRef } from 'react';
import { Plus, UserMinus, Loader2, X, Search, ChevronDown } from 'lucide-react';
import { Avatar } from './ui';
import api from '../utils/api';
import { useToast } from './Toast';

const ProjectMembers = ({ project, canManage, onRefresh }) => {
  const { addToast } = useToast();
  const [removing, setRemoving] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  useEffect(() => {
    if (!project?._id) return;
    api.get(`/divisions?projectId=${project._id}`).then(res => setDivisions(res.data.data || [])).catch(() => {});
  }, [project?._id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setOrgUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch org users');
    }
  };

  const openAddMemberModal = () => {
    fetchUsers();
    setIsAddMemberModalOpen(true);
  };

  const handleRemove = async (memberId) => {
    setRemoving(memberId);
    try {
      await api.put(`/projects/${project._id}/members`, { action: 'remove', userId: memberId });
      addToast({ type: 'success', message: 'Member removed.' });
      onRefresh();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove member.' });
    } finally {
      setRemoving(null);
    }
  };

  const members = project.members || [];
  const memberIds = members.map(m => m._id);
  const divisionNamesByMember = divisions.reduce((result, division) => {
    division.members.forEach(member => {
      const memberId = member._id || member;
      result[memberId] = [...(result[memberId] || []), division.name];
    });
    return result;
  }, {});

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Project Members</h3>
          <p className="text-xs text-slate-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} assigned to this project</p>
        </div>
        {canManage && (
          <button 
            onClick={openAddMemberModal}
            className="btn btn-primary text-xs flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        )}
      </div>
      
      {members.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-slate-500 mb-4">No members have been added to this project yet.</p>
          {canManage && (
            <button onClick={openAddMemberModal} className="btn btn-outline text-xs">
              <Plus className="h-4 w-4 mr-2 inline" /> Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Division(s)</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                {canManage && <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {members.map(member => (
                <tr key={member._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {divisionNamesByMember[member._id]?.length > 0 ? (
                        divisionNamesByMember[member._id].map(d => (
                          <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No division assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRemove(member._id)}
                        disabled={removing === member._id}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1 rounded"
                        title="Remove member"
                      >
                        {removing === member._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAddMemberModalOpen && (
        <AddMemberModal 
          onClose={() => setIsAddMemberModalOpen(false)}
          orgUsers={orgUsers}
          existingMemberIds={memberIds}
          projectDivisions={divisions}
          project={project}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

const AddMemberModal = ({ onClose, orgUsers, existingMemberIds, projectDivisions, project, onRefresh }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDivisionNames, setSelectedDivisionNames] = useState([]);
  const [adding, setAdding] = useState(false);
  const dropdownRef = useRef(null);

  const availableUsers = orgUsers.filter(u => 
    !existingMemberIds.includes(u._id) && 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine eligible divisions for selected user
  const eligibleDivisions = selectedUser ? projectDivisions.filter(pd => {
    const orgDivisionId = pd.organizationDivisionId?._id || pd.organizationDivisionId;
    if (!orgDivisionId) return true; // If project division has no org link, anyone can join? (Based on existing logic)
    return (selectedUser.divisionCapabilities || []).some(cap => String(cap?._id || cap) === String(orgDivisionId));
  }) : [];

  const handleAdd = async () => {
    if (!selectedUser) return;
    
    setAdding(true);
    try {
      await api.put(`/projects/${project._id}/members`, { 
        action: 'add', 
        userId: selectedUser._id, 
        divisionNames: selectedDivisionNames 
      });
      addToast({ type: 'success', message: 'Member added.' });
      onRefresh();
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to add member.' });
    } finally {
      setAdding(false);
    }
  };

  const toggleDivision = (name) => {
    setSelectedDivisionNames(current => 
      current.includes(name) ? current.filter(n => n !== name) : [...current, name]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-visible flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Add Project Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-visible flex-1">
          
          {/* Member Selection Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Member *</label>
            
            {selectedUser ? (
              <div className="flex items-center justify-between border border-brand-200 bg-brand-50 rounded-lg p-2.5">
                <div className="flex items-center gap-3">
                  <Avatar name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedUser(null); setSelectedDivisionNames([]); }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between cursor-text bg-white"
                  onClick={() => setIsDropdownOpen(true)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search and select member..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full outline-none bg-transparent"
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 max-h-60 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No members found.</div>
                    ) : (
                      <ul className="p-1">
                        {availableUsers.map(u => (
                          <li 
                            key={u._id}
                            onClick={() => { setSelectedUser(u); setIsDropdownOpen(false); setSearch(''); }}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                          >
                            <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divisions Selection */}
          {selectedUser && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-medium text-slate-700 mb-2">Assign to project divisions</label>
              
              {projectDivisions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">No project divisions exist.</p>
                  <p className="text-xs opacity-90">Please create project divisions before you can assign members to them. You can still add the member to the project.</p>
                </div>
              ) : eligibleDivisions.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                  <p>This member does not have capabilities for any existing project divisions.</p>
                </div>
              ) : (
                <div className="space-y-0.5 border border-slate-200 rounded-lg overflow-hidden">
                  {projectDivisions.map(division => {
                    const isEligible = eligibleDivisions.some(ed => ed._id === division._id);
                    const isSelected = selectedDivisionNames.includes(division.name);
                    
                    return (
                      <label 
                        key={division._id} 
                        className={`flex items-center justify-between p-3 transition-colors border-b border-slate-100 last:border-b-0
                          ${!isEligible ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                            ${!isEligible ? 'border-slate-300 bg-slate-100' : 
                              isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}
                          `}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`text-sm ${!isEligible ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
                            {division.name}
                          </span>
                        </div>
                        {!isEligible && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Not Eligible</span>
                        )}
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={isSelected}
                          disabled={!isEligible}
                          onChange={() => toggleDivision(division.name)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedDivisionNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedDivisionNames.map(name => (
                    <span key={name} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-1 rounded-md border border-brand-100">
                      {name}
                      <button type="button" onClick={() => toggleDivision(name)} className="hover:text-red-500 ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex-shrink-0">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button 
            type="button" 
            className="btn btn-primary flex-1 disabled:opacity-50" 
            disabled={!selectedUser || adding} 
            onClick={handleAdd}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembers;
