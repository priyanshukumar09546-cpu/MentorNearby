// ============================================================
// frontend/src/api/tutorDiscovery.js
// API Service for Tutor Discovery Engine & Lead Lifecycle
// ============================================================

import client from './client';

// ── DISCOVERY CITIES & WORKER ──
export const getDiscoveryCities = (params) => client.get('/tutor-discovery/cities', { params });
export const addDiscoveryCity = (data) => client.post('/tutor-discovery/cities', data);
export const updateDiscoveryCity = (id, data) => client.put(`/tutor-discovery/cities/${id}`, data);
export const deleteDiscoveryCity = (id) => client.delete(`/tutor-discovery/cities/${id}`);

export const startDiscovery = (data) => client.post('/tutor-discovery/start', data);
export const pauseDiscovery = () => client.post('/tutor-discovery/pause');
export const resumeDiscovery = () => client.post('/tutor-discovery/resume');
export const retryFailedDiscovery = () => client.post('/tutor-discovery/retry-failed');

export const getDiscoveryStats = () => client.get('/tutor-discovery/stats');
export const getDiscoveryLogs = (params) => client.get('/tutor-discovery/logs', { params });
export const runDiscoveryDeduplication = () => client.post('/tutor-discovery/deduplicate');

export const getDiscoveryProviders = () => client.get('/tutor-discovery/providers');
export const toggleDiscoveryProvider = (data) => client.post('/tutor-discovery/providers/toggle', data);

// ── DISCOVERED TUTOR LEADS ──
export const getTutorLeads = (params) => client.get('/tutor-leads', { params });
export const getTutorLeadById = (id) => client.get(`/tutor-leads/${id}`);
export const inviteTutorLead = (id) => client.post(`/tutor-leads/${id}/invite`);
export const approveTutorLead = (id, data) => client.post(`/tutor-leads/${id}/approve`, data);
export const rejectTutorLead = (id, data) => client.post(`/tutor-leads/${id}/reject`, data);

// ── PUBLIC CLAIM PROFILE ──
export const getClaimProfile = (token) => client.get(`/tutor-discovery/claim/${token}`);
export const submitClaimProfile = (token, data) => client.post(`/tutor-discovery/claim/${token}`, data);
