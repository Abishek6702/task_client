import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgotpassword', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Reset password</h2>
        <p className="text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p>
      </div>

      {success ? (
        <div className="bg-brand-50 border border-brand-100 p-6 rounded-lg text-center space-y-4">
          <CheckCircle2 className="h-10 w-10 text-brand-600 mx-auto" />
          <div>
            <h3 className="text-brand-900 font-semibold">Check your email</h3>
            <p className="text-sm text-brand-700 mt-1">
              We've sent a password reset link to <span className="font-semibold">{email}</span>.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary w-full justify-center">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label-field">Work Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@company.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="btn btn-primary w-full justify-center text-base py-2.5"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
