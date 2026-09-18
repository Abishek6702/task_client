import { useState } from 'react';
import { Plus, UserMinus, Loader2 } from 'lucide-react';
import { Avatar } from './ui';
import api from '../utils/api';
import { useToast } from './Toast';

const ProjectMembers = ({ project, canManage, onRefresh }) => {
  const { addToast } = useToast();
  const [removing, setRemoving] = useState(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [orgUsers, setOrgUsers] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setOrgUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch org users');
    }
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

  const handleAdd = async (userId) => {
    setAdding(true);
    try {
      await api.put(`/projects/${project._id}/members`, { action: 'add', userId });
      addToast({ type: 'success', message: 'Member added.' });
      setSearch('');
      setShowAddMenu(false);
      onRefresh();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to add member.' });
    } finally {
      setAdding(false);
    }
  };

  const members = project.members || [];
  const memberIds = members.map(m => m._id);
  
  const filteredUsers = orgUsers.filter(u => 
    !memberIds.includes(u._id) && 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{members.length} Members</h3>
        {canManage && (
          <div className="relative">
            <button 
              onClick={() => {
                if (!showAddMenu) fetchUsers();
                setShowAddMenu(!showAddMenu);
              }}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Member
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-lg rounded-md z-10">
                <div className="p-2 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto p-1">
                  {filteredUsers.length === 0 ? (
                    <li className="text-xs text-slate-500 text-center py-4">No users found</li>
                  ) : (
                    filteredUsers.map(u => (
                      <li 
                        key={u._id}
                        onClick={() => handleAdd(u._id)}
                        className="text-sm p-2 hover:bg-slate-50 cursor-pointer rounded flex items-center gap-2"
                      >
                        <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                        <div className="truncate">
                          <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      {members.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-400">No members in this project.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map(member => (
            <li key={member._id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={`${member.firstName} ${member.lastName}`} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-slate-500 capitalize">{member.role?.replace('_', ' ')} · {member.department || 'No department'}</p>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRemove(member._id)}
                  disabled={removing === member._id}
                  className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  {removing === member._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectMembers;
