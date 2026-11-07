// ============================================================
// routes/subscriptions.js
// Subscription management routes
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUnifiedPlan,
  createOrder,
  verifyPayment,
  webhook,
  getStatus,
  cancelSubscription,
} = require('../controllers/subscriptionController');

// Public plan info
router.get('/plan', getUnifiedPlan);

// Public webhook — Razorpay hits this without auth token
// Must come BEFORE router.use(protect)
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// All other routes require auth
router.use(protect);

router.post('/create-order', createOrder);
router.post('/create-subscription', createOrder);
router.post('/verify', verifyPayment);
router.get('/status', getStatus);
router.get('/manage', getStatus);
router.post('/cancel', cancelSubscription);

module.exports = router;
