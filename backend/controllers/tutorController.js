const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const TutorProfile = require('../models/TutorProfile');
const ContactUnlock = require('../models/ContactUnlock');
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

  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  const result = await cloudinaryService.uploadProfilePhoto(req.file.buffer, req.user.id);
  
  if (tutorProfile.profilePhoto) {
     // TODO: [FUTURE] delete old photo from cloudinary using public_id
  }

  tutorProfile.profilePhoto = result.secure_url;
  await tutorProfile.save();

  return success(res, 'Profile photo uploaded successfully', { url: result.secure_url });
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
  const tutorProfile = await TutorProfile.findOneAndUpdate(
    { user: req.user.id },
    { availability: req.body.availability },
    { new: true, runValidators: true }
  );

  if (!tutorProfile) {
    return error(res, 'Tutor profile not found', 404);
  }

  return success(res, 'Availability updated successfully', { availability: tutorProfile.availability });
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
