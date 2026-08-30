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
  getFeaturedStudents,
  getPublicStudentProfile,
  getUserById,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public endpoints
router.get('/students/featured', getFeaturedStudents);
router.get('/featured-students', getFeaturedStudents);
router.get('/students/:id', getPublicStudentProfile);
router.get('/student/:id', getPublicStudentProfile);
router.get('/students/:id/public', getPublicStudentProfile);
router.get('/public/students/:id', getPublicStudentProfile);
router.get('/:id', getUserById);

// Protected routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/student-profile', updateStudentProfile);
router.delete('/account', deleteAccount);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

module.exports = router;
