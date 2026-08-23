import client from './client';

export const saveTutor = (tutorId) => client.post(`/saved-tutors/${tutorId}`);
export const removeSavedTutor = (tutorId) => client.delete(`/saved-tutors/${tutorId}`);
export const checkIsSaved = (tutorId) => client.get(`/saved-tutors/check/${tutorId}`);
export const getMySavedTutors = () => client.get(`/saved-tutors`);

