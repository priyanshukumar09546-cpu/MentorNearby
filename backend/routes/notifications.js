// ============================================================
// routes/notifications.js
// MentorNearby Notification Routes (User + Admin)
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // User Controllers
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,

  // Admin Controllers
  adminGetStats,
  adminGetHistory,
  adminCreateNotification,
  adminResendNotification,
  adminDeleteNotification,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

// ------------------------------------------------------------
// USER INBOX ROUTES
// ------------------------------------------------------------
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.patch('/read-all', markAllAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/clear-read', clearReadNotifications);
router.get('/:id', getNotificationById);
router.put('/:id/read', markAsRead);
router.patch('/:id/read', markAsRead);
router.post('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// ------------------------------------------------------------
// ADMIN MANAGEMENT ROUTES (ADMIN Role Only)
// ------------------------------------------------------------
router.get('/admin/stats', authorize('ADMIN'), adminGetStats);
router.get('/admin/history', authorize('ADMIN'), adminGetHistory);
router.post('/admin/create', authorize('ADMIN'), adminCreateNotification);
router.post('/admin/resend/:id', authorize('ADMIN'), adminResendNotification);
router.delete('/admin/:id', authorize('ADMIN'), adminDeleteNotification);

module.exports = router;
