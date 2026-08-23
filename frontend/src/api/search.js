import client from './client';

export const searchTutors = (params) => client.get('/search/tutors', { params });
export const getPublicStats = () => client.get('/search/stats');

