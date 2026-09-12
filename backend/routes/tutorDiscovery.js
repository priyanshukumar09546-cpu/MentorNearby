// ============================================================
// routes/tutorDiscovery.js
// Express Router for Tutor Discovery Engine & City Targets
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCities,
  addCity,
  updateCity,
  deleteCity,
  startDiscovery,
  pauseDiscovery,
  resumeDiscovery,
  retryFailed,
  getDiscoveryStats,
  getDiscoveryLogs,
  runDeduplication,
  getProviders,
  toggleProvider,
  getClaimDetails,
  submitClaim,
} = require('../controllers/tutorDiscoveryController');

// ── PUBLIC CLAIM ENDPOINTS ──
router.get('/claim/:token', getClaimDetails);
router.post('/claim/:token', submitClaim);

// ── PROTECTED ADMIN CONTROL ENDPOINTS ──
router.use(protect);
router.use(authorize('ADMIN'));

// Cities
router.get('/cities', getCities);
router.post('/cities', addCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// Worker Operations
router.post('/start', startDiscovery);
router.post('/pause', pauseDiscovery);
router.post('/resume', resumeDiscovery);
router.post('/retry-failed', retryFailed);

// Stats, Logs & Maintenance
router.get('/stats', getDiscoveryStats);
router.get('/logs', getDiscoveryLogs);
router.post('/deduplicate', runDeduplication);

// Providers
router.get('/providers', getProviders);
router.post('/providers/toggle', toggleProvider);

module.exports = router;
