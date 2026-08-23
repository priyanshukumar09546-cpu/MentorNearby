// ============================================================
// api/notifications.js
// MentorNearby Notification API Client (User + Admin)
// ============================================================

import client from './client';

// ------------------------------------------------------------
// USER NOTIFICATION APIS
// ------------------------------------------------------------

export const getUserNotifications = async (params = {}) => {
  const response = await client.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await client.get('/notifications/unread-count');
  return response.data;
};

export const getNotificationById = async (id) => {
  const response = await client.get(`/notifications/${id}`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await client.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await client.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await client.delete(`/notifications/${id}`);
  return response.data;
};

export const clearReadNotifications = async () => {
  const response = await client.delete('/notifications/clear-read');
  return response.data;
};

// ------------------------------------------------------------
// ADMIN NOTIFICATION APIS
// ------------------------------------------------------------

export const getAdminNotificationStats = async () => {
  const response = await client.get('/notifications/admin/stats');
  return response.data;
};

export const getAdminNotificationHistory = async (params = {}) => {
  const response = await client.get('/notifications/admin/history', { params });
  return response.data;
};

export const createAdminNotification = async (data) => {
  const response = await client.post('/notifications/admin/create', data);
  return response.data;
};

export const resendAdminNotification = async (id) => {
  const response = await client.post(`/notifications/admin/resend/${id}`);
  return response.data;
};

export const deleteAdminNotification = async (id) => {
  const response = await client.delete(`/notifications/admin/${id}`);
  return response.data;
};
