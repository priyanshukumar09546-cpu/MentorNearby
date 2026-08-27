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
router.put('/profile/me', protect, authorize('TUTOR', 'ADMIN'), updateTutorProfile);
router.put('/profile', protect, authorize('TUTOR', 'ADMIN'), updateTutorProfile);
router.post('/profile/me/photo', protect, authorize('TUTOR', 'ADMIN'), uploadPhoto, uploadProfilePhoto);
router.post('/photo', protect, authorize('TUTOR', 'ADMIN'), uploadPhoto, uploadProfilePhoto);
router.post('/upload-pic', protect, uploadPhoto, uploadProfilePhoto);
router.post('/profile/me/video', protect, authorize('TUTOR', 'ADMIN'), uploadVideo, uploadIntroVideo);
router.post('/video', protect, authorize('TUTOR', 'ADMIN'), uploadVideo, uploadIntroVideo);
router.put('/profile/me/availability', protect, updateAvailability);
router.put('/availability', protect, updateAvailability);
router.post('/availability', protect, updateAvailability);
router.put('/me/availability', protect, updateAvailability);
router.put('/profile/me/safety', protect, authorize('TUTOR', 'ADMIN'), updateSafetyPreferences);
router.put('/safety', protect, authorize('TUTOR', 'ADMIN'), updateSafetyPreferences);
router.put('/profile/me/visibility', protect, authorize('TUTOR', 'ADMIN'), toggleProfileVisibility);
router.patch('/visibility', protect, authorize('TUTOR', 'ADMIN'), toggleProfileVisibility);
router.put('/visibility', protect, authorize('TUTOR', 'ADMIN'), toggleProfileVisibility);

// Admin approval / unapproval aliases
const { approveTutor, unapproveTutor } = require('../controllers/adminController');
router.put('/:id/approve', protect, authorize('ADMIN'), approveTutor);
router.post('/:id/approve', protect, authorize('ADMIN'), approveTutor);
router.put('/:id/unapprove', protect, authorize('ADMIN'), unapproveTutor);
router.post('/:id/unapprove', protect, authorize('ADMIN'), unapproveTutor);

// Public route for tutor profile by ID or slug
router.get('/:id', getTutorProfile);

module.exports = router;
