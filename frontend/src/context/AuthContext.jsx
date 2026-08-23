import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, googleAuth as apiGoogleAuth } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await getMe();
      const payload = res.data?.data;
      if (payload && payload.user) {
        const userObj = { ...payload.user };
        if (payload.tutorProfile) {
          userObj.tutorProfile = payload.tutorProfile;
        }
        if (userObj.role) {
          userObj.role = userObj.role.toString().trim().toUpperCase();
        }
        setUser(userObj);
        return userObj;
      } else if (payload) {
        const userObj = { ...payload };
        if (userObj.role) {
          userObj.role = userObj.role.toString().trim().toUpperCase();
        }
        setUser(userObj);
        return userObj;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data) => {
    const res = await apiLogin(data);
    const refreshedUser = await refreshUser();
    return { ...res, user: refreshedUser };
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    const refreshedUser = await refreshUser();
    return { ...res, user: refreshedUser };
  };

  const googleLogin = async (data) => {
    const res = await apiGoogleAuth(data);
    const refreshedUser = await refreshUser();
    return { ...res, user: refreshedUser };
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
