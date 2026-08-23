import client from './client';

export const createReview = (tutorId, data) => client.post(`/reviews/${tutorId}`, data);
export const getTutorReviews = (tutorId, params) => client.get(`/reviews/${tutorId}`, { params });
export const deleteReview = (reviewId) => client.delete(`/reviews/${reviewId}`);
export const reportReview = (reviewId) => client.post(`/reviews/${reviewId}/report`);

