// ============================================================
// routes/courses.js
// Express API Routes for Courses, PYQ Mastery, Video Solutions,
// Bundles, Razorpay Payments, Student Progress & Admin Management
// ============================================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  getFeaturedCoursesAndBundles,
  getCourseDetails,
  getPaperWatchAccess,
  createCoursePaymentOrder,
  createBundlePaymentOrder,
  createPptPaymentOrder,
  verifyPptPaymentAndDownload,
  verifyCoursePayment,
  getMyCourses,
  updateCourseProgress,
  getCourseBundles,
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAddPaper,
  adminUpdatePaper,
  adminDeletePaper,
  adminCreateBundle,
  adminUpdateBundle,
  adminDeleteBundle,
  adminGetAnalytics,
} = require('../controllers/courseController');

// Optional Authentication Middleware
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('+role');
    } catch (_) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

// ============================================================
// 1. PUBLIC & STUDENT CATALOG ROUTES
// ============================================================
router.get('/', optionalAuth, getCourses);
router.get('/featured', optionalAuth, getFeaturedCoursesAndBundles);
router.get('/bundles', getCourseBundles);
router.get('/paper/:paperId/watch', optionalAuth, getPaperWatchAccess);

// ============================================================
// 2. AUTHENTICATED STUDENT ROUTES (PURCHASES & PROGRESS)
// ============================================================
router.post('/order/course', protect, createCoursePaymentOrder);
router.post('/order/bundle', protect, createBundlePaymentOrder);
router.post('/order/ppt', protect, createPptPaymentOrder);
router.post('/verify-ppt-payment', protect, verifyPptPaymentAndDownload);
router.post('/verify-payment', protect, verifyCoursePayment);
router.get('/user/my-courses', protect, getMyCourses);
router.post('/user/progress', protect, updateCourseProgress);

// ============================================================
// 3. ADMIN CONTROL CENTER ROUTES
// ============================================================
router.get('/admin/list', protect, authorize('ADMIN'), adminGetCourses);
router.get('/admin/analytics', protect, authorize('ADMIN'), adminGetAnalytics);
router.post('/admin/create', protect, authorize('ADMIN'), adminCreateCourse);
router.put('/admin/:id', protect, authorize('ADMIN'), adminUpdateCourse);
router.delete('/admin/:id', protect, authorize('ADMIN'), adminDeleteCourse);

// Admin Paper / Video Management
router.post('/admin/:courseId/papers', protect, authorize('ADMIN'), adminAddPaper);
router.put('/admin/papers/:paperId', protect, authorize('ADMIN'), adminUpdatePaper);
router.delete('/admin/papers/:paperId', protect, authorize('ADMIN'), adminDeletePaper);

// Admin Bundle Management
router.post('/admin/bundles', protect, authorize('ADMIN'), adminCreateBundle);
router.put('/admin/bundles/:id', protect, authorize('ADMIN'), adminUpdateBundle);
router.delete('/admin/bundles/:id', protect, authorize('ADMIN'), adminDeleteBundle);

// Public Course Details route (Must be after specific routes)
router.get('/:idOrSlug', optionalAuth, getCourseDetails);

module.exports = router;
