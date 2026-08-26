// ============================================================
// components/common/ProtectedRoute.jsx
// Production-Ready Route Guard & Role Verification
// Pure Cookie-Based Authentication
// ============================================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Normalizes user role string to standard lowercase ('student' | 'tutor' | 'admin')
 */
export const normalizeRole = (role) => {
  if (!role) return '';
  const r = role.toString().trim().toLowerCase();
  if (r === 'student' || r === 'parent') return 'student';
  if (r === 'tutor' || r === 'teacher' || r === 'educator') return 'tutor';
  if (r === 'admin' || r === 'superadmin' || r === 'super_admin') return 'admin';
  return r;
};

/**
 * Safely extracts normalized lowercase role from user object
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
  if (norm === 'admin') return '/admin/dashboard';
  if (norm === 'tutor') return '/tutor/dashboard';
  if (norm === 'student' || norm === 'parent') return '/student/dashboard';
  return '/login';
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  const isChecking = loading !== undefined ? loading : isLoading;

  // 1. While session verification is in progress, show clean loader — DO NOT REDIRECT
  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith('/admin');

  // 2. If unauthenticated, redirect to login page
  if (!isAuthenticated || !user) {
    if (isAdminPath) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role mismatch check -> redirect to user's assigned dashboard
  const userRole = extractUserRole(user);
  if (roles && Array.isArray(roles) && roles.length > 0) {
    const normalizedAllowedRoles = roles.map(r => normalizeRole(r));
    if (!normalizedAllowedRoles.includes(userRole)) {
      if (isAdminPath && userRole !== 'admin') {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
      }
      const targetDashboard = getRoleDashboard(userRole);
      return <Navigate to={targetDashboard} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
