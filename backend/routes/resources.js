// ============================================================
// routes/resources.js
// Public endpoints for browsing, searching & fetching study content
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getCategories,
  getClasses,
  getSubjects,
  getResources,
  searchResources,
  getResourceById,
  getResourceChapters,
} = require('../controllers/resourceController');

// Categories & Dynamic Filters
router.get('/categories', getCategories);
router.get('/classes', getClasses);
router.get('/subjects', getSubjects);

// Search & Catalog
router.get('/search', searchResources);
router.get('/', getResources);

// Detail & Chapters
router.get('/:id', getResourceById);
router.get('/:id/chapters', getResourceChapters);

module.exports = router;
