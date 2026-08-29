const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const TutorProfile = require('../models/TutorProfile');
const ContactUnlock = require('../models/ContactUnlock');
const Review = require('../models/Review');
const TutorRequest = require('../models/TutorRequest');
const cloudinaryService = require('../services/cloudinaryService');

exports.getTutorProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const mongoose = require('mongoose');
  const User = require('../models/User');

  let orConditions = [];

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const objId = new mongoose.Types.ObjectId(id);
    orConditions.push({ _id: objId });
    orConditions.push({ user: objId });
  }

  // Also query string fields & slugs
  orConditions.push({ _id: id });
  orConditions.push({ user: id });
  orConditions.push({ userId: id });
  orConditions.push({ slug: id });

  // If hex string between 8 and 32 chars (e.g. 23-char hex 6a8fcf723a3c01cae238c28), match regex or substring
  if (typeof id === 'string' && /^[0-9a-fA-F]{8,32}$/.test(id)) {
    try {
      orConditions.push({ slug: new RegExp(`^${id}`, 'i') });
    } catch (e) {}
  }

  let tutorProfile = await TutorProfile.findOneAndUpdate(
    { $or: orConditions },
    { $inc: { profileViews: 1 } },
    { new: true }
  ).populate('user', 'name email emailVerified phoneVerified avatar profilePic isSuspended role subscriptionType subscriptionExpiry contactUnlocks');

  // Fallback: Look up user first
  if (!tutorProfile) {
    let userQuery = [{ email: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      userQuery.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    const user = await User.findOne({ $or: userQuery });
    if (user) {
      tutorProfile = await TutorProfile.findOne({ user: user._id })
        .populate('user', 'name email emailVerified phoneVerified avatar profilePic isSuspended role subscriptionType subscriptionExpiry contactUnlocks');
    }
  }

  // Fallback: Search partial matches if id is hex string
  if (!tutorProfile && typeof id === 'string' && /^[0-9a-fA-F]{8,32}$/.test(id)) {
    const allProfiles = await TutorProfile.find({})
      .populate('user', 'name email avatar profilePic isSuspended role subscriptionType subscriptionExpiry contactUnlocks')
      .limit(50);
    tutorProfile = allProfiles.find(p => {
      const pId = String(p._id);
      const uId = String(p.user?._id || p.user || '');
      return pId.includes(id) || id.includes(pId) || uId.includes(id) || id.includes(uId);
    });
  }

  // Fallback: If single tutor in DB
  if (!tutorProfile) {
    const count = await TutorProfile.countDocuments();
    if (count === 1) {
      tutorProfile = await TutorProfile.findOne({})
        .populate('user', 'name email avatar profilePic isSuspended role subscriptionType subscriptionExpiry contactUnlocks');
    }
  }

  if (!tutorProfile || tutorProfile.user?.isSuspended) {
    return error(res, 'Tutor profile not found or inactive', 404);
  }

  // Ensure user object exists even if orphaned
  if (!tutorProfile.user) {
    tutorProfile.user = {
      _id: tutorProfile._id,
      name: tutorProfile.name || 'Verified Tutor',
      role: 'TUTOR',
      isSuspended: false
    };
  }

  // Check viewer's authorization to see unmasked phone number
  let isUnlocked = false;
  const currentUserId = req.user?._id || req.user?.id;
  if (currentUserId) {
    const viewer = await User.findById(currentUserId);
    const isAdmin = viewer?.role === 'ADMIN';
    const isPro = viewer?.subscriptionType === 'pro' && viewer?.subscriptionExpiry && new Date(viewer.subscriptionExpiry) > new Date();

    if (isAdmin || isPro || String(viewer?._id) === String(tutorProfile.user?._id)) {
      isUnlocked = true;
    } else {
      const existingUnlock = await ContactUnlock.findOne({
        user: currentUserId,
        $or: [{ tutor: tutorProfile._id }, { 'paymentDetails.targetId': tutorProfile._id }],
        paymentStatus: 'COMPLETED'
      });
      if (existingUnlock) isUnlocked = true;
    }
  }

  const rawPhone = tutorProfile.phone || tutorProfile.user?.phone || '';
  const maskedPhone = rawPhone && rawPhone.length > 4 
    ? `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`
    : '**********';

  const profileObj = tutorProfile.toObject ? tutorProfile.toObject() : { ...tutorProfile };
  if (!isUnlocked) {
    profileObj.phone = maskedPhone;
    profileObj.whatsappNumber = null;
    if (profileObj.user) {
      profileObj.user.phone = maskedPhone;
    }
  }
  profileObj.isUnlocked = isUnlocked;

  return res.status(200).json({
    success: true,
    message: 'Tutor profile retrieved successfully',
    data: { tutorProfile: profileObj, isUnlocked },
    tutorProfile: profileObj,
    tutor: profileObj,
    isUnlocked,
  });
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
  const sat = req.body.saturdayHours || req.body['Saturday Hours'] || req.body.saturday || 'Not Available';
  const sun = req.body.sundayHours || req.body['Sunday Status / Hours'] || req.body.sunday || 'Not Available';

  const isSatAvail = Boolean(sat && sat.toLowerCase() !== 'not available' && sat.toLowerCase() !== 'off' && sat.toLowerCase() !== 'none' && sat.trim() !== '');
  const isSunAvail = Boolean(sun && sun.toLowerCase() !== 'not available' && sun.toLowerCase() !== 'off' && sun.toLowerCase() !== 'none' && sun.trim() !== '');

  const satVal = isSatAvail ? sat : 'Not Available';
  const sunVal = isSunAvail ? sun : 'Not Available';

  const structuredAvailability = {
    mondayFriday: mf,
    mondayFridayHours: mf,
    weekdays: mf,
    saturday: satVal,
    saturdayHours: satVal,
    sunday: sunVal,
    sundayHours: sunVal,
    monday: { available: true, slots: [mf] },
    tuesday: { available: true, slots: [mf] },
    wednesday: { available: true, slots: [mf] },
    thursday: { available: true, slots: [mf] },
    friday: { available: true, slots: [mf] },
    saturdaySlot: { available: isSatAvail, slots: isSatAvail ? [sat] : [] },
    sundaySlot: { available: isSunAvail, slots: isSunAvail ? [sun] : [] }
  };

  const userId = req.user?._id || req.user?.id;

  const tutorProfile = await TutorProfile.findOneAndUpdate(
    { $or: [{ user: userId }, { userId: userId }, { _id: userId }] },
    { $set: { availability: structuredAvailability } },
    { new: true, upsert: true }
  );

  return success(res, 'Availability schedule updated successfully', {
    success: true,
    availability: tutorProfile.availability,
    mondayFridayHours: mf,
    saturdayHours: satVal,
    sundayHours: sunVal
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
  const tutors = await TutorProfile.find({ profileVisibility: { $ne: false } })
    .populate('user', 'name email avatar profilePic role isSuspended subscriptionType subscriptionExpiry')
    .limit(30)
    .lean();

  const now = new Date();

  // Exclude suspended / deleted accounts
  const activeTutors = tutors.filter(t => !t.user || !t.user.isSuspended);

  // Sorting rank: Pro tutors first, then verified, then profile completion %, then rating & newest
  activeTutors.sort((a, b) => {
    const aIsPro = a.user?.subscriptionType === 'pro' && a.user?.subscriptionExpiry && new Date(a.user.subscriptionExpiry) > now;
    const bIsPro = b.user?.subscriptionType === 'pro' && b.user?.subscriptionExpiry && new Date(b.user.subscriptionExpiry) > now;
    if (aIsPro && !bIsPro) return -1;
    if (!aIsPro && bIsPro) return 1;

    const aVerified = a.isVerified || a.isApproved || a.kycStatus === 'VERIFIED';
    const bVerified = b.isVerified || b.isApproved || b.kycStatus === 'VERIFIED';
    if (aVerified && !bVerified) return -1;
    if (!aVerified && bVerified) return 1;

    const aComp = a.profileCompletionPercentage || 0;
    const bComp = b.profileCompletionPercentage || 0;
    if (aComp !== bComp) return bComp - aComp;

    const aRating = a.averageRating || 0;
    const bRating = b.averageRating || 0;
    if (aRating !== bRating) return bRating - aRating;

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const slicedTutors = activeTutors.slice(0, 12);

  const safeTutors = slicedTutors.map(t => {
    if (!t.user) {
      t.user = { _id: t._id, name: t.name || 'Verified Tutor', role: 'TUTOR' };
    }
    // Mask sensitive contact details publicly
    t.phone = '**********';
    t.whatsappNumber = null;
    return t;
  });

  return res.json({
    success: true,
    data: safeTutors,
    tutors: safeTutors
  });
});

exports.getTutorById = exports.getTutorProfile;
