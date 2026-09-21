import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
// NOTE: We do NOT use window.location.href here — that causes a hard page reload.
// Instead we dispatch logout() and let the React Router <Navigate> in App.jsx handle the redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only auto-logout if we have a token stored (not during the login request itself)
      const token = store.getState().auth.token;
      if (token) {
        store.dispatch(logout());
        // React Router will redirect to /login automatically because isAuthenticated becomes false
      }
    }
    return Promise.reject(error);
  }
);

export default api;
