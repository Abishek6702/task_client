import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Loader2, Building2, UserCircle } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { setCredentials } from '../store/slices/authSlice';

const Settings = () => {
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { addToast } = useToast();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    department: user?.department || '',
    designation: user?.designation || '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Org state
  const [activeTab, setActiveTab] = useState('profile');
  const [orgData, setOrgData] = useState({ name: '', domain: '', address: '', website: '' });
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [updatingOrg, setUpdatingOrg] = useState(false);

  useEffect(() => {
    if (user?.role === 'organization_admin') {
      const fetchOrg = async () => {
        setLoadingOrg(true);
        try {
          const res = await api.get('/organizations/me');
          if (res.data.data) {
            setOrgData({
              name: res.data.data.name || '',
              domain: res.data.data.domain || '',
              address: res.data.data.address || '',
              website: res.data.data.website || ''
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrg(false);
        }
      };
      fetchOrg();
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/me', profileData);
      // Update Redux state with new user info
      dispatch(setCredentials({ user: res.data.data, token }));
      addToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return addToast({ type: 'error', message: 'Passwords do not match' });
    }
    
    setUpdatingPassword(true);
    try {
      const res = await api.put('/auth/updatepassword', { currentPassword, newPassword });
      dispatch(setCredentials({ user, token: res.data.token })); // keep new token
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast({ type: 'success', message: 'Password updated successfully' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleOrgUpdate = async (e) => {
    e.preventDefault();
    setUpdatingOrg(true);
    try {
      await api.put('/organizations/me', orgData);
      addToast({ type: 'success', message: 'Organization updated successfully' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdatingOrg(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      {user?.role === 'organization_admin' && (
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UserCircle className="h-4 w-4" /> Personal
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'organization'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 className="h-4 w-4" /> Organization
            </button>
          </nav>
        </div>
      )}

      {activeTab === 'profile' && (
        <>
          <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Profile Information</h2>
          <p className="text-sm text-slate-500">Update your basic profile details.</p>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">First Name</label>
              <input 
                type="text" 
                required
                value={profileData.firstName} 
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                className="input-field" 
              />
            </div>
            <div>
              <label className="label-field">Last Name</label>
              <input 
                type="text" 
                required
                value={profileData.lastName} 
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                className="input-field" 
              />
            </div>
            
            {/* Non-editable fields */}
            <div className="col-span-2">
              <label className="label-field">Email Address <span className="text-slate-400 font-normal">(Read Only)</span></label>
              <input type="email" disabled value={user?.email} className="input-field bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div className="col-span-2">
              <label className="label-field">Role <span className="text-slate-400 font-normal">(Read Only)</span></label>
              <input type="text" disabled value={user?.role?.replace('_', ' ')} className="input-field bg-slate-50 text-slate-500 capitalize cursor-not-allowed" />
            </div>

            {/* Optional Fields */}
            <div>
              <label className="label-field">Phone</label>
              <input 
                type="text" 
                value={profileData.phone} 
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="input-field" 
              />
            </div>
            <div>
              <label className="label-field">Department</label>
              <input 
                type="text" 
                value={profileData.department} 
                onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                className="input-field" 
              />
            </div>
            <div className="col-span-2">
              <label className="label-field">Designation</label>
              <input 
                type="text" 
                value={profileData.designation} 
                onChange={(e) => setProfileData({...profileData, designation: e.target.value})}
                className="input-field" 
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500 italic">Email and Role can only be changed by your organization administrator.</p>
            <button type="submit" disabled={updatingProfile} className="btn btn-primary">
              {updatingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {updatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Change Password</h2>
          <p className="text-sm text-slate-500">Ensure your account is using a long, random password to stay secure.</p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="label-field">Current Password</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="label-field">New Password</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="label-field">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field" 
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={updatingPassword} className="btn btn-primary">
              {updatingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {updatingPassword ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
      </>
      )}

      {activeTab === 'organization' && user?.role === 'organization_admin' && (
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Organization Profile</h2>
            <p className="text-sm text-slate-500">Update company details and information.</p>
          </div>

          {loadingOrg ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : (
            <form onSubmit={handleOrgUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-field">Organization Name</label>
                  <input 
                    type="text" 
                    required
                    value={orgData.name} 
                    onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-field">Domain / Slug <span className="text-slate-400 font-normal">(Read Only)</span></label>
                  <input type="text" disabled value={orgData.domain} className="input-field bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                <div className="col-span-2">
                  <label className="label-field">Website</label>
                  <input 
                    type="url" 
                    value={orgData.website} 
                    onChange={(e) => setOrgData({...orgData, website: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="label-field">Address</label>
                  <input 
                    type="text" 
                    value={orgData.address} 
                    onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                    className="input-field" 
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end mt-6">
                <button type="submit" disabled={updatingOrg} className="btn btn-primary">
                  {updatingOrg ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {updatingOrg ? 'Saving...' : 'Save Organization'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
