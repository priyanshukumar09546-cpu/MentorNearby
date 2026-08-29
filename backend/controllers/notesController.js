// ============================================================
// controllers/notesController.js
// Protected Notes download with watermark + 2-page preview
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const StudyResource = require('../models/StudyResource');
const User = require('../models/User');
const { fetchPdfBuffer, addWatermarkToPdf, extractFirstPages } = require('../services/pdfWatermarkService');
const mongoose = require('mongoose');

// Helper: Check active subscription
const isActiveSubscriber = (user) => {
  if (!user) return false;
  if (!user.isSubscribed) return false;
  if (!user.subscriptionExpiry) return false;
  return new Date(user.subscriptionExpiry) > new Date();
};

// Helper: Resolve the real Cloudinary URL from a StudyResource doc
const resolveFileUrl = (resource) => {
  if (resource.fileReference?.url?.includes('res.cloudinary.com')) {
    return resource.fileReference.url;
  }
  if (resource.fileUrl?.includes('res.cloudinary.com')) {
    return resource.fileUrl;
  }
  if (resource.fileUrl?.startsWith('http')) {
    return resource.fileUrl;
  }
  return null;
};

// ============================================================
// GET /api/notes/:id/preview
// Public — return first 2 pages as images/png or 2-page PDF preview
// No auth required — safe because it's only 2 pages, no full content
// ============================================================
exports.getPreview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page, format } = req.query;

  let resource;
  try {
    resource = await StudyResource.findById(id).lean();
  } catch (_) {
    return error(res, 'Invalid resource ID', 400);
  }

  if (!resource || !resource.published) {
    return error(res, 'Study resource not found', 404);
  }

  const fileUrl = resolveFileUrl(resource);
  if (!fileUrl) {
    return error(res, 'No PDF file found for this resource', 404);
  }

  // 1. If JSON info requested with page image URLs
  if (format === 'json') {
    const isCloudinary = fileUrl.includes('res.cloudinary.com');
    let page1Url = `/api/notes/${id}/preview?page=1`;
    let page2Url = `/api/notes/${id}/preview?page=2`;
    if (isCloudinary) {
      page1Url = fileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_1,w_1000,f_png/').replace(/\.pdf$/i, '.png');
      page2Url = fileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_2,w_1000,f_png/').replace(/\.pdf$/i, '.png');
    }
    return res.json({
      success: true,
      title: resource.title,
      totalPreviewPages: 2,
      pages: [page1Url, page2Url],
    });
  }

  // 2. If single page image requested (?page=1 or ?page=2)
  if (page === '1' || page === '2') {
    const pageNum = parseInt(page, 10);
    const isCloudinary = fileUrl.includes('res.cloudinary.com');
    if (isCloudinary) {
      const cloudinaryPagePngUrl = fileUrl
        .replace(/\/upload\/(?:v\d+\/)?/, `/upload/pg_${pageNum},w_1000,f_png/`)
        .replace(/\.pdf$/i, '.png');
      return res.redirect(302, cloudinaryPagePngUrl);
    }
  }

  // 3. Default: Return first 2 pages as a lightweight preview PDF
  try {
    const pdfBuffer = await fetchPdfBuffer(fileUrl);
    const previewBuffer = await extractFirstPages(pdfBuffer, 2);

    const cleanTitle = (resource.title || 'preview').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cleanTitle}_preview.pdf"`,
      'Content-Length': previewBuffer.length,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });

    return res.send(previewBuffer);
  } catch (err) {
    console.error('[notesController.getPreview] Error:', err.message);
    return error(res, 'Failed to generate preview. Please try again.', 500);
  }
});

// ============================================================
// GET /api/notes/:id/download
// Protected — requires isSubscribed. Returns full watermarked PDF.
// ============================================================
exports.downloadWithWatermark = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id || req.user?.id;

  // Fetch full user record to check subscription
  const user = await User.findById(userId).select('name phone isSubscribed subscriptionExpiry subscriptionType role');
  if (!user) {
    return error(res, 'User not found', 404);
  }

  // ── Subscription Gate ─────────────────────────────────────
  if (!isActiveSubscriber(user)) {
    const planPrice = user.role === 'TUTOR' ? 149 : 99;
    const planType = user.role === 'TUTOR' ? 'teacher' : 'student';
    return res.status(403).json({
      success: false,
      paywall: true,
      plan: planPrice,
      planType,
      message: `Subscribe at ₹${planPrice}/month to download unlimited PDFs with personal watermark.`,
    });
  }

  // ── Fetch Resource ────────────────────────────────────────
  let resource;
  try {
    resource = await StudyResource.findById(id).lean();
  } catch (_) {
    return error(res, 'Invalid resource ID', 400);
  }

  if (!resource || !resource.published) {
    return error(res, 'Study resource not found', 404);
  }

  const fileUrl = resolveFileUrl(resource);
  if (!fileUrl) {
    return error(res, 'No PDF file found for this resource', 404);
  }

  try {
    // Build personalised watermark text
    const userPhone = user.phone || 'N/A';
    const watermarkText = `MentorNearby | Downloaded by ${user.name} - ${userPhone}`;

    // Fetch, watermark, and stream back
    const pdfBuffer = await fetchPdfBuffer(fileUrl);
    const watermarkedBuffer = await addWatermarkToPdf(pdfBuffer, watermarkText);

    const cleanTitle = (resource.title || 'study-material').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `MentorNearby_${cleanTitle}_${resource.classLevel || ''}.pdf`;

    // Increment download counter (non-blocking)
    StudyResource.findByIdAndUpdate(id, { $inc: { downloadsCount: 1 } }).catch(() => {});

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': watermarkedBuffer.length,
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    return res.send(watermarkedBuffer);
  } catch (err) {
    console.error('[notesController.downloadWithWatermark] Error:', err.message);
    return error(res, 'Failed to prepare download. Please try again.', 500);
  }
});
