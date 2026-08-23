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
      const contactUnlocksCount = await ContactUnlock.countDocuments({ tutor: user._id });
      const totalEarnings = contactUnlocksCount * 49;

      const tutorReviews = await Review.find({ tutor: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('reviewer', 'name avatar');

      const totalReviews = await Review.countDocuments({ tutor: user._id });
      let avgRating = profile?.averageRating || 5.0;
      if (totalReviews > 0) {
        const allRev = await Review.find({ tutor: user._id }).select('rating');
        const sum = allRev.reduce((acc, r) => acc + (r.rating || 5), 0);
        avgRating = Number((sum / totalReviews).toFixed(1));
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
