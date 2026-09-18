import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setError('');
    setLoading(true);

    try {
      await api.put(`/auth/resetpassword/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Set new password</h2>
        <p className="text-slate-500 mt-2">Your new password must be at least 6 characters.</p>
      </div>

      {success ? (
        <div className="bg-brand-50 border border-brand-100 p-6 rounded-lg text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-brand-600 mx-auto" />
          <div>
            <h3 className="text-brand-900 font-semibold">Password reset successfully</h3>
            <p className="text-sm text-brand-700 mt-1">Redirecting you to login...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label-field">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label-field">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="btn btn-primary w-full justify-center text-base py-2.5"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Cancel and return to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
