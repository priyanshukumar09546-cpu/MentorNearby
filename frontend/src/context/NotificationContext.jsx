// ============================================================
// context/NotificationContext.jsx
// MentorNearby Global Notification State & Real-Time Polling
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../api/notifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pollingRef = useRef(null);

  // Fetch unread count from server
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getUnreadNotificationCount();
      const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch (err) {
      // Quiet fail on network hiccups
    }
  }, [isAuthenticated]);

  // Fetch recent notifications for dropdown preview
  const fetchRecentNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setRecentNotifications([]);
      return;
    }
    try {
      setLoading(true);
      const res = await getUserNotifications({ limit: 6, tab: 'all' });
      const list = res?.data?.notifications || res?.notifications || [];
      setRecentNotifications(list);
      const count = res?.data?.unreadCount ?? res?.unreadCount;
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      setRecentNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await apiMarkAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await apiMarkAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  // Delete notification
  const removeNotification = async (id) => {
    try {
      const target = recentNotifications.find((n) => n._id === id);
      setRecentNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      await apiDeleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Toggle Dropdown
  const toggleDropdown = () => {
    setDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchRecentNotifications();
      }
      return next;
    });
  };

  // Close Dropdown
  const closeDropdown = () => setDropdownOpen(false);

  // Initial fetch and 20s polling when user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchRecentNotifications();

      // Poll every 20 seconds for instant notification delivery
      pollingRef.current = setInterval(() => {
        fetchUnreadCount();
      }, 20000);

      // Listen for window focus to update immediately
      const handleFocus = () => fetchUnreadCount();
      window.addEventListener('focus', handleFocus);

      // Custom event listener for instant trigger from any page
      const handleRefreshEvent = () => {
        fetchUnreadCount();
        fetchRecentNotifications();
      };
      window.addEventListener('notification:refresh', handleRefreshEvent);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('notification:refresh', handleRefreshEvent);
      };
    } else {
      setUnreadCount(0);
      setRecentNotifications([]);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchRecentNotifications]);

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    dropdownOpen,
    setDropdownOpen,
    toggleDropdown,
    closeDropdown,
    fetchUnreadCount,
    fetchRecentNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
