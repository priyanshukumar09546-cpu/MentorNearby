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
          parsed.role = parsed.role.toString().trim().toUpperCase();
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
        const userObj = { ...payload };
        if (res.data?.data?.tutorProfile) {
          userObj.tutorProfile = res.data.data.tutorProfile;
        }
        if (userObj.role) {
          userObj.role = userObj.role.toString().trim().toUpperCase();
        }
        setUser(userObj);
        try {
          localStorage.setItem('user', JSON.stringify(userObj));
          localStorage.setItem('role', userObj.role.toLowerCase());
        } catch (_) {}
        return userObj;
      } else {
        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Session verification failed:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 401) {
        setUser(null);
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('mn_token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
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
    let email, password, role;
    if (typeof emailOrData === 'object' && emailOrData !== null) {
      email = emailOrData.email;
      password = emailOrData.password;
      role = emailOrData.role;
    } else {
      email = emailOrData;
      password = maybePassword;
    }

    try {
      setIsLoading(true);
      const res = await apiLogin({ email, password, role });
      const token = res.data?.token || res.data?.data?.token;
      const userPayload = res.data?.user || res.data?.data?.user;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('mn_token', token);
      }
      if (userPayload) {
        const rawRole = (userPayload.role || 'STUDENT').toString().trim().toLowerCase();
        const userObj = { ...userPayload, role: rawRole.toUpperCase() };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('role', rawRole);

        if (rawRole === 'student' || rawRole === 'parent') {
          window.location.href = '/student/dashboard';
        } else if (rawRole === 'tutor') {
          window.location.href = '/tutor/dashboard';
        } else if (rawRole === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/student/dashboard';
        }

        return { ...res, user: userObj, token };
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    try {
      setIsLoading(true);
      const res = await apiRegister(data);
      const token = res.data?.token || res.data?.data?.token;
      const userPayload = res.data?.user || res.data?.data?.user;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('mn_token', token);
      }
      if (userPayload) {
        const rawRole = (userPayload.role || data.role || 'STUDENT').toString().trim().toLowerCase();
        const userObj = { ...userPayload, role: rawRole.toUpperCase() };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('role', rawRole);

        if (rawRole === 'student' || rawRole === 'parent') {
          window.location.href = '/student/dashboard';
        } else if (rawRole === 'tutor') {
          window.location.href = '/tutor/dashboard';
        } else if (rawRole === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/student/dashboard';
        }

        return { ...res, user: userObj, token };
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (data) => {
    try {
      setIsLoading(true);
      const res = await apiGoogleAuth(data);
      const token = res.data?.token || res.data?.data?.token;
      const userPayload = res.data?.user || res.data?.data?.user;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('mn_token', token);
      }
      if (userPayload) {
        const rawRole = (userPayload.role || 'STUDENT').toString().trim().toLowerCase();
        const userObj = { ...userPayload, role: rawRole.toUpperCase() };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('role', rawRole);

        if (rawRole === 'student' || rawRole === 'parent') {
          window.location.href = '/student/dashboard';
        } else if (rawRole === 'tutor') {
          window.location.href = '/tutor/dashboard';
        } else if (rawRole === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/student/dashboard';
        }

        return { ...res, user: userObj, token };
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    finally {
      setUser(null);
      setIsLoading(false);
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('mn_token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
