import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Search, MoreVertical, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api';
import { PageHeader, Card, Badge, SkeletonRow, Avatar } from '../components/ui';
import { useToast } from '../components/Toast';

const Organizations = () => {
  const { user } = useSelector(state => state.auth);
  const { addToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrgs(res.data.data);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch organizations' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (org) => {
    setUpdating(org._id);
    const newStatus = org.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/organizations/${org._id}`, { status: newStatus });
      setOrgs(prev => prev.map(o => o._id === org._id ? res.data.data : o));
      addToast({ type: 'success', message: `Organization ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Building2 className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        subtitle="Manage all tenant companies on the platform"
        icon={Building2}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><SkeletonRow /></td>
                    <td className="px-6 py-4"><SkeletonRow /></td>
                    <td className="px-6 py-4"><SkeletonRow /></td>
                    <td className="px-6 py-4"><SkeletonRow /></td>
                  </tr>
                ))
              ) : filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center font-bold text-lg">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {org._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        label={org.status} 
                        color={org.status === 'active' ? 'emerald' : 'slate'} 
                        showDot 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {new Date(org.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(org)}
                        disabled={updating === org._id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                          org.status === 'active' 
                            ? 'bg-white border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200'
                            : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                        } disabled:opacity-50`}
                      >
                        {updating === org._id ? 'Updating...' : org.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No organizations found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Organizations;
