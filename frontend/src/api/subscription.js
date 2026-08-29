// ============================================================
// api/subscription.js
// Subscription API client methods
// ============================================================

import client from './client';

/** Create a Razorpay order for subscription */
export const createSubscriptionOrder = (planType) =>
  client.post('/subscription/create-order', { planType });

/** Verify payment after Razorpay success callback */
export const verifySubscriptionPayment = (data) =>
  client.post('/subscription/verify', data);

/** Get current user's subscription & chat limit status */
export const getSubscriptionStatus = () =>
  client.get('/subscription/status');
