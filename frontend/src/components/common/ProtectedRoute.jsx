// ============================================================
// components/common/ProtectedRoute.jsx
// Production-Ready Route Protection & Role Verification Guard
// Redirects Unauthenticated Users to /admin or /login
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Normalizes user role string to uppercase standard ('STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN')
 */
export const normalizeRole = (role) => {
  if (!role) return '';
  const r = role.toString().trim().toUpperCase();
  if (r === 'STUDENT' || r === 'PARENT') return r;
  if (r === 'TUTOR' || r === 'TEACHER' || r === 'EDUCATOR') return 'TUTOR';
  if (r === 'ADMIN' || r === 'SUPERADMIN' || r === 'SUPER_ADMIN') return 'ADMIN';
  return r;
};

/**
 * Safely extracts normalized role from any user payload structure
 */
export const extractUserRole = (userObj) => {
  if (!userObj) return '';
  const candidate = 
    userObj.role || 
    userObj.user?.role || 
    userObj.data?.user?.role || 
    userObj.data?.role || 
    userObj.userType || 
    userObj.accountType ||
    '';
  return normalizeRole(candidate);
};

/**
 * Returns the designated home dashboard path for a given role
 */
export const getRoleDashboard = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'ADMIN') return '/admin/dashboard';
  if (norm === 'TUTOR') return '/tutor/dashboard';
  if (norm === 'STUDENT' || norm === 'PARENT') return '/dashboard';
  return '/login';
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');

  // While checking session on initial load, show clean loader — do NOT flash dashboard
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#FED7AA', borderTopColor: '#FF6B00' }}></div>
      </div>
    );
  }

  const localRole = (localStorage.getItem('role') || localStorage.getItem('mn_role') || '').toUpperCase();
  const localToken = localStorage.getItem('mn_token') || localStorage.getItem('token');

  // If not authenticated or no user object in state
  if (!isAuthenticated && !user && !(isAdminPath && localRole === 'ADMIN' && localToken)) {
    if (isAdminPath) {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Extract normalized role
  const userRole = extractUserRole(user) || (localRole === 'ADMIN' ? 'ADMIN' : '');

  // If specific roles are required (e.g. ['ADMIN'])
  if (roles && Array.isArray(roles) && roles.length > 0) {
    const normalizedAllowedRoles = roles.map(r => normalizeRole(r));
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      // If user is trying to access /admin/* but does not have ADMIN role
      if (isAdminPath) {
        return <Navigate to="/admin" state={{ from: location }} replace />;
      }
      // Redirect student/tutor to their respective dashboard
      const targetDashboard = getRoleDashboard(userRole);
      return <Navigate to={targetDashboard} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
