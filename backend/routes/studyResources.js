// ============================================================
// routes/studyResources.js
// Routes for Study Resources, Free Online Reading, Paid Downloads,
// Combos, Print Providers, Purchases & Admin Management
// ============================================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const {
  getClassesAndSubjects,
  getSubjectStudyResources,
  searchStudyResources,
  readStudyResource,
  streamStudyResource,
  downloadStudyResource,
  readStudyResourceCombo,
  streamStudyResourceCombo,
  downloadStudyResourceCombo,
  getPrintProviders,
  getPremiumStatus,
  createResourcePaymentOrder,
  createBundlePaymentOrder,
  verifyStudyPayment,
  getMyDownloads,
  adminGetResources,
  adminCreateResource,
  adminUpdateResource,
  adminDeleteResource,
  adminGetBundles,
  adminSaveBundle,
  adminDeleteBundleFile,
  adminGetAnalytics,
  adminGetPrintProviders,
  adminSavePrintProvider,
  adminGetPricingMatrix,
  adminUpdatePricingMatrix,
} = require('../controllers/studyResourceController');

// Optional Authentication Middleware (attaches user if valid token present, doesn't block guests)
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('+role');
    } catch (_) {
      // Ignore token errors for public reading routes
    }
  }
  next();
};

// ============================================================
// 1. PUBLIC & FREE READING ROUTES (with optional auth for personalized experience)
// ============================================================
router.get('/classes', getClassesAndSubjects);
router.get('/search', optionalAuth, searchStudyResources);
router.get('/catalog', optionalAuth, searchStudyResources);
router.get('/subject/:classLevel/:subject', optionalAuth, getSubjectStudyResources);
router.get('/read/:id', optionalAuth, readStudyResource); // Free online reading viewer metadata
router.get('/stream/:id', optionalAuth, streamStudyResource); // Protected inline document streaming
router.get('/combo/read/:id', optionalAuth, readStudyResourceCombo); // Combo free online reading viewer metadata
router.get('/combo/stream/:id', optionalAuth, streamStudyResourceCombo); // Combo protected inline document streaming
router.get('/print-providers', getPrintProviders);
router.get('/premium/status', optionalAuth, getPremiumStatus);

// ============================================================
// 2. 100% FREE DOWNLOADS & OPTIONAL AUTH ROUTES
// ============================================================
router.get('/download/:id', optionalAuth, downloadStudyResource);
router.get('/combo/download/:id', optionalAuth, downloadStudyResourceCombo);
router.get('/:id/access', optionalAuth, downloadStudyResource);
router.get('/access/:id', optionalAuth, downloadStudyResource);
router.post('/order/resource', protect, createResourcePaymentOrder);
router.post('/order/bundle', protect, createBundlePaymentOrder);
router.post('/verify-payment', protect, verifyStudyPayment);
router.get('/user/my-downloads', protect, getMyDownloads);
router.get('/user/my-purchases', protect, getMyDownloads);

// ============================================================
// 3. ADMIN CONTROL CENTER ROUTES
// ============================================================
router.get('/admin/resources', protect, authorize('ADMIN'), adminGetResources);
router.post('/admin/resources', protect, authorize('ADMIN'), uploadDocument, adminCreateResource);
router.put('/admin/resources/:id', protect, authorize('ADMIN'), uploadDocument, adminUpdateResource);
router.delete('/admin/resources/:id', protect, authorize('ADMIN'), adminDeleteResource);

router.get('/admin/bundles', protect, authorize('ADMIN'), adminGetBundles);
router.post('/admin/bundles', protect, authorize('ADMIN'), uploadDocument, adminSaveBundle);
router.post('/admin/bundles/:id', protect, authorize('ADMIN'), uploadDocument, adminSaveBundle);
router.put('/admin/bundles/:id', protect, authorize('ADMIN'), uploadDocument, adminSaveBundle);
router.delete('/admin/bundles/:id/file', protect, authorize('ADMIN'), adminDeleteBundleFile);

router.get('/admin/analytics', protect, authorize('ADMIN'), adminGetAnalytics);

router.get('/admin/pricing-matrix', protect, authorize('ADMIN'), adminGetPricingMatrix);
router.put('/admin/pricing-matrix', protect, authorize('ADMIN'), adminUpdatePricingMatrix);

router.get('/admin/print-providers', protect, authorize('ADMIN'), adminGetPrintProviders);
router.post('/admin/print-providers', protect, authorize('ADMIN'), adminSavePrintProvider);

module.exports = router;
