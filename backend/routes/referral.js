// ============================================================
// routes/referral.js
// MentorNearby Refer & Earn Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { getMyReferralStats } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my-stats', getMyReferralStats);
router.get('/stats', getMyReferralStats);
router.get('/', getMyReferralStats);

module.exports = router;
