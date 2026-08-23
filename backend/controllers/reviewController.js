const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const ContactUnlock = require('../models/ContactUnlock');
const TutorProfile = require('../models/TutorProfile');

exports.createReview = asyncHandler(async (req, res, next) => {
  const { tutorId } = req.params;
  const { rating, comment } = req.body;

  if (req.user.id === tutorId) {
    return error(res, 'Cannot review yourself', 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    return error(res, 'Rating must be between 1 and 5', 400);
  }
  if (!comment || comment.length < 10) {
    return error(res, 'Comment must be at least 10 characters', 400);
  }

  const hasUnlocked = await ContactUnlock.findOne({
    user: req.user.id,
    tutor: tutorId,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED', 'COMPLETED'] }
  });

  if (!hasUnlocked) {
    return error(res, 'Must unlock tutor contact before reviewing', 403);
  }

  const existingReview = await Review.findOne({ reviewer: req.user.id, tutor: tutorId });
  if (existingReview) {
    return error(res, 'You have already reviewed this tutor', 400);
  }

  const review = await Review.create({
    reviewer: req.user.id,
    tutor: tutorId,
    rating,
    comment
  });

  const tutorReviews = await Review.find({ tutor: tutorId });
  const avgRating = tutorReviews.reduce((acc, r) => acc + r.rating, 0) / tutorReviews.length;

  await TutorProfile.findOneAndUpdate(
    { user: tutorId },
    { averageRating: avgRating, totalReviews: tutorReviews.length }
  );

  return success(res, 'Review created successfully', { review });
});

exports.getTutorReviews = asyncHandler(async (req, res, next) => {
  const { tutorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const startIndex = (page - 1) * limit;

  const reviews = await Review.find({ tutor: tutorId, isHidden: false })
    .populate('reviewer', 'name')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ tutor: tutorId, isHidden: false });

  return success(res, 'Reviews retrieved', {
    reviews,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return error(res, 'Review not found', 404);
  }

  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'ADMIN') {
    return error(res, 'Not authorized to delete this review', 403);
  }

  await Review.findByIdAndDelete(req.params.id);

  const tutorReviews = await Review.find({ tutor: review.tutor });
  const avgRating = tutorReviews.length ? tutorReviews.reduce((acc, r) => acc + r.rating, 0) / tutorReviews.length : 0;

  await TutorProfile.findOneAndUpdate(
    { user: review.tutor },
    { averageRating: avgRating, totalReviews: tutorReviews.length }
  );

  return success(res, 'Review deleted successfully');
});

exports.reportReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return error(res, 'Review not found', 404);
  }

  review.reportCount += 1;
  await review.save();

  return success(res, 'Review reported successfully');
});
