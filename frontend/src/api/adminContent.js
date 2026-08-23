// ============================================================
// api/adminContent.js
// Admin API for NCERT Sync & Educational Resources Management
// ============================================================

import client from './client';

export const syncNcertContent = async () => {
  const response = await client.post('/admin/ncert/sync');
  return response.data;
};

export const fetchSyncStatus = async () => {
  const response = await client.get('/admin/ncert/sync-status');
  return response.data;
};

export const fetchContentHealth = async () => {
  const response = await client.get('/admin/ncert/health');
  return response.data;
};

export const validateLinks = async () => {
  const response = await client.post('/admin/ncert/validate-links');
  return response.data;
};

export const fetchAdminResources = async (params = {}) => {
  const response = await client.get('/admin/resources', { params });
  return response.data;
};

export const createAdminResource = async (data) => {
  const response = await client.post('/admin/resources', data);
  return response.data;
};

export const fetchAdminResourceById = async (id) => {
  const response = await client.get(`/admin/resources/${id}`);
  return response.data;
};

export const updateAdminResource = async (id, data) => {
  const response = await client.put(`/admin/resources/${id}`, data);
  return response.data;
};

export const deleteAdminResource = async (id, hardDelete = false) => {
  const response = await client.delete(`/admin/resources/${id}`, {
    params: { hardDelete },
  });
  return response.data;
};

export const restoreAdminResource = async (id) => {
  const response = await client.put(`/admin/resources/${id}/restore`);
  return response.data;
};
