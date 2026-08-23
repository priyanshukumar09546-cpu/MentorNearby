// ============================================================
// api/resources.js
// Client API for Educational Resources & NCERT Content
// ============================================================

import client from './client';

export const fetchCategories = async () => {
  const response = await client.get('/resources/categories');
  return response.data;
};

export const fetchClasses = async (params = {}) => {
  const response = await client.get('/resources/classes', { params });
  return response.data;
};

export const fetchSubjects = async (params = {}) => {
  const response = await client.get('/resources/subjects', { params });
  return response.data;
};

export const fetchResources = async (params = {}) => {
  const response = await client.get('/resources', { params });
  return response.data;
};

export const searchResources = async (params = {}) => {
  const response = await client.get('/resources/search', { params });
  return response.data;
};

export const fetchResourceById = async (id) => {
  const response = await client.get(`/resources/${id}`);
  return response.data;
};

export const fetchResourceChapters = async (id) => {
  const response = await client.get(`/resources/${id}/chapters`);
  return response.data;
};
