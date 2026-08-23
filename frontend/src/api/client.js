import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  // In production (e.g. Vercel deployment), default to relative '/api'
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const client = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Request interceptor: attach Bearer token if stored locally
client.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('mn_token') || sessionStorage.getItem('mn_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Response interceptor: capture token on auth responses & handle 401
client.interceptors.response.use(
  (response) => {
    // Automatically preserve token locally when returned
    const token = response.data?.data?.token || response.data?.token;
    if (token) {
      try {
        localStorage.setItem('mn_token', token);
      } catch (_) {}
    }
    return response;
  },
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/login');
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    if (error.response?.status === 401 && !isAuthCheck) {
      try {
        localStorage.removeItem('mn_token');
      } catch (_) {}
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/tutor/dashboard') || pathname.startsWith('/settings')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

