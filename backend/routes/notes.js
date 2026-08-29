// ============================================================
// routes/notes.js
// Protected notes preview and watermarked download routes
// ============================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPreview, downloadWithWatermark } = require('../controllers/notesController');

// Public: 2-page preview PDF (no auth needed — safe preview)
router.get('/:id/preview', getPreview);

// Protected: Full watermarked PDF download (subscription required)
router.get('/:id/download', protect, downloadWithWatermark);

module.exports = router;
