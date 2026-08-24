import axios from 'axios';

const PRODUCTION_API_URL = 'https://mentornearby-2.onrender.com/api';

const getBaseUrl = () => {
  // Support Vite, Next.js, and standard environment variables
  let envUrl = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      envUrl = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.NEXT_PUBLIC_BASE_URL;
    }
  } catch (_) {}

  if (!envUrl && typeof process !== 'undefined' && process.env) {
    envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.VITE_API_URL || process.env.REACT_APP_API_URL;
  }

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // If the frontend is hosted directly on the Render backend server
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('mentornearby-2.onrender.com')) {
      return '/api';
    }
  }

  // Default target for production www.mentornearby.com, Vercel, and dev fallbacks
  return PRODUCTION_API_URL;
};

const client = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Request interceptor: attach Bearer token if stored locally
client.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('mn_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('mn_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Response interceptor: capture token on auth responses & handle 401
client.interceptors.response.use(
  (response) => {
    // Automatically preserve token and user locally when returned
    const token = response.data?.token || response.data?.data?.token;
    const user = response.data?.user || response.data?.data?.user;
    if (token) {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('mn_token', token);
      } catch (_) {}
    }
    if (user) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role) {
          localStorage.setItem('role', user.role.toString().toLowerCase());
        }
      } catch (_) {}
    }
    return response;
  },
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/login');
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    if (error.response?.status === 401 && !isAuthCheck) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('mn_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
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

