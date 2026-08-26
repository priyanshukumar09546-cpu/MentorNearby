// ============================================================
// api/client.js
// MentorNearby Axios HTTP Client
// Enforces withCredentials: true for cross-domain httpOnly cookies
// ============================================================

import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './config';

const client = axios.create({
  baseURL: API_BASE_URL || 'https://mentornearby-2.onrender.com/api',
  withCredentials: true,
});

axios.defaults.withCredentials = true;

// Request interceptor: ensure credentials mode enabled on all requests
client.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

// Response interceptor: capture role cookie if present and handle 401 unauthenticated
client.interceptors.response.use(
  (response) => {
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
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/tutor/dashboard') ||
        pathname.startsWith('/settings')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
