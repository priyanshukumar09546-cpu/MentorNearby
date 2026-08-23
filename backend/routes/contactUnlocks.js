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
router.post('/free/:tutorId', authorize('STUDENT'), createFreeUnlock);
router.post('/free', authorize('STUDENT'), createFreeUnlock);
router.post('/create-order', authorize('STUDENT'), createPaymentOrder);
router.post('/verify-payment', authorize('STUDENT'), verifyPaymentAndUnlock);
router.get('/my-unlocks', getMyUnlocks);

module.exports = router;
