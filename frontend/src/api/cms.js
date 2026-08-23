// ============================================================
// api/cms.js
// Frontend API Client for Footer, CMS Pages & FAQs
// ============================================================

import client from './client';

// 1. Footer Configuration
export const fetchFooterConfig = () => client.get('/cms/footer');
export const updateFooterConfig = (data) => client.put('/cms/footer', data);

// 2. CMS Dynamic Pages
export const fetchCmsPage = (slug) => client.get(`/cms/pages/${slug}`);
export const fetchAllCmsPages = () => client.get('/cms/admin/pages');
export const saveCmsPage = (data) => client.post('/cms/admin/pages', data);
export const updateCmsPage = (data) => client.put('/cms/admin/pages', data);
export const deleteCmsPage = (id) => client.delete(`/cms/admin/pages/${id}`);

// 3. FAQs
export const fetchFaqs = (category) => {
  const query = category && category !== 'ALL' ? `?category=${category}` : '';
  return client.get(`/cms/faqs${query}`);
};
export const createFaq = (data) => client.post('/cms/admin/faqs', data);
export const updateFaq = (id, data) => client.put(`/cms/admin/faqs/${id}`, data);
export const deleteFaq = (id) => client.delete(`/cms/admin/faqs/${id}`);
