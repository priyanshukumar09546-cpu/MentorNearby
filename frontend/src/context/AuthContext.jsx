// ============================================================
// context/AuthContext.jsx
// MentorNearby — 100% httpOnly Cookie Auth Context
// Pure cookie-driven authentication via /api/auth/me
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, googleAuth as apiGoogleAuth } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pure /api/auth/me session verifier using withCredentials cookies
  const refreshUser = useCallback(async () => {
    try {
      console.log('[AuthContext] Verifying httpOnly cookie session with /api/auth/me...');
      const res = await getMe();
      const payload = res.data?.user || res.data?.data?.user || res.data?.data;

      if (payload && (payload._id || payload.id || payload.email)) {
        const normalizedRole = (payload.role || 'STUDENT').toString().trim().toLowerCase();
        const cleanUser = { ...payload, role: normalizedRole };
        if (res.data?.data?.tutorProfile) {
          cleanUser.tutorProfile = res.data.data.tutorProfile;
        }
        setUser(cleanUser);
        Cookies.set('role', normalizedRole.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });
        return cleanUser;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.warn('[AuthContext] Cookie verification status:', error.response?.status);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (emailOrData, maybePassword) => {
    let email, password, roleReq;
    if (typeof emailOrData === 'object' && emailOrData !== null) {
      email = emailOrData.email;
      password = emailOrData.password;
      roleReq = emailOrData.role;
    } else {
      email = emailOrData;
      password = maybePassword;
    }

    try {
      setIsLoading(true);
      const res = await apiLogin({ email, password, role: roleReq });
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Login failed - no user returned');
      }

      const role = (returnedUser.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      // Role-based navigation
      if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setIsLoading(true);
      const res = await apiRegister(data);
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Registration failed - no user returned');
      }

      const role = (returnedUser.role || data.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (data) => {
    try {
      setIsLoading(true);
      const res = await apiGoogleAuth(data);
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Google login failed - no user returned');
      }

      const role = (returnedUser.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    try {
      Cookies.remove('token', { path: '/' });
      Cookies.remove('jwt', { path: '/' });
      Cookies.remove('role', { path: '/' });
    } catch (_) {}
    setUser(null);
    setIsLoading(false);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
