// ============================================================
// routes/reviews.js
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createReview,
  getTutorReviews,
  deleteReview,
  reportReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10 }).withMessage('Comment must be at least 10 characters')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

// Public
router.get('/:tutorId', getTutorReviews);

// Protected
router.post('/:tutorId', protect, validate(reviewValidation), createReview);
router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/report', protect, reportReview);

module.exports = router;
