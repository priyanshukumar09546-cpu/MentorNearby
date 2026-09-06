// ============================================================
// routes/notes.js
// Protected notes preview and watermarked download routes
// ============================================================

const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/auth');
const { getPreview, downloadWithWatermark } = require('../controllers/notesController');

// Public: 2-page preview PDF (no auth needed — safe preview)
router.get('/:id/preview', getPreview);

// 100% Free Full watermarked PDF download (optional auth for personalized watermark)
router.get('/:id/download', optionalProtect, downloadWithWatermark);

module.exports = router;
