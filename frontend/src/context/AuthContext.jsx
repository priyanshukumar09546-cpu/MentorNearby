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
  const [loading, setLoading] = useState(true);

  // Pure /api/auth/me session verifier using withCredentials cookies
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] checkAuth verifying session via /api/auth/me...');
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
      console.warn('[AuthContext] checkAuth status:', error.response?.status);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      setLoading(true);
      const res = await apiLogin({ email, password, role: roleReq });
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Login failed - no user returned');
      }

      const role = (returnedUser.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      return { ...res, user: cleanUser, role };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setLoading(true);
      const res = await apiRegister(data);
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Registration failed - no user returned');
      }

      const role = (returnedUser.role || data.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      return { ...res, user: cleanUser, role };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (data) => {
    try {
      setLoading(true);
      const res = await apiGoogleAuth(data);
      const returnedUser = res.data?.user || res.data?.data?.user;

      if (!returnedUser) {
        throw new Error(res.data?.message || 'Google login failed - no user returned');
      }

      const role = (returnedUser.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...returnedUser, role };
      setUser(cleanUser);
      Cookies.set('role', role.toUpperCase(), { expires: 7, path: '/', secure: true, sameSite: 'none' });

      return { ...res, user: cleanUser, role };
    } finally {
      setLoading(false);
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
    setLoading(false);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading: loading,
        isAuthenticated: !!user,
        checkAuth,
        refreshUser: checkAuth,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
