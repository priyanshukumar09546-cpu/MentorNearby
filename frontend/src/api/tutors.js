import client from './client';

export const getTutorProfile = (id) => client.get(`/tutors/${id}`);
export const getTutors = (params) => client.get('/search/tutors', { params });
export const updateTutorProfile = (data) => client.put('/tutors/profile', data);
export const uploadProfilePhoto = (formData) => client.post('/tutors/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadIntroVideo = (formData) => client.post('/tutors/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getTutorDashboard = () => client.get('/tutors/dashboard');
export const updateAvailability = (data) => client.put('/tutors/availability', data);
export const updateSafetyPreferences = (data) => client.put('/tutors/safety', data);
export const toggleProfileVisibility = () => client.patch('/tutors/visibility');
