// ============================================================
// api/studyResources.js
// Client API for Study Resources, Free Online Reading, Paid PDF Downloads,
// Razorpay Payments, Print Providers, and Admin Controls
// ============================================================

import client from './client';

// Public / Student Catalog APIs
export const fetchStudyClasses = async () => {
  const response = await client.get('/study-resources/classes');
  return response.data;
};

export const fetchSubjectStudyResources = async (classLevel, subject) => {
  const response = await client.get(`/study-resources/subject/${classLevel}/${subject}`);
  return response.data;
};

export const searchStudyResources = async (params = {}) => {
  const response = await client.get('/study-resources/search', { params });
  return response.data;
};

export const fetchStudyResourceById = async (id) => {
  const response = await client.get(`/study-resources/read/${id}`);
  return response.data;
};

// Free Online Reading API (100% Free for all students)
export const readStudyResourceOnline = async (id) => {
  const response = await client.get(`/study-resources/read/${id}`);
  return response.data;
};

// Paid PDF Download API (Requires entitlement/purchase)
export const downloadStudyResourceFile = async (id) => {
  const response = await client.get(`/study-resources/download/${id}`);
  return response.data;
};

// Free Online Reading API for Combo Bundles
export const readStudyResourceComboOnline = async (id) => {
  const response = await client.get(`/study-resources/combo/read/${id}`);
  return response.data;
};

// Paid PDF Download API for Combo Bundles (Requires purchase)
export const downloadStudyResourceComboFile = async (id) => {
  const response = await client.get(`/study-resources/combo/download/${id}`);
  return response.data;
};

// Print Providers API (Blinkit, Zepto, etc.)
export const fetchPrintProviders = async () => {
  const response = await client.get('/study-resources/print-providers');
  return response.data;
};

// Premium / Ad-Free Status API
export const fetchPremiumStatus = async () => {
  const response = await client.get('/study-resources/premium/status');
  return response.data;
};

// Payment & Checkout APIs (Razorpay)
export const createResourcePaymentOrder = async (resourceId) => {
  const response = await client.post('/study-resources/order/resource', { resourceId });
  return response.data;
};

export const createBundlePaymentOrder = async (classLevelOrParams, subject, comboType = 'FORMULA_COMBO', bundleId = null) => {
  let payload = {};
  if (typeof classLevelOrParams === 'object' && classLevelOrParams !== null) {
    payload = classLevelOrParams;
  } else {
    payload = { classLevel: classLevelOrParams, subject, comboType, bundleId };
  }
  const response = await client.post('/study-resources/order/bundle', payload);
  return response.data;
};

export const verifyStudyPayment = async (paymentData) => {
  const response = await client.post('/study-resources/verify-payment', paymentData);
  return response.data;
};

// Legacy Access Alias
export const accessStudyResource = async (id) => {
  const response = await client.get(`/study-resources/read/${id}`);
  return response.data;
};

// User My Purchases / Downloads
export const fetchMyPurchases = async () => {
  const response = await client.get('/study-resources/user/my-downloads');
  return response.data;
};

// Admin Control APIs
export const adminFetchStudyResources = async (params = {}) => {
  const response = await client.get('/study-resources/admin/resources', { params });
  return response.data;
};

export const adminCreateStudyResource = async (formData) => {
  const response = await client.post('/study-resources/admin/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const adminUpdateStudyResource = async (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await client.put(`/study-resources/admin/resources/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const adminDeleteStudyResource = async (id) => {
  const response = await client.delete(`/study-resources/admin/resources/${id}`);
  return response.data;
};

export const adminFetchBundles = async () => {
  const response = await client.get('/study-resources/admin/bundles');
  return response.data;
};

export const adminSaveBundle = async (data, id) => {
  const url = id ? `/study-resources/admin/bundles/${id}` : '/study-resources/admin/bundles';
  const response = await client.post(url, data);
  return response.data;
};

export const adminDeleteBundleFile = async (id) => {
  const response = await client.delete(`/study-resources/admin/bundles/${id}/file`);
  return response.data;
};

export const adminFetchStudyRevenueAnalytics = async () => {
  const response = await client.get('/study-resources/admin/analytics');
  return response.data;
};

export const adminFetchPrintProviders = async () => {
  const response = await client.get('/study-resources/admin/print-providers');
  return response.data;
};

export const adminSavePrintProvider = async (data) => {
  const response = await client.post('/study-resources/admin/print-providers', data);
  return response.data;
};

export const adminFetchPricingMatrix = async () => {
  const response = await client.get('/study-resources/admin/pricing-matrix');
  return response.data;
};

export const adminUpdatePricingMatrix = async (matrix) => {
  const response = await client.put('/study-resources/admin/pricing-matrix', { matrix });
  return response.data;
};
