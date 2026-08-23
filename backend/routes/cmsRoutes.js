// ============================================================
// routes/cmsRoutes.js
// Content Management System API Routes (Footer, Pages, FAQs)
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getFooterConfig,
  updateFooterConfig,
  getCmsPageBySlug,
  getAllCmsPages,
  saveCmsPage,
  deleteCmsPage,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/auth');

// Public Routes
router.get('/footer', getFooterConfig);
router.get('/pages/:slug', getCmsPageBySlug);
router.get('/faqs', getFaqs);

// Protected Admin Routes
router.put('/footer', protect, authorize('ADMIN'), updateFooterConfig);
router.get('/admin/pages', protect, authorize('ADMIN'), getAllCmsPages);
router.post('/admin/pages', protect, authorize('ADMIN'), saveCmsPage);
router.put('/admin/pages', protect, authorize('ADMIN'), saveCmsPage);
router.delete('/admin/pages/:id', protect, authorize('ADMIN'), deleteCmsPage);

router.post('/admin/faqs', protect, authorize('ADMIN'), createFaq);
router.put('/admin/faqs/:id', protect, authorize('ADMIN'), updateFaq);
router.delete('/admin/faqs/:id', protect, authorize('ADMIN'), deleteFaq);

module.exports = router;
