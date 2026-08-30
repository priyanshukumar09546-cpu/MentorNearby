const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TutorProfile = require('../models/TutorProfile');
const Notification = require('../models/Notification');
const CoursePurchase = require('../models/CoursePurchase');
const StudyPurchase = require('../models/StudyPurchase');
const ContactUnlock = require('../models/ContactUnlock');
const TutorRequest = require('../models/TutorRequest');
const Review = require('../models/Review');

exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+phone');
  if (!user) {
    return error(res, 'User not found', 404);
  }

  let profile = null;
  let stats = {
    enrolledCourses: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    totalSpent: 0
  };
  let recentBookings = [];
  let reviewsGiven = [];
  let badges = [];

  if (user.role === 'STUDENT' || user.role === 'PARENT') {
    profile = await StudentProfile.findOne({ user: user._id });

    // Aggregate Real Metrics for the Authenticated Student
    try {
      // 1. Enrolled Courses Count
      const enrolledCoursesCount = await CoursePurchase.countDocuments({
        user: user._id,
        paymentStatus: 'COMPLETED'
      });

      // 2. Upcoming & Completed Sessions from Tutor Requests & Contact Unlocks
      const upcomingRequestsCount = await TutorRequest.countDocuments({
        student: user._id,
        status: { $in: ['ACCEPTED', 'PENDING'] }
      });
      const completedRequestsCount = await TutorRequest.countDocuments({
        student: user._id,
        status: 'COMPLETED'
      });

      // 3. Calculate Total Spending from Real Purchases
      const coursePurchases = await CoursePurchase.find({
        user: user._id,
        paymentStatus: 'COMPLETED'
      }).select('amount');
      const courseSpent = coursePurchases.reduce((acc, p) => acc + (p.amount || 0), 0);

      const studyPurchases = await StudyPurchase.find({
        user: user._id,
        status: 'COMPLETED'
      }).select('amount');
      const studySpent = studyPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);

      const contactUnlocks = await ContactUnlock.find({
        user: user._id,
        paymentStatus: 'COMPLETED'
      }).select('amount');
      const unlockSpent = contactUnlocks.reduce((acc, p) => acc + (p.amount || 0), 0);

      stats = {
        enrolledCourses: enrolledCoursesCount,
        upcomingSessions: upcomingRequestsCount,
        completedSessions: completedRequestsCount,
        totalSpent: courseSpent + studySpent + unlockSpent
      };

      // 4. Real Recent Bookings
      recentBookings = await TutorRequest.find({ student: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('tutor', 'name avatar email phone')
        .populate('requirement', 'subject class tuitionType');

      // 5. Real Reviews Written by Student
      reviewsGiven = await Review.find({ reviewer: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('tutor', 'name avatar');

      // 6. Badges (From profile or milestone-driven)
      badges = profile?.badges || [];
      if (badges.length === 0 && enrolledCoursesCount > 0) {
        badges.push({ name: 'Active Learner', category: 'Learning', icon: '🌟', color: '#2563EB' });
      }
    } catch (e) {
      console.error('[STUDENT STATS ERROR]', e);
    }

  } else if (user.role === 'TUTOR') {
    profile = await TutorProfile.findOne({ user: user._id });

    try {
      const profileViews = profile?.profileViews || 0;
      const studentRequestsCount = await TutorRequest.countDocuments({ tutor: user._id });
      const contactUnlocksCount = await ContactUnlock.countDocuments({ tutor: user._id, status: 'COMPLETED' });
      const paidUnlocks = await ContactUnlock.find({ tutor: user._id, status: 'COMPLETED', type: 'PAID' });
      const totalEarnings = profile?.totalEarnings || paidUnlocks.reduce((acc, u) => acc + (u.amount || 49), 0);

      const tutorReviews = await Review.find({ tutor: user._id, isHidden: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('reviewer', 'name avatar');

      const totalReviews = await Review.countDocuments({ tutor: user._id, isHidden: false });
      let avgRating = 0;
      if (totalReviews > 0) {
        const allRev = await Review.find({ tutor: user._id, isHidden: false }).select('rating');
        const sum = allRev.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Number((sum / totalReviews).toFixed(1));
      } else if (profile?.averageRating && profile?.totalReviews > 0) {
        avgRating = profile.averageRating;
      }

      stats = {
        profileViews,
        studentRequests: studentRequestsCount,
        contactUnlocks: contactUnlocksCount,
        totalEarnings,
        averageRating: avgRating,
        totalReviews
      };

      recentBookings = await TutorRequest.find({ tutor: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name avatar email phone')
        .populate('requirement', 'subject class');

      reviewsGiven = tutorReviews;
    } catch (e) {
      console.error('[TUTOR STATS ERROR]', e);
    }
  }

  return success(res, 'Profile retrieved successfully', {
    user,
    profile,
    stats,
    recentBookings,
    reviewsGiven,
    badges
  });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, avatar } = req.body;

  const updateFields = {};
  if (name !== undefined && name.trim()) updateFields.name = name.trim();
  if (phone !== undefined) updateFields.phone = phone.trim();
  if (avatar !== undefined) updateFields.avatar = avatar;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password +phone');

  return success(res, 'Profile updated successfully', { user });
});

exports.updateStudentProfile = asyncHandler(async (req, res, next) => {
  const {
    location,
    studentDetails,
    academicDetails,
    tuitionRequirements,
    parentDetails,
    whatsappNumber,
    profilePhoto,
    bio,
    aboutMe,
    learningGoals,
    preferredSubjects,
    preferredModes,
    badges
  } = req.body;

  let studentProfile = await StudentProfile.findOne({ user: req.user.id });

  const updateData = {};
  if (location !== undefined) updateData.location = location;
  if (studentDetails !== undefined) updateData.studentDetails = studentDetails;
  if (academicDetails !== undefined) updateData.academicDetails = academicDetails;
  if (tuitionRequirements !== undefined) updateData.tuitionRequirements = tuitionRequirements;
  if (parentDetails !== undefined) updateData.parentDetails = parentDetails;
  if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
  if (bio !== undefined) updateData.bio = bio;
  if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
  if (learningGoals !== undefined) updateData.learningGoals = Array.isArray(learningGoals) ? learningGoals : [learningGoals];
  if (preferredSubjects !== undefined) updateData.preferredSubjects = Array.isArray(preferredSubjects) ? preferredSubjects : [preferredSubjects];
  if (preferredModes !== undefined) updateData.preferredModes = Array.isArray(preferredModes) ? preferredModes : [preferredModes];
  if (badges !== undefined) updateData.badges = badges;

  if (profilePhoto) {
    const photoObj = typeof profilePhoto === 'string' ? { url: profilePhoto } : profilePhoto;
    updateData.profilePhoto = photoObj;
    if (photoObj.url) {
      await User.findByIdAndUpdate(req.user.id, { avatar: photoObj.url });
    }
  }

  if (studentProfile) {
    studentProfile = await StudentProfile.findByIdAndUpdate(
      studentProfile._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  } else {
    studentProfile = await StudentProfile.create({
      user: req.user.id,
      ...updateData
    });
  }

  return success(res, 'Student profile updated successfully', { studentProfile });
});

exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isActive: false, isSuspended: true, suspensionReason: 'Account deleted by user' },
    { new: true }
  );

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });

  return success(res, 'Account deleted successfully');
});

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const startIndex = (page - 1) * limit;

  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments({ user: req.user.id });

  return success(res, 'Notifications retrieved', {
    notifications,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return error(res, 'Notification not found', 404);
  }

  return success(res, 'Notification marked as read', { notification });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true }
  );

  return success(res, 'All notifications marked as read');
});

// @desc    Get featured student requirements / leads
// @route   GET /api/users/students/featured
// @access  Public
exports.getFeaturedStudents = asyncHandler(async (req, res, next) => {
  const TuitionRequirement = require('../models/TuitionRequirement');
  const requirements = await TuitionRequirement.find({
    status: { $in: ['OPEN', 'Open'] }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return success(res, 'Featured students retrieved successfully', { students: requirements });
});

// @desc    Get public student profile by ID or Requirement ID
// @route   GET /api/users/students/:id
// @access  Public
exports.getPublicStudentProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const TuitionRequirement = require('../models/TuitionRequirement');

  // 1. Try finding TuitionRequirement first if ID corresponds to requirement
  let requirement = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    requirement = await TuitionRequirement.findById(id).populate('student', 'name email avatar role createdAt');
  }

  let studentUserId = requirement?.student?._id || requirement?.student || id;

  // 2. Find StudentProfile and User
  let studentProfile = null;
  let studentUser = null;

  if (mongoose.Types.ObjectId.isValid(studentUserId)) {
    studentProfile = await StudentProfile.findOne({
      $or: [{ _id: studentUserId }, { user: studentUserId }]
    }).populate('user', 'name email avatar role createdAt isVerified phoneVerified');

    if (studentProfile && studentProfile.user) {
      studentUser = studentProfile.user;
    } else {
      studentUser = await User.findById(studentUserId).select('name email avatar role createdAt isVerified phoneVerified');
      if (studentUser) {
        studentProfile = await StudentProfile.findOne({ user: studentUser._id });
      }
    }
  }

  if (!studentUser && !requirement && !studentProfile) {
    return error(res, 'Student profile not found', 404);
  }

  // Fetch their open requirements if not already loaded
  const studentOpenRequirements = await TuitionRequirement.find({
    student: studentUser?._id || studentUserId,
    status: { $in: ['OPEN', 'Open'] }
  }).sort({ createdAt: -1 });

  return success(res, 'Student profile retrieved successfully', {
    student: {
      _id: studentUser?._id || requirement?._id || id,
      name: requirement?.studentName || studentUser?.name || studentProfile?.studentDetails?.name || 'Student Lead',
      avatar: studentUser?.avatar || studentProfile?.profilePhoto?.url || '',
      role: studentUser?.role || 'STUDENT',
      createdAt: studentUser?.createdAt || requirement?.createdAt || Date.now(),
      isVerified: studentUser?.isVerified || studentProfile?.isVerified || false,
      studentDetails: {
        class: studentProfile?.studentDetails?.class || requirement?.class || requirement?.studentClass || 'Class 10',
        board: studentProfile?.studentDetails?.board || requirement?.board || 'CBSE',
        medium: studentProfile?.studentDetails?.medium || requirement?.medium || 'English',
      },
      academicDetails: {
        subjectsRequired: studentProfile?.academicDetails?.subjectsRequired || requirement?.subjects || ['All Subjects'],
      },
      schoolDetails: {
        schoolName: studentProfile?.schoolDetails?.schoolName || 'Verified School',
      },
      location: {
        city: studentProfile?.location?.city || requirement?.location?.city || 'Local Area',
        area: studentProfile?.location?.area || requirement?.location?.area || 'Nearby',
      },
      tuitionRequirements: {
        mode: requirement?.teachingMode || studentProfile?.tuitionRequirements?.mode || 'Home Tuition',
        budget: requirement?.budget?.amount ? `₹${requirement.budget.amount}/mo` : (studentProfile?.tuitionRequirements?.budget || '₹5000/mo'),
        frequency: requirement?.budget?.frequency || 'PER_MONTH',
        preferredDays: requirement?.preferences?.days || studentProfile?.tuitionRequirements?.preferredDays || ['Monday - Friday'],
        preferredTime: requirement?.preferences?.time || studentProfile?.tuitionRequirements?.preferredTime || 'Evening (4:00 PM - 7:00 PM)',
      },
      bio: studentProfile?.bio || studentProfile?.aboutMe || requirement?.preferences?.additionalRequirements || 'Seeking dedicated and qualified tutor for academic excellence.',
      requirements: studentOpenRequirements.length > 0 ? studentOpenRequirements : (requirement ? [requirement] : []),
      primaryRequirement: requirement || studentOpenRequirements[0] || null,
    }
  });
});

// @desc    Get user profile by User ID or Tutor/Student profile ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return error(res, 'Invalid user ID', 400);
  }

  let user = await User.findById(id).select('name email avatar role isVerified createdAt isOnline lastLogin');
  let tutorProfile = null;
  let studentProfile = null;

  if (user) {
    if (user.role === 'TUTOR') {
      tutorProfile = await TutorProfile.findOne({ user: user._id }).lean();
    } else {
      studentProfile = await StudentProfile.findOne({ user: user._id }).lean();
    }
  } else {
    // Check if ID is a TutorProfile ID
    tutorProfile = await TutorProfile.findById(id).populate('user', 'name email avatar role isVerified createdAt isOnline lastLogin').lean();
    if (tutorProfile && tutorProfile.user) {
      user = tutorProfile.user;
    } else {
      // Check if ID is a StudentProfile ID
      studentProfile = await StudentProfile.findById(id).populate('user', 'name email avatar role isVerified createdAt isOnline lastLogin').lean();
      if (studentProfile && studentProfile.user) {
        user = studentProfile.user;
      }
    }
  }

  if (!user) {
    return error(res, 'User not found', 404);
  }

  return success(res, 'User fetched successfully', {
    _id: user._id,
    name: user.name,
    avatar: user.avatar || tutorProfile?.profilePhoto?.url || studentProfile?.profilePhoto?.url || '',
    role: user.role,
    isVerified: Boolean(user.isVerified || tutorProfile?.isVerified || tutorProfile?.kycStatus === 'VERIFIED'),
    isOnline: Boolean(user.isOnline || (user.lastLogin && (Date.now() - new Date(user.lastLogin).getTime() < 15 * 60 * 1000))),
    lastLogin: user.lastLogin,
    tutorProfile: tutorProfile ? {
      _id: tutorProfile._id,
      subjects: tutorProfile.subjects,
      experience: tutorProfile.experience,
      pricing: tutorProfile.pricing,
      location: tutorProfile.location,
      averageRating: tutorProfile.averageRating || 4.9,
      totalReviews: tutorProfile.totalReviews || 0,
      isVerified: Boolean(tutorProfile.isVerified || tutorProfile.kycStatus === 'VERIFIED'),
      bio: tutorProfile.bio || tutorProfile.about || '',
    } : null,
    studentProfile: studentProfile ? {
      _id: studentProfile._id,
      class: studentProfile.studentDetails?.class || studentProfile.grade,
      board: studentProfile.studentDetails?.board,
      location: studentProfile.location,
      about: studentProfile.about || '',
      budget: studentProfile.budget,
      subjects: studentProfile.subjects,
    } : null,
  });
});
