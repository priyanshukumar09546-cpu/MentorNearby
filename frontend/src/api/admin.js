import client from './client';

export const adminLogin = (data) => client.post('/auth/admin/login', data);
export const getDashboardStats = (params) => client.get('/admin/stats', { params });
export const getRecentUsers = (params) => client.get('/admin/users/recent', { params });
export const getRecentActivities = (params) => client.get('/admin/activities', { params });
export const getUserGrowth = (params) => client.get('/admin/user-growth', { params });
export const getUserDistribution = () => client.get('/admin/user-distribution');
export const getUsers = (params) => client.get('/admin/users', { params });
export const getUserDetail = (id) => client.get(`/admin/users/${id}`);
export const getKycList = (params) => client.get('/admin/kyc', { params });
export const getKycDetail = (id) => client.get(`/admin/kyc/${id}`);
export const updateKycStatus = (id, data) => client.put(`/admin/kyc/${id}`, data);
export const getReports = (params) => client.get('/admin/reports', { params });
export const updateReportStatus = (id, data) => client.put(`/admin/reports/${id}/status`, data);
export const getRiskFlags = (params) => client.get('/admin/risk-flags', { params });
export const getAdminConfig = () => client.get('/admin/config');
export const updateAdminConfig = (key, value) => client.put(`/admin/config/${key}`, { value });
export const getTransactions = (params) => client.get('/admin/transactions', { params });
export const suspendUser = (id, data) => client.post(`/admin/users/${id}/suspend`, data);
export const unsuspendUser = (id) => client.post(`/admin/users/${id}/unsuspend`);

// Specialized Tutor Management APIs
export const getAdminTutors = (params) => client.get('/admin/tutors', { params });
export const getAdminTutorDetail = (id) => client.get(`/admin/tutors/${id}`);
export const approveTutor = (id) => client.put(`/admin/tutors/${id}/approve`);
export const unapproveTutor = (id, data) => client.put(`/admin/tutors/${id}/unapprove`, data);
export const rejectTutor = (id, data) => client.put(`/admin/tutors/${id}/reject`, data);
export const suspendTutor = (id, data) => client.post(`/admin/tutors/${id}/suspend`, data);
export const reactivateTutor = (id) => client.post(`/admin/tutors/${id}/reactivate`);
export const deleteTutorPermanently = (id, data) => client.delete(`/admin/tutors/${id}`, { data });

// Specialized Student Management APIs
export const getAdminStudents = (params) => client.get('/admin/students', { params });
export const getAdminStudentDetail = (id) => client.get(`/admin/students/${id}`);
export const approveStudent = (id) => client.put(`/admin/students/${id}/approve`);
export const unapproveStudent = (id, data) => client.put(`/admin/students/${id}/unapprove`, data);
export const suspendStudent = (id, data) => client.post(`/admin/students/${id}/suspend`, data);
export const reactivateStudent = (id) => client.post(`/admin/students/${id}/reactivate`);
export const deleteStudentPermanently = (id, data) => client.delete(`/admin/students/${id}`, { data });
