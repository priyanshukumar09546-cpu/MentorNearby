// ============================================================
// routes/users.js
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateStudentProfile,
  deleteAccount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/student-profile', updateStudentProfile);
router.delete('/account', deleteAccount);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

module.exports = router;
