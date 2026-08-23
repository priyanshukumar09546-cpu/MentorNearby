import client from './client';

export const getUserProfile = () => client.get('/users/profile');
export const updateUserProfile = (data) => client.put('/users/profile', data);
export const updateStudentProfile = (data) => client.put('/users/student-profile', data);
export const deleteUserAccount = () => client.delete('/users/account');

export const getNotifications = (params) => client.get('/users/notifications', { params });
export const markNotificationRead = (id) => client.put(`/users/notifications/${id}/read`);
export const markAllNotificationsRead = () => client.put('/users/notifications/read-all');
