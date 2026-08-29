// ============================================================
// api/client.js
// MentorNearby Axios Client (Dual Auth: Cookies + Bearer Token Fallback)
// Ensures 100% auth reliability on iPhone Safari, Vercel & Mobile Browsers
// ============================================================

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mentornearby.com';
console.log('Using API URL:', API_URL);

const baseURL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 25000,
  withCredentials: true,
});

axios.defaults.withCredentials = true;

// Request Interceptor: Attach Authorization Bearer Token (iPhone Safari Fallback) + withCredentials
client.interceptors.request.use((config) => {
  config.withCredentials = true;

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('mn_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Capture token and user role from JSON response
client.interceptors.response.use(
  (response) => {
    const returnedToken = response.data?.token || response.data?.data?.token;
    if (returnedToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', returnedToken);
        localStorage.setItem('mn_token', returnedToken);
      } catch (_) {}
    }

    const user = response.data?.user || response.data?.data?.user;
    if (user && user.role) {
      try {
        const normRole = user.role.toString().toUpperCase();
        Cookies.set('role', normRole, { expires: 7, path: '/', secure: true, sameSite: 'none' });
      } catch (_) {}
    }
    return response;
  },
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/login');
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    if (error.response?.status === 401 && !isAuthCheck) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('mn_token');
      }
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/tutor/dashboard') ||
        pathname.startsWith('/student/dashboard') ||
        pathname.startsWith('/settings')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = client;
export default client;
