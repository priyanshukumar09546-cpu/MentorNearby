// ============================================================
// routes/contactUnlocks.js
// ============================================================

const express = require('express');
const router = express.Router();
const {
  checkUnlockEligibility,
  createFreeUnlock,
  createPaymentOrder,
  verifyPaymentAndUnlock,
  getMyUnlocks,
} = require('../controllers/contactUnlockController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/check/:tutorId', checkUnlockEligibility);
router.get('/eligibility/:tutorId', checkUnlockEligibility);
router.post('/unlock/:tutorId', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), createFreeUnlock);
router.post('/unlock', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), createFreeUnlock);
router.post('/free/:tutorId', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), createFreeUnlock);
router.post('/free', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), createFreeUnlock);
router.post('/create-order', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), createPaymentOrder);
router.post('/verify-payment', authorize('STUDENT', 'TUTOR', 'PARENT', 'ADMIN'), verifyPaymentAndUnlock);
router.get('/my-unlocks', getMyUnlocks);

module.exports = router;
