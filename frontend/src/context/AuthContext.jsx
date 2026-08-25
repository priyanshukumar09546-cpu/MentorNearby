import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, googleAuth as apiGoogleAuth } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token') || localStorage.getItem('mn_token');
      if (savedUser && token) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role) {
          parsed.role = parsed.role.toString().trim().toLowerCase();
        }
        return parsed;
      }
    } catch (_) {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('mn_token');
    return !!token;
  });

  const refreshUser = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('mn_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      console.log('[AuthContext] Verifying session with /api/auth/me...');
      const res = await getMe();
      console.log('[AuthContext] /api/auth/me response:', res.status, res.data);

      const payload = res.data?.user || res.data?.data?.user || res.data?.data;
      if (payload && (payload._id || payload.id || payload.email)) {
        const normalizedRole = (payload.role || 'student').toString().trim().toLowerCase();
        const cleanUser = { ...payload, role: normalizedRole };
        if (res.data?.data?.tutorProfile) {
          cleanUser.tutorProfile = res.data.data.tutorProfile;
        }
        setUser(cleanUser);
        try {
          localStorage.setItem('user', JSON.stringify(cleanUser));
          localStorage.setItem('role', normalizedRole);
        } catch (_) {}
        return cleanUser;
      } else {
        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Session verification failed:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 401) {
        setUser(null);
        try {
          localStorage.clear();
        } catch (_) {}
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (emailOrData, maybePassword) => {
    localStorage.clear(); // CLEAR OLD STALE TOKENS/ROLES FIRST

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
      const user = res.data?.user || res.data?.data?.user;
      const token = res.data?.token || res.data?.data?.token;

      if (!user) {
        throw new Error(res.data?.message || 'Login failed - no user returned');
      }

      const role = (user.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...user, role: role };

      localStorage.setItem('token', token || '');
      localStorage.setItem('mn_token', token || '');
      localStorage.setItem('user', JSON.stringify(cleanUser));
      localStorage.setItem('role', role);

      console.log("LOGIN SUCCESS ROLE:", role);

      setUser(cleanUser);

      if (role === 'student' || role === 'parent') {
        window.location.replace('/student/dashboard');
      } else if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser, token };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    localStorage.clear(); // CLEAR OLD STALE TOKENS/ROLES FIRST

    try {
      setIsLoading(true);
      const res = await apiRegister(data);
      const user = res.data?.user || res.data?.data?.user;
      const token = res.data?.token || res.data?.data?.token;

      if (!user) {
        throw new Error(res.data?.message || 'Registration failed - no user returned');
      }

      const role = (user.role || data.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...user, role: role };

      localStorage.setItem('token', token || '');
      localStorage.setItem('mn_token', token || '');
      localStorage.setItem('user', JSON.stringify(cleanUser));
      localStorage.setItem('role', role);

      console.log("REGISTER SUCCESS ROLE:", role);

      setUser(cleanUser);

      if (role === 'student' || role === 'parent') {
        window.location.replace('/student/dashboard');
      } else if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser, token };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (data) => {
    localStorage.clear(); // CLEAR OLD STALE TOKENS/ROLES FIRST

    try {
      setIsLoading(true);
      const res = await apiGoogleAuth(data);
      const user = res.data?.user || res.data?.data?.user;
      const token = res.data?.token || res.data?.data?.token;

      if (!user) {
        throw new Error(res.data?.message || 'Google login failed - no user returned');
      }

      const role = (user.role || 'student').toString().toLowerCase().trim();
      const cleanUser = { ...user, role: role };

      localStorage.setItem('token', token || '');
      localStorage.setItem('mn_token', token || '');
      localStorage.setItem('user', JSON.stringify(cleanUser));
      localStorage.setItem('role', role);

      console.log("GOOGLE LOGIN SUCCESS ROLE:", role);

      setUser(cleanUser);

      if (role === 'student' || role === 'parent') {
        window.location.replace('/student/dashboard');
      } else if (role === 'tutor') {
        window.location.replace('/tutor/dashboard');
      } else if (role === 'admin') {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/student/dashboard');
      }

      return { ...res, user: cleanUser, token };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      apiLogout().catch(() => {});
    } catch (_) {}
    localStorage.clear();
    setUser(null);
    setIsLoading(false);
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
