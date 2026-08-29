// ============================================================
// context/NotificationContext.jsx
// Safe Placeholder Context - No active polling to prevent runtime crashes
// ============================================================

import React, { createContext, useContext } from 'react';

const NotificationContext = createContext({
  unreadCount: 0,
  recentNotifications: [],
  notifications: [],
  loading: false,
  dropdownOpen: false,
  setDropdownOpen: () => {},
  toggleDropdown: () => {},
  closeDropdown: () => {},
  fetchUnreadCount: () => {},
  fetchRecentNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
});

export const NotificationProvider = ({ children }) => {
  const value = {
    unreadCount: 0,
    recentNotifications: [],
    notifications: [],
    loading: false,
    dropdownOpen: false,
    setDropdownOpen: () => {},
    toggleDropdown: () => {},
    closeDropdown: () => {},
    fetchUnreadCount: () => {},
    fetchRecentNotifications: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {},
    removeNotification: () => {},
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  return (
    context || {
      unreadCount: 0,
      recentNotifications: [],
      notifications: [],
      loading: false,
      dropdownOpen: false,
      setDropdownOpen: () => {},
      toggleDropdown: () => {},
      closeDropdown: () => {},
      fetchUnreadCount: () => {},
      fetchRecentNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
    }
  );
};
