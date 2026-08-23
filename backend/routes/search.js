const express = require('express');
const router = express.Router();
const { searchTutors, getPublicStats } = require('../controllers/searchController');

// Public stats & search routes
router.get('/stats', getPublicStats);
router.get('/tutors', searchTutors);
router.get('/', searchTutors);

module.exports = router;
