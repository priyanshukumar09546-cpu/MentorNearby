// ============================================================
// routes/tutors.js
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getTutorProfile,
  getFeaturedTutors,
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
const { uploadPhoto, uploadVideo, uploadDocument } = require('../middleware/upload');
const { uploadKycDocument, uploadTutorId } = require('../controllers/uploadController');

// Public routes (Featured & Search)
router.get('/featured', getFeaturedTutors);

// Tutor ID Upload (Fast Verhoeff + Private Storage)
router.post('/upload-id', uploadDocument, uploadTutorId);

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

// Admin approval / unapproval aliases
const { approveTutor, unapproveTutor } = require('../controllers/adminController');
router.put('/:id/approve', protect, authorize('ADMIN'), approveTutor);
router.post('/:id/approve', protect, authorize('ADMIN'), approveTutor);
router.put('/:id/unapprove', protect, authorize('ADMIN'), unapproveTutor);
router.post('/:id/unapprove', protect, authorize('ADMIN'), unapproveTutor);

// Public route for tutor profile by ID or slug
router.get('/:id', getTutorProfile);

module.exports = router;
