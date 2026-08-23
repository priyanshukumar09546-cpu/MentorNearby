// ============================================================
// api/bookmarks.js
// Client API for User Bookmarks
// ============================================================

import client from './client';

export const fetchMyBookmarks = async () => {
  const response = await client.get('/bookmarks');
  return response.data;
};

export const checkBookmark = async (resourceId, chapterIndex = -1) => {
  const response = await client.get(`/bookmarks/check/${resourceId}`, {
    params: { chapterIndex },
  });
  return response.data;
};

export const addBookmark = async (data) => {
  const response = await client.post('/bookmarks', data);
  return response.data;
};

export const removeBookmark = async (id) => {
  const response = await client.delete(`/bookmarks/${id}`);
  return response.data;
};
