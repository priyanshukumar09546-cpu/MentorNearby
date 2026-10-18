// ============================================================
// routes/auth.js
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleAuth,
  getGoogleAuthUrl,
  googleCallback,
  sendVerificationOtp,
  verifyIdentityOtp,
  sendAadhaarOtp,
  verifyAadhaarOtp,
} = require('../controllers/authController');
const { adminLogin } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('role')
    .optional()
    .customSanitizer(val => (val ? val.toString().trim().toUpperCase() : 'STUDENT'))
    .isIn(['STUDENT', 'PARENT', 'TUTOR'])
    .withMessage('Role must be STUDENT, PARENT, or TUTOR'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
});

// Routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/admin-login', adminLogin);
router.post('/admin/login', adminLogin);
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidation), resetPassword);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);
router.put('/update-password', protect, updatePassword);

// OTP & Identity Verification Routes
router.post('/send-otp', sendVerificationOtp);
router.post('/verify-otp', verifyIdentityOtp);
router.post('/aadhaar/send-otp', sendAadhaarOtp);
router.post('/aadhaar/verify-otp', verifyAadhaarOtp);

module.exports = router;
