// ============================================================
// routes/tutors.js
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getTutorProfile,
  updateTutorProfile,
  uploadProfilePhoto,
  uploadIntroVideo,
  getTutorDashboard,
  getTutorStats,
  updateAvailability,
  updateSafetyPreferences,
  toggleProfileVisibility,
} = require('../controllers/tutorController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPhoto, uploadVideo } = require('../middleware/upload');

// Protected routes (tutor own profile)
router.get('/stats', protect, authorize('TUTOR'), getTutorStats);
router.get('/dashboard/me', protect, authorize('TUTOR'), getTutorDashboard);
router.get('/dashboard', protect, authorize('TUTOR'), getTutorDashboard);
router.put('/profile/me', protect, authorize('TUTOR'), updateTutorProfile);
router.put('/profile', protect, authorize('TUTOR'), updateTutorProfile);
router.post('/profile/me/photo', protect, authorize('TUTOR'), uploadPhoto, uploadProfilePhoto);
router.post('/profile/me/video', protect, authorize('TUTOR'), uploadVideo, uploadIntroVideo);
router.put('/profile/me/availability', protect, authorize('TUTOR'), updateAvailability);
router.put('/profile/me/safety', protect, authorize('TUTOR'), updateSafetyPreferences);
router.put('/profile/me/visibility', protect, authorize('TUTOR'), toggleProfileVisibility);

// Public route for tutor profile by ID or slug
router.get('/:id', getTutorProfile);

module.exports = router;
