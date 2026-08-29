import client from './client';

export const getTutorProfile = (id) =>
  client.get(`/tutors/${id}?_t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });

export const getTutors = (params) => client.get('/search/tutors', { params });
export const updateTutorProfile = (data) => client.put('/tutors/profile', data);
export const uploadProfilePhoto = (formData) => client.post('/tutors/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadIntroVideo = (formData) => client.post('/tutors/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getTutorDashboard = () =>
  client.get(`/tutors/dashboard?_t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });
export const getFeaturedTutors = () =>
  client.get(`/tutors/featured?_t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });
export const updateAvailability = (data) => client.put('/tutors/availability', data);
export const updateSafetyPreferences = (data) => client.put('/tutors/safety', data);
export const toggleProfileVisibility = () => client.patch('/tutors/visibility');
