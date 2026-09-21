import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    organizationCode: '',
    organizationEmail: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      dispatch(setCredentials({ user: response.data.user, token: response.data.token }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="companyName" className="label-field">Company Name</label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          value={formData.companyName}
          onChange={handleChange}
          className="input-field"
          placeholder="Acme Corp"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="organizationCode" className="label-field">Organization Code</label>
          <input id="organizationCode" name="organizationCode" required maxLength="20" value={formData.organizationCode} onChange={handleChange} className="input-field" placeholder="ACME" />
        </div>
        <div>
          <label htmlFor="organizationEmail" className="label-field">Organization Email</label>
          <input id="organizationEmail" name="organizationEmail" type="email" required value={formData.organizationEmail} onChange={handleChange} className="input-field" placeholder="admin@company.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="label-field">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="input-field"
            placeholder="John"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="label-field">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="input-field"
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label-field">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="input-field"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label-field">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength="6"
          value={formData.password}
          onChange={handleChange}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary flex justify-center py-2.5 text-sm"
        >
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </div>

      <div className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
          Sign in
        </Link>
      </div>
    </form>
  );
};

export default Register;
