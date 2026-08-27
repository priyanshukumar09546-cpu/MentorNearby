const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const TutorProfile = require('../models/TutorProfile');
const ContactUnlock = require('../models/ContactUnlock');
const Review = require('../models/Review');
const TutorRequest = require('../models/TutorRequest');
const cloudinaryService = require('../services/cloudinaryService');

exports.getTutorProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let query;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ user: id }, { _id: id }] };
  } else {
    query = { slug: id };
  }

  const tutorProfile = await TutorProfile.findOneAndUpdate(
    query,
    { $inc: { profileViews: 1 } },
    { new: true }
  ).populate('user', 'name emailVerified phoneVerified isSuspended role');

  if (!tutorProfile || !tutorProfile.user) {
    return error(res, 'Tutor not found', 404);
  }

  // If tutor is suspended, hide from non-admin users
  const isAdmin = req.user && req.user.role === 'ADMIN';
  if (tutorProfile.user.isSuspended && !isAdmin) {
    return error(res, 'Tutor not found', 404);
  }

  return success(res, 'Tutor profile retrieved successfully', { tutorProfile });
});

exports.updateTutorProfile = asyncHandler(async (req, res, next) => {
  let tutorProfile = await TutorProfile.findOne({ user: req.user.id });

  if (!tutorProfile && req.user.role === 'ADMIN') {
    tutorProfile = await TutorProfile.findOne({ user: req.params.id });
  }

  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  const restrictedFields = ['verificationStatus', 'kycStatus', 'profileViews', 'averageRating', 'totalReviews', 'searchAppearances', 'savedCount'];
  const updateData = { ...req.body };
  restrictedFields.forEach(field => delete updateData[field]);

  tutorProfile = await TutorProfile.findByIdAndUpdate(tutorProfile._id, updateData, {
    new: true,
    runValidators: true
  });

  return success(res, 'Profile updated successfully', { tutorProfile });
});

exports.uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return error(res, 'Please provide an image file', 400);
  }

  const result = await cloudinaryService.uploadProfilePhoto(req.file.buffer, req.user.id);
  const photoUrl = result.secure_url || result.url;
  const publicId = result.public_id || '';

  let tutorProfile = await TutorProfile.findOne({
    $or: [{ user: req.user._id || req.user.id }, { _id: req.user._id || req.user.id }]
  });

  if (tutorProfile) {
    tutorProfile.profilePhoto = { url: photoUrl, publicId };
    await tutorProfile.save({ validateBeforeSave: false });
  }

  await User.findByIdAndUpdate(req.user._id || req.user.id, { avatar: photoUrl });

  return success(res, 'Profile photo uploaded successfully', { url: photoUrl, publicId });
});

exports.uploadIntroVideo = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return error(res, 'Please provide a video file', 400);
  }

  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  const result = await cloudinaryService.uploadIntroVideo(req.file.buffer, req.user.id);
  
  tutorProfile.introVideo = result.secure_url;
  await tutorProfile.save();

  return success(res, 'Intro video uploaded successfully', { url: result.secure_url });
});

exports.getTutorDashboard = asyncHandler(async (req, res, next) => {
  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  const unlockCount = await ContactUnlock.countDocuments({ tutor: req.user.id });

  const dashboardData = {
    profileViews: tutorProfile.profileViews,
    searchAppearances: tutorProfile.searchAppearances,
    savedCount: tutorProfile.savedCount,
    totalReviews: tutorProfile.totalReviews,
    averageRating: tutorProfile.averageRating,
    kycStatus: tutorProfile.kycStatus,
    verificationStatus: tutorProfile.verificationStatus,
    profileCompletionPercentage: tutorProfile.profileCompletionPercentage,
    recentNotifications: [], // Will fetch from Notification model if needed
    contactsUnlocked: unlockCount
  };

  return success(res, 'Dashboard data retrieved successfully', dashboardData);
});

exports.updateAvailability = asyncHandler(async (req, res, next) => {
  const mf = req.body.mondayFridayHours || req.body['Monday - Friday Hours'] || req.body.mondayFriday || req.body.weekdays || '05:00 PM - 09:00 PM';
  const sat = req.body.saturdayHours || req.body['Saturday Hours'] || req.body.saturday || '';
  const sun = req.body.sundayHours || req.body['Sunday Status / Hours'] || req.body.sunday || '';

  const structuredAvailability = {
    mondayFriday: mf,
    mondayFridayHours: mf,
    weekdays: mf,
    saturday: sat,
    saturdayHours: sat,
    sunday: sun,
    sundayHours: sun,
    monday: { available: true, slots: [mf] },
    tuesday: { available: true, slots: [mf] },
    wednesday: { available: true, slots: [mf] },
    thursday: { available: true, slots: [mf] },
    friday: { available: true, slots: [mf] },
    saturdaySlot: { available: Boolean(sat && sat !== 'Not Available'), slots: sat ? [sat] : [] },
    sundaySlot: { available: Boolean(sun && sun !== 'Not Available'), slots: sun ? [sun] : [] }
  };

  const userId = req.user?._id || req.user?.id;

  let tutorProfile = await TutorProfile.findOne({
    $or: [
      { user: userId },
      { userId: userId },
      { _id: userId }
    ]
  });

  if (!tutorProfile) {
    tutorProfile = await TutorProfile.create({
      user: userId,
      availability: structuredAvailability
    });
  } else {
    tutorProfile.availability = structuredAvailability;
    await tutorProfile.save({ validateBeforeSave: false });
  }

  return success(res, 'Availability schedule updated successfully', {
    success: true,
    availability: tutorProfile.availability,
    mondayFridayHours: mf,
    saturdayHours: sat,
    sundayHours: sun
  });
});

exports.updateSafetyPreferences = asyncHandler(async (req, res, next) => {
  const tutorProfile = await TutorProfile.findOneAndUpdate(
    { user: req.user.id },
    { safetyPreferences: req.body.safetyPreferences },
    { new: true, runValidators: true }
  );

  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  return success(res, 'Safety preferences updated successfully', { safetyPreferences: tutorProfile.safetyPreferences });
});

exports.toggleProfileVisibility = asyncHandler(async (req, res, next) => {
  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
  
  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  tutorProfile.profileVisibility = !tutorProfile.profileVisibility;
  await tutorProfile.save();

  return success(res, 'Profile visibility toggled successfully', { profileVisibility: tutorProfile.profileVisibility });
});

exports.getTutorStats = asyncHandler(async (req, res, next) => {
  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
  if (!tutorProfile) {
    return success(res, 'Tutor statistics retrieved', {
      totalEarnings: 0,
      profileViews: 0,
      totalReviews: 0,
      averageRating: 0,
      studentRequests: 0,
      contactUnlocks: 0
    });
  }

  const unlockCount = await ContactUnlock.countDocuments({ tutor: req.user.id, status: 'COMPLETED' });
  const paidUnlocks = await ContactUnlock.find({ tutor: req.user.id, status: 'COMPLETED', type: 'PAID' });
  const totalEarnings = tutorProfile.totalEarnings || paidUnlocks.reduce((acc, u) => acc + (u.amount || 49), 0);

  const totalReviews = await Review.countDocuments({ tutor: req.user.id, isHidden: false });
  let avgRating = 0;
  if (totalReviews > 0) {
    const allRev = await Review.find({ tutor: req.user.id, isHidden: false }).select('rating');
    const sum = allRev.reduce((acc, r) => acc + (r.rating || 0), 0);
    avgRating = Number((sum / totalReviews).toFixed(1));
  } else if (tutorProfile.averageRating && tutorProfile.totalReviews > 0) {
    avgRating = tutorProfile.averageRating;
  }

  const studentRequestsCount = await TutorRequest.countDocuments({ tutor: req.user.id });

  const stats = {
    totalEarnings,
    profileViews: tutorProfile.profileViews || 0,
    totalReviews: totalReviews || 0,
    averageRating: avgRating || 0,
    studentRequests: studentRequestsCount || 0,
    contactUnlocks: unlockCount || 0
  };

  return success(res, 'Tutor statistics retrieved', stats);
});

// @desc    Get featured / top approved tutors for Homepage
// @route   GET /api/tutors/featured
// @access  Public
exports.getFeaturedTutors = asyncHandler(async (req, res, next) => {
  let tutors = await TutorProfile.find({
    $or: [
      { isApproved: true },
      { kycStatus: 'VERIFIED' },
      { verificationStatus: { $in: ['APPROVED', 'VERIFIED', 'verified', 'approved'] } },
      { profileVisibility: true }
    ]
  })
  .populate('user', 'name email phone avatar profilePic role isSuspended')
  .sort({ averageRating: -1, profileCompletionPercentage: -1, createdAt: -1 })
  .limit(8);

  let activeTutors = tutors.filter(t => t && t.user && !t.user.isSuspended);

  // Fallback: If 0 tutors matched filter, return all profiles so Homepage is NEVER empty
  if (!activeTutors || activeTutors.length === 0) {
    const allTutors = await TutorProfile.find({})
      .populate('user', 'name email phone avatar profilePic role isSuspended')
      .limit(8);
    activeTutors = allTutors.filter(t => t && t.user && !t.user.isSuspended);
  }

  return success(res, 'Featured tutors retrieved successfully', { tutors: activeTutors, data: activeTutors });
});
