import client from './client';

// All contact unlock API calls
// Backend routes are at /api/contact-unlocks/...

export const checkUnlockEligibility = (tutorId) =>
  client.get(`/contact-unlocks/check/${tutorId}`);

export const createFreeUnlock = (tutorId) =>
  client.post(`/contact-unlocks/free/${tutorId}`);

export const createPaymentOrder = (data) =>
  client.post(`/contact-unlocks/create-order`, data);

// SECURITY: This sends ALL payment IDs to backend for server-side signature verification
// Never skip this step — backend must verify before contact is revealed
export const verifyPaymentAndUnlock = (data) =>
  client.post(`/contact-unlocks/verify-payment`, data);

export const getMyUnlocks = () =>
  client.get(`/contact-unlocks/my-unlocks`);
