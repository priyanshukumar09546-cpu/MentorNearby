// ============================================================
// api/subscription.js
// Subscription API client methods — MentorNearby All Access
// ============================================================

import client from './client';

/** Fetch the official unified subscription plan (₹199/mo) */
export const getUnifiedPlan = () =>
  client.get('/subscription/plan');

/** Create a Razorpay subscription / recurring order */
export const createSubscriptionOrder = (data = {}) =>
  client.post('/subscription/create-order', {
    planType: 'all_access_monthly',
    ...data,
  });

/** Verify payment / mandate authorization after Razorpay checkout */
export const verifySubscriptionPayment = (data) =>
  client.post('/subscription/verify', data);

/** Get current user's subscription lifecycle status, mandate info & history */
export const getSubscriptionStatus = () =>
  client.get('/subscription/status');

/** Cancel active recurring AutoPay subscription (benefits preserved till period end) */
export const cancelSubscription = (reason = '') =>
  client.post('/subscription/cancel', { reason });

export default {
  getUnifiedPlan,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionStatus,
  cancelSubscription,
};
