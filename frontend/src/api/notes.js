// ============================================================
// api/notes.js
// API calls for notes preview and protected download
// ============================================================

import client from './client';
import { API_BASE_URL } from './config';

/**
 * Get the URL for the 2-page preview PDF (public, no auth)
 * Use this in an iframe or <embed> — browser renders it inline
 */
export const getNotePreviewUrl = (resourceId) =>
  `${API_BASE_URL}/notes/${resourceId}/preview`;

/**
 * Trigger a watermarked PDF download for subscribed users.
 * Returns an axios response — if 200, contains PDF blob.
 * If 403, contains paywall payload.
 */
export const downloadWatermarkedNote = (resourceId) =>
  client.get(`/notes/${resourceId}/download`, {
    responseType: 'blob',
  });
