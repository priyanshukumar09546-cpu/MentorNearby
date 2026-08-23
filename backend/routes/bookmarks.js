// ============================================================
// routes/bookmarks.js
// Authenticated user bookmark endpoints
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getMyBookmarks,
  checkBookmark,
  addBookmark,
  removeBookmark,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

// All bookmark routes require user authentication
router.use(protect);

router.get('/', getMyBookmarks);
router.get('/check/:resourceId', checkBookmark);
router.post('/', addBookmark);
router.delete('/:id', removeBookmark);

module.exports = router;
