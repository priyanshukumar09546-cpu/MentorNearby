// ============================================================
// routes/kyc.js
// ============================================================

const express = require('express');
const router = express.Router();
const {
  submitKyc,
  getMyKycStatus,
  adminGetKycList,
  adminGetKycDetail,
  adminUpdateKycStatus,
} = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

router.use(protect);

// Tutor routes
router.post('/submit', authorize('TUTOR'), uploadDocument, submitKyc);
router.get('/my-status', authorize('TUTOR'), getMyKycStatus);

// Admin routes
router.get('/admin/list', authorize('ADMIN'), adminGetKycList);
router.get('/admin/:id', authorize('ADMIN'), adminGetKycDetail);
router.put('/admin/:id/status', authorize('ADMIN'), adminUpdateKycStatus);

module.exports = router;
