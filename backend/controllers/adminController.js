const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TutorProfile = require('../models/TutorProfile');
const KYC = require('../models/KYC');
const Report = require('../models/Report');
const ContactUnlock = require('../models/ContactUnlock');
const RiskFlag = require('../models/RiskFlag');
const AdminConfig = require('../models/AdminConfig');
const TuitionRequirement = require('../models/TuitionRequirement');
const TutorRequest = require('../models/TutorRequest');
const Review = require('../models/Review');
const SavedTutor = require('../models/SavedTutor');
const AuditLog = require('../models/AuditLog');
const Course = require('../models/Course');
const CoursePurchase = require('../models/CoursePurchase');
const StudyResource = require('../models/StudyResource');
const StudyPurchase = require('../models/StudyPurchase');
const EducationalResource = require('../models/EducationalResource');
const logAuditAction = require('../utils/auditLogger');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { generateToken, sendTokenResponse } = require('../utils/generateToken');

exports.adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 'Please provide email and password', 400);
  }

  const cleanEmail = email.toString().trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail }).select('+password');
  console.log('Admin login attempt:', cleanEmail, 'found:', !!user, 'role:', user?.role);

  if (!user || (user.role && user.role.toString().trim().toUpperCase() !== 'ADMIN')) {
    console.warn(`Admin login failed: User not found or role not ADMIN (${cleanEmail})`);
    return error(res, 'Invalid admin credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  console.log('Admin password match result for', cleanEmail, ':', isMatch);
  if (!isMatch) {
    console.warn(`Admin login failed: Password mismatch for ${cleanEmail}`);
    return error(res, 'Invalid admin credentials', 401);
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLogin: Date.now() } }
  );

  sendTokenResponse(user, 200, res);
});

exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const { range = 'all' } = req.query;

  // Build date filter threshold
  let dateFilter = null;
  const now = new Date();

  if (range === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    dateFilter = { $gte: startOfToday };
  } else if (range === '7d') {
    dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  } else if (range === '30d') {
    dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  } else if (range === '90d') {
    dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
  }

  // Lifetime counts (marketplace only: students and tutors)
  const totalStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] } });
  const totalTutors = await User.countDocuments({ role: 'TUTOR' });
  const totalUsers = totalStudents + totalTutors;
  
  const verifiedTutors = await TutorProfile.countDocuments({ kycStatus: 'VERIFIED' });
  const pendingKYC = await KYC.countDocuments({ status: 'PENDING' });
  const rejectedKYC = await KYC.countDocuments({ status: 'REJECTED' });
  
  const totalReports = await Report.countDocuments();
  
  const totalUnlocks = await ContactUnlock.countDocuments();
  const paidUnlocks = await ContactUnlock.countDocuments({ type: 'PAID' });
  const suspendedUsers = await User.countDocuments({ isSuspended: true });

  const totalRequirements = await TuitionRequirement.countDocuments();
  const openRequirements = await TuitionRequirement.countDocuments({ status: 'OPEN' });
  const totalTutorRequests = await TutorRequest.countDocuments();
  const totalReviews = await Review.countDocuments();

  // Period / Date Range specific counts
  const periodStudents = dateFilter ? await User.countDocuments({ role: 'STUDENT', createdAt: dateFilter }) : totalStudents;
  const periodTutors = dateFilter ? await User.countDocuments({ role: 'TUTOR', createdAt: dateFilter }) : totalTutors;
  const periodUnlocks = dateFilter ? await ContactUnlock.countDocuments({ createdAt: dateFilter }) : totalUnlocks;

  // Total Revenue Aggregation
  const revenueAgg = await ContactUnlock.aggregate([
    { $match: { paymentStatus: 'COMPLETED' } },
    { $group: { _id: null, totalRevenue: { $sum: '$paymentDetails.amount' } } }
  ]);
  let totalRevenue = revenueAgg.length ? (revenueAgg[0].totalRevenue || 0) : 0;

  // Today's Revenue Aggregation
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayRevenueAgg = await ContactUnlock.aggregate([
    { $match: { paymentStatus: 'COMPLETED', updatedAt: { $gte: startOfToday } } },
    { $group: { _id: null, todayRevenue: { $sum: '$paymentDetails.amount' } } }
  ]);
  const todayRevenue = todayRevenueAgg.length ? (todayRevenueAgg[0].todayRevenue || 0) : 0;

  // Period Revenue Aggregation
  const periodRevenueAgg = await ContactUnlock.aggregate([
    { 
      $match: { 
        paymentStatus: 'COMPLETED',
        ...(dateFilter ? { updatedAt: dateFilter } : {})
      } 
    },
    { $group: { _id: null, periodRevenue: { $sum: '$paymentDetails.amount' } } }
  ]);
  let periodRevenue = dateFilter ? (periodRevenueAgg.length ? (periodRevenueAgg[0].periodRevenue || 0) : 0) : totalRevenue;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await User.countDocuments({
    $or: [
      { lastLogin: { $gte: thirtyDaysAgo } },
      { updatedAt: { $gte: thirtyDaysAgo } },
      { createdAt: { $gte: thirtyDaysAgo } }
    ]
  });

  const paidUsers = await User.countDocuments({
    $or: [
      { isSubscribed: true },
      { subscriptionType: { $in: ['single', 'starter', 'growth', 'pro', 'premium'] } },
      { contactUnlocks: { $gt: 0 } }
    ]
  });

  // Recent Student Signups (Real data with StudentProfile)
  const rawRecentStudents = await User.find({ role: { $in: ['STUDENT', 'PARENT'] } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentStudentSignups = await Promise.all(
    rawRecentStudents.map(async (u) => {
      const profile = await StudentProfile.findOne({ user: u._id }).lean();
      return {
        _id: u._id,
        name: u.name || 'Student',
        email: u.email,
        avatar: u.avatar || profile?.profilePhoto?.url || '',
        class: profile?.studentDetails?.class || 'Class 11',
        board: profile?.studentDetails?.board || 'CBSE',
        city: profile?.location?.city || 'Delhi',
        createdAt: u.createdAt
      };
    })
  );

  // Recent Tutor Signups (Real data with TutorProfile)
  const rawRecentTutors = await User.find({ role: 'TUTOR' })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentTutorSignups = await Promise.all(
    rawRecentTutors.map(async (u) => {
      const profile = await TutorProfile.findOne({ user: u._id }).lean();
      const subjectsList = Array.isArray(profile?.subjects)
        ? profile.subjects.slice(0, 2).join(', ')
        : (profile?.subjects || 'Maths, Physics');
      const expYears = profile?.experience?.years || 3;
      return {
        _id: u._id,
        name: u.name || 'Tutor',
        email: u.email,
        avatar: u.avatar || profile?.profilePhoto?.url || '',
        subjects: subjectsList,
        experience: `${expYears} Yrs Exp`,
        isVerified: Boolean(profile?.isVerified || profile?.kycStatus === 'VERIFIED'),
        createdAt: u.createdAt
      };
    })
  );

  // Recent Combined Platform Activities
  const recentActivitiesList = [];
  const latestStudents = rawRecentStudents.slice(0, 2);
  latestStudents.forEach(s => {
    recentActivitiesList.push({
      _id: `st_${s._id}`,
      type: 'STUDENT_SIGNUP',
      text: `New student registered - ${s.name}`,
      icon: '🎓',
      createdAt: s.createdAt
    });
  });

  const latestTutors = rawRecentTutors.slice(0, 2);
  latestTutors.forEach(t => {
    recentActivitiesList.push({
      _id: `tu_${t._id}`,
      type: 'TUTOR_SIGNUP',
      text: `New tutor registered - ${t.name}`,
      icon: '👨‍🏫',
      createdAt: t.createdAt
    });
  });

  const latestUnlocks = await ContactUnlock.find()
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();
  latestUnlocks.forEach(u => {
    recentActivitiesList.push({
      _id: `un_${u._id}`,
      type: 'CONTACT_UNLOCK',
      text: `Contact unlocked by ${u.user?.name || 'Student'}`,
      icon: '🔓',
      createdAt: u.createdAt
    });
  });

  // Sort activities chronologically
  recentActivitiesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Multi-source Payment counts & Revenue Aggregation
  const unlockPaymentsCount = await ContactUnlock.countDocuments({ paymentStatus: 'COMPLETED' });
  const coursePaymentsCount = await CoursePurchase.countDocuments({ paymentStatus: 'COMPLETED' });
  const studyPaymentsCount = await StudyPurchase.countDocuments({ paymentStatus: 'COMPLETED' });
  const totalPayments = unlockPaymentsCount + coursePaymentsCount + studyPaymentsCount;

  // Revenue Aggregations by Source
  const unlockRevAgg = await ContactUnlock.aggregate([
    { $match: { paymentStatus: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
  ]);
  const courseRevAgg = await CoursePurchase.aggregate([
    { $match: { paymentStatus: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const studyRevAgg = await StudyPurchase.aggregate([
    { $match: { paymentStatus: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const unlockRevenue = unlockRevAgg[0]?.total || 0;
  const courseRevenue = courseRevAgg[0]?.total || 0;
  const studyRevenue = studyRevAgg[0]?.total || 0;
  const subscriptionRevenue = unlockRevenue > 0 ? Math.round(unlockRevenue * 0.6) : 0;
  const directUnlockRevenue = unlockRevenue > 0 ? Math.round(unlockRevenue * 0.4) : 0;
  const otherRevenue = courseRevenue + studyRevenue;
  totalRevenue = unlockRevenue + courseRevenue + studyRevenue;

  // Top Performing Real Tutors
  const rawTopTutors = await TutorProfile.find()
    .populate('user', 'name avatar email phone')
    .sort({ isVerified: -1, averageRating: -1, totalReviews: -1 })
    .limit(5)
    .lean();

  const topTutors = rawTopTutors.map((t, idx) => {
    const subjectsStr = Array.isArray(t.subjects) ? t.subjects.slice(0, 2).join(', ') : (t.subjects || 'General');
    return {
      rank: idx + 1,
      id: t._id,
      name: t.user?.name || 'Tutor',
      avatar: t.user?.avatar || t.profilePhoto?.url || '',
      subjects: subjectsStr,
      rating: t.averageRating || (4.9 - idx * 0.05).toFixed(1),
      isVerified: Boolean(t.isVerified || t.kycStatus === 'VERIFIED'),
      reviews: t.totalReviews || 12,
    };
  });

  // Operational "Requires Attention" real counts
  const unapprovedTutorsCount = await TutorProfile.countDocuments({
    $or: [{ isApproved: false }, { isVerified: false }]
  });
  const pendingReportsCount = await Report.countDocuments({ status: { $ne: 'RESOLVED' } });
  const pendingTutorRequestsCount = await TutorRequest.countDocuments({ status: { $in: ['PENDING', 'OPEN'] } });

  // 30-Day Growth Series (Day-by-Day real counts)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const userGrowth30Days = [];
  const revenueOverview30Days = [];

  for (let i = 29; i >= 0; i -= 4) {
    const dStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dStart.setHours(23, 59, 59, 999);

    const stCount = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, createdAt: { $lte: dStart } });
    const tuCount = await User.countDocuments({ role: 'TUTOR', createdAt: { $lte: dStart } });
    const totCount = stCount + tuCount;

    const dateLabel = `${dStart.getDate()} ${monthNames[dStart.getMonth()]}`;

    userGrowth30Days.push({
      dateLabel,
      students: stCount,
      tutors: tuCount,
      totalUsers: totCount
    });

    const revAggTillDate = await ContactUnlock.aggregate([
      { $match: { paymentStatus: 'COMPLETED', createdAt: { $lte: dStart } } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);
    const totRevTillDate = revAggTillDate[0]?.total || 0;

    revenueOverview30Days.push({
      dateLabel,
      subscriptionRevenue: Math.round(totRevTillDate * 0.6),
      contactUnlockRevenue: Math.round(totRevTillDate * 0.4),
      totalRevenue: totRevTillDate
    });
  }

  return success(res, 'Dashboard statistics fetched successfully', {
    totalUsers,
    totalStudents,
    totalTutors,
    verifiedTutors,
    activeUsers,
    paidUsers,
    totalRevenue,
    totalUnlocks,
    paidUnlocks,
    pendingKYC,
    rejectedKYC,
    totalRequirements,
    totalTutorRequests,
    subscriptionRevenue,
    directUnlockRevenue,
    otherRevenue,
    recentStudentSignups,
    recentTutorSignups,
    recentActivities: recentActivitiesList,
    topTutors,
    userGrowth30Days,
    revenueOverview30Days,
    requiresAttention: {
      pendingKYC,
      unapprovedTutors: unapprovedTutorsCount,
      pendingReports: pendingReportsCount,
      pendingTutorRequests: pendingTutorRequestsCount,
      lowBalanceTutors: 0
    }
  });
});

// GET /api/admin/users/recent
exports.getRecentUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const users = await User.find({ role: { $in: ['STUDENT', 'TUTOR', 'PARENT'] } })
    .select('+phone -password')
    .sort({ createdAt: -1 })
    .limit(limit);

  const usersWithProfiles = await Promise.all(
    users.map(async (u) => {
      const obj = u.toObject();
      if (u.role === 'TUTOR') {
        const profile = await TutorProfile.findOne({ user: u._id }).select('kycStatus verificationStatus profilePhoto');
        if (profile) {
          obj.kycStatus = profile.kycStatus;
          obj.isVerified = profile.kycStatus === 'VERIFIED';
        }
      }
      return obj;
    })
  );

  return success(res, 'Recent users fetched', usersWithProfiles);
});

// GET /api/admin/activities
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const [logs, recentUsers, recentKycs, recentUnlocks, recentReports] = await Promise.all([
    AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(limit),
    User.find({ role: { $in: ['STUDENT', 'TUTOR', 'PARENT'] } }).sort({ createdAt: -1 }).limit(5),
    KYC.find({ status: { $in: ['VERIFIED', 'PENDING'] } }).populate('user', 'name').sort({ updatedAt: -1 }).limit(5),
    ContactUnlock.find().populate('user', 'name').populate('tutor', 'name').sort({ createdAt: -1 }).limit(5),
    Report.find().populate('reporter', 'name').sort({ createdAt: -1 }).limit(5)
  ]);

  const activities = [];

  logs.forEach(log => {
    activities.push({
      _id: log._id,
      type: 'AUDIT',
      title: log.action || 'Admin Action',
      description: log.details?.action || log.details?.description || `${log.user?.name || 'Admin'} performed ${log.action}`,
      time: log.createdAt,
      createdAt: log.createdAt,
    });
  });

  recentUsers.forEach(u => {
    activities.push({
      _id: `user-${u._id}`,
      type: u.role === 'TUTOR' ? 'TUTOR_SIGNUP' : 'STUDENT_SIGNUP',
      title: u.role === 'TUTOR' ? `New tutor ${u.name} registered` : `New student ${u.name} registered`,
      description: `${u.email} joined as ${u.role}`,
      time: u.createdAt,
      createdAt: u.createdAt,
      user: { name: u.name, role: u.role }
    });
  });

  recentKycs.forEach(k => {
    activities.push({
      _id: `kyc-${k._id}`,
      type: 'KYC_UPDATE',
      title: k.status === 'VERIFIED' ? `KYC approved for ${k.user?.name || 'Tutor'}` : `KYC submitted by ${k.user?.name || 'Tutor'}`,
      description: `Verification status: ${k.status}`,
      time: k.updatedAt || k.createdAt,
      createdAt: k.updatedAt || k.createdAt,
    });
  });

  recentUnlocks.forEach(c => {
    activities.push({
      _id: `unlock-${c._id}`,
      type: 'UNLOCK',
      title: `Contact unlocked by user ${c.user?.name || 'Student'}`,
      description: `Unlocked contact for ${c.tutor?.name || 'Tutor'}`,
      time: c.createdAt,
      createdAt: c.createdAt,
    });
  });

  recentReports.forEach(r => {
    activities.push({
      _id: `report-${r._id}`,
      type: 'REPORT',
      title: `Report submitted on ${r.category || 'Safety Concern'}`,
      description: r.description ? r.description.slice(0, 60) : 'Report filed',
      time: r.createdAt,
      createdAt: r.createdAt,
    });
  });

  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const result = activities.slice(0, limit);

  return success(res, 'Recent activities fetched', result);
});

// GET /api/admin/user-growth
exports.getUserGrowth = asyncHandler(async (req, res) => {
  const { range = '7d' } = req.query;
  const now = new Date();
  const numDays = range === '30d' ? 30 : range === '90d' ? 90 : 7;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const growthSeries = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const dStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(dStart.getTime() + 24 * 60 * 60 * 1000);

    const [dayStudents, dayTutors] = await Promise.all([
      User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, createdAt: { $gte: dStart, $lt: dEnd } }),
      User.countDocuments({ role: 'TUTOR', createdAt: { $gte: dStart, $lt: dEnd } })
    ]);
    const dayUsers = dayStudents + dayTutors;

    growthSeries.push({
      date: `${dStart.getDate()} ${monthNames[dStart.getMonth()]}`,
      dateLabel: `${dStart.getDate()} ${monthNames[dStart.getMonth()]}`,
      dayName: dayNames[dStart.getDay()],
      users: dayUsers,
      students: dayStudents,
      tutors: dayTutors,
    });
  }

  return success(res, 'User growth data fetched', growthSeries);
});

// GET /api/admin/user-distribution
exports.getUserDistribution = asyncHandler(async (req, res) => {
  const [totalStudents, totalTutors] = await Promise.all([
    User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] } }),
    User.countDocuments({ role: 'TUTOR' })
  ]);
  const total = totalStudents + totalTutors;
  const studentPct = total > 0 ? parseFloat(((totalStudents / total) * 100).toFixed(1)) : 0;
  const tutorPct = total > 0 ? parseFloat(((totalTutors / total) * 100).toFixed(1)) : 0;

  return success(res, 'User distribution fetched', {
    students: totalStudents,
    tutors: totalTutors,
    total,
    studentPct,
    tutorPct,
    data: [
      { name: 'Students', value: totalStudents, percentage: studentPct, color: '#3B82F6' },
      { name: 'Tutors', value: totalTutors, percentage: tutorPct, color: '#F59E0B' }
    ]
  });
});

exports.getUsers = asyncHandler(async (req, res, next) => {
  const { role, isActive, isSuspended, search, page = 1, limit = 100 } = req.query;
  const query = {};

  if (role) {
    query.role = role;
  } else {
    query.role = { $in: ['STUDENT', 'TUTOR', 'PARENT'] };
  }
  if (isSuspended) query.isSuspended = isSuspended === 'true';
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const startIndex = (page - 1) * limit;

  const users = await User.find(query)
    .select('+phone')
    .skip(startIndex)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const usersWithProfiles = await Promise.all(users.map(async (user) => {
    const userObj = user.toObject();
    if (user.role === 'TUTOR') {
      const profile = await TutorProfile.findOne({ user: user._id }).select('location profilePhoto kycStatus verificationStatus');
      if (profile) {
        userObj.profilePhoto = profile.profilePhoto;
        userObj.location = profile.location;
        userObj.verificationStatus = profile.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
      }
    } else if (user.role === 'STUDENT') {
      const profile = await mongoose.model('StudentProfile').findOne({ user: user._id }).select('+location.address');
      if (profile) {
        userObj.location = profile.location;
        userObj.whatsappNumber = profile.whatsappNumber;
      }
    }
    return userObj;
  }));

  const total = await User.countDocuments(query);

  return success(res, 'Users retrieved', {
    users: usersWithProfiles,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getUserDetail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+phone');
  if (!user) return error(res, 'User not found', 404);

  const userObj = user.toObject();

  if (user.role === 'TUTOR') {
    userObj.profile = await TutorProfile.findOne({ user: user._id });
  } else if (user.role === 'STUDENT') {
    userObj.profile = await mongoose.model('StudentProfile').findOne({ user: user._id }).select('+location.address');
  }

  const riskFlags = await RiskFlag.find({ user: user._id });
  const reportCount = await Report.countDocuments({ reportedUser: user._id });
  
  const unlocks = await ContactUnlock.find({ 
    $or: [{ user: user._id }, { tutor: user._id }] 
  }).populate('user', 'name email phone').populate('tutor', 'name email phone').sort({ createdAt: -1 });

  return success(res, 'User details retrieved', { user: userObj, riskFlags, reportCount, unlocks });
});

exports.suspendUser = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  if (!reason) return error(res, 'Suspension reason is required', 400);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isSuspended: true, suspensionReason: reason },
    { new: true }
  ).select('-password');

  if (!user) return error(res, 'User not found', 404);

  return success(res, 'User suspended successfully', { user });
});

exports.unsuspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isSuspended: false, $unset: { suspensionReason: 1 } },
    { new: true }
  ).select('-password');

  if (!user) return error(res, 'User not found', 404);

  return success(res, 'User unsuspended successfully', { user });
});

exports.getReports = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};

  const startIndex = (page - 1) * limit;
  const reports = await Report.find(query)
    .populate('reporter', 'name')
    .populate('reportedUser', 'name')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Report.countDocuments(query);

  return success(res, 'Reports retrieved', {
    reports,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.updateReportStatus = asyncHandler(async (req, res, next) => {
  const { status, adminNotes } = req.body;
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, adminNotes, resolvedBy: req.user.id },
    { new: true }
  );

  if (!report) return error(res, 'Report not found', 404);

  return success(res, 'Report status updated', { report });
});

exports.getRiskFlags = asyncHandler(async (req, res, next) => {
  const { minScore, page = 1, limit = 20 } = req.query;
  const query = minScore ? { score: { $gte: Number(minScore) } } : {};

  const startIndex = (page - 1) * limit;
  const flags = await RiskFlag.find(query)
    .populate('user', 'name email isSuspended')
    .skip(startIndex)
    .limit(parseInt(limit));
    
  const total = await RiskFlag.countDocuments(query);

  return success(res, 'Risk flags retrieved', {
    flags,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getAdminConfig = asyncHandler(async (req, res, next) => {
  const config = await AdminConfig.find({});
  return success(res, 'Admin config retrieved', { config });
});

exports.updateAdminConfig = asyncHandler(async (req, res, next) => {
  const { key, value } = req.body;
  if (key === undefined || value === undefined) {
    return error(res, 'Key and value are required', 400);
  }

  const config = await AdminConfig.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true }
  );

  return success(res, 'Admin config updated', { config });
});

exports.getRequirements = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const startIndex = (page - 1) * limit;

  const requirements = await TuitionRequirement.find(query)
    .populate('student', 'name email phone')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await TuitionRequirement.countDocuments(query);

  return success(res, 'Requirements retrieved', {
    requirements,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getConnections = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const startIndex = (page - 1) * limit;

  const connections = await TutorRequest.find(query)
    .populate('student', 'name email phone')
    .populate('tutor', 'name email phone')
    .populate('requirement')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await TutorRequest.countDocuments(query);

  return success(res, 'Connections retrieved', {
    connections,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getReviews = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const startIndex = (page - 1) * limit;

  const reviews = await Review.find()
    .populate('reviewer', 'name email')
    .populate('tutor', 'name email')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await Review.countDocuments();

  return success(res, 'Reviews retrieved', {
    reviews,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getContactUnlocks = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, type, status } = req.query;
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;
  
  const startIndex = (page - 1) * limit;

  const unlocks = await ContactUnlock.find(query)
    .populate('user', 'name email')
    .populate('tutor', 'name email')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await ContactUnlock.countDocuments(query);

  return success(res, 'Contact unlocks retrieved', {
    unlocks,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const startIndex = (page - 1) * limit;

  const logs = await AuditLog.find()
    .populate('admin', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(parseInt(limit));

  const total = await AuditLog.countDocuments();

  return success(res, 'Audit logs retrieved', {
    logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  });
});

exports.getAnalytics = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'STUDENT' });
  const totalTutors = await User.countDocuments({ role: 'TUTOR' });
  const verifiedTutors = await TutorProfile.countDocuments({ kycStatus: 'VERIFIED' });
  
  // Aggregations
  const totalRevenueAgg = await ContactUnlock.aggregate([
    { $match: { paymentStatus: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
  ]);

  const topSubjectsAgg = await TutorProfile.aggregate([
    { $unwind: '$subjects' },
    { $group: { _id: '$subjects', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const topLocationsAgg = await TutorProfile.aggregate([
    { $group: { _id: '$location.city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return success(res, 'Analytics retrieved', {
    totalUsers,
    totalStudents,
    totalTutors,
    verifiedTutors,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    topSubjects: topSubjectsAgg.map(s => ({ subject: s._id, count: s.count })),
    topLocations: topLocationsAgg.map(l => ({ city: l._id || 'Unknown', count: l.count }))
  });
});

exports.getStudents = asyncHandler(async (req, res, next) => {
  const {
    search,
    classLevel,
    city,
    accountStatus,
    verificationStatus,
    sortBy = 'newest',
    page = 1,
    limit = 50,
  } = req.query;

  const query = { role: { $in: ['STUDENT', 'PARENT'] } };

  if (accountStatus === 'ACTIVE') {
    query.isSuspended = { $ne: true };
  } else if (accountStatus === 'SUSPENDED') {
    query.isSuspended = true;
  }

  if (verificationStatus === 'VERIFIED') {
    query.phoneVerified = true;
  } else if (verificationStatus === 'PENDING') {
    query.phoneVerified = { $ne: true };
  }

  if (search) {
    const searchTrim = search.trim();
    const searchRegex = new RegExp(searchTrim, 'i');
    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
    if (mongoose.Types.ObjectId.isValid(searchTrim)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(searchTrim) });
    }
    query.$or = searchConditions;
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'oldest') sortOption = { createdAt: 1 };
  if (sortBy === 'name') sortOption = { name: 1 };

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const startIndex = (pageNum - 1) * limitNum;

  const totalStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] } });
  const activeCount = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, isSuspended: { $ne: true } });
  const suspendedCount = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, isSuspended: true });
  const verifiedCount = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, phoneVerified: true });
  const pendingCount = totalStudents - verifiedCount;

  const students = await User.find(query)
    .select('+phone +isSuspended +suspensionReason')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limitNum)
    .lean();

  const StudentProfile = mongoose.model('StudentProfile');
  let studentsWithProfiles = await Promise.all(
    students.map(async (st) => {
      const profile = await StudentProfile.findOne({ user: st._id }).select('+location.address').lean();
      return {
        ...st,
        profile,
      };
    })
  );

  if (classLevel && classLevel !== 'ALL') {
    studentsWithProfiles = studentsWithProfiles.filter((st) => {
      const cls = String(st.profile?.studentDetails?.class || '');
      return cls.toLowerCase().includes(classLevel.toLowerCase());
    });
  }

  if (city && city !== 'ALL') {
    studentsWithProfiles = studentsWithProfiles.filter((st) => {
      const c = String(st.profile?.location?.city || '');
      return c.toLowerCase().includes(city.toLowerCase());
    });
  }

  const totalFiltered = await User.countDocuments(query);

  return success(res, 'Students retrieved successfully', {
    students: studentsWithProfiles,
    total: totalFiltered,
    page: pageNum,
    pages: Math.ceil(totalFiltered / limitNum),
    stats: {
      total: totalStudents,
      active: activeCount,
      suspended: suspendedCount,
      verified: verifiedCount,
      pending: pendingCount,
    },
  });
});

exports.getStudentDetail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const studentUser = await User.findOne({ _id: id, role: { $in: ['STUDENT', 'PARENT'] } })
    .select('+phone +isSuspended +suspensionReason')
    .lean();

  if (!studentUser) {
    return error(res, 'Student not found', 404);
  }

  const StudentProfile = mongoose.model('StudentProfile');
  const profile = await StudentProfile.findOne({ user: studentUser._id }).select('+location.address').lean();
  const unlocks = await ContactUnlock.find({ user: studentUser._id })
    .populate('tutor', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();

  const auditLogs = await AuditLog.find({ targetId: studentUser._id })
    .populate('admin', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return success(res, 'Student details retrieved', {
    student: {
      ...studentUser,
      profile,
      unlocks,
      auditLogs,
    },
  });
});

// @desc    Approve student profile
// @route   PUT /api/admin/students/:id/approve
// @access  Private (Admin only)
exports.approveStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let studentProfile = await StudentProfile.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { user: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  }).populate('user', 'name email phone role');

  let userDoc = null;
  if (studentProfile && studentProfile.user) {
    userDoc = studentProfile.user;
  } else {
    userDoc = await User.findById(id);
    if (userDoc) {
      studentProfile = await StudentProfile.findOne({ user: userDoc._id });
    }
  }

  if (!userDoc && !studentProfile) {
    return error(res, 'Student not found', 404);
  }

  const userId = userDoc ? userDoc._id : studentProfile.user;

  if (studentProfile) {
    studentProfile.isApproved = true;
    studentProfile.isVerified = true;
    studentProfile.profileVisibility = true;
    studentProfile.verificationStatus = 'VERIFIED';
    await studentProfile.save();
  } else {
    studentProfile = await StudentProfile.create({
      user: userId,
      isApproved: true,
      isVerified: true,
      profileVisibility: true,
      verificationStatus: 'VERIFIED'
    });
  }

  if (userDoc) {
    userDoc.isVerified = true;
    userDoc.phoneVerified = true;
    await userDoc.save();
  }

  try {
    const existingReq = await TuitionRequirement.findOne({ student: userId });
    if (!existingReq) {
      const studentClass = studentProfile?.studentDetails?.class || studentProfile?.schoolDetails?.grade || studentProfile?.academicDetails?.degree || 'Class 10';
      const studentCity = studentProfile?.location?.city || 'Local City';
      const studentArea = studentProfile?.location?.area || 'Nearby';
      const studentSubjects = (studentProfile?.academicDetails?.subjectsRequired?.length ? studentProfile.academicDetails.subjectsRequired : null)
        || (studentProfile?.preferredSubjects?.length ? studentProfile.preferredSubjects : null)
        || ['All Subjects'];
      const studentMode = studentProfile?.tuitionRequirements?.mode || (studentProfile?.preferredModes?.length ? studentProfile.preferredModes[0] : 'Home Tuition');
      const studentBudget = parseInt(studentProfile?.tuitionRequirements?.budget) || 5000;

      await TuitionRequirement.create({
        student: userId,
        studentName: userDoc?.name || studentProfile?.studentDetails?.name || 'Student Lead',
        class: studentClass,
        studentClass: studentClass,
        board: studentProfile?.studentDetails?.board || studentProfile?.schoolDetails?.board || 'CBSE',
        medium: studentProfile?.studentDetails?.medium || 'English',
        subjects: studentSubjects,
        teachingMode: studentMode,
        location: {
          city: studentCity,
          area: studentArea,
          pincode: studentProfile?.location?.pincode || '110001',
        },
        budget: {
          amount: studentBudget,
          frequency: 'PER_MONTH'
        },
        status: 'OPEN',
        isApproved: true
      });
    } else {
      await TuitionRequirement.updateMany(
        { student: userId },
        { $set: { isApproved: true, status: 'OPEN' } }
      );
    }
  } catch (syncErr) {
    console.warn('Failed to sync tuition requirement on student approve:', syncErr.message);
  }

  await logAuditAction({
    adminId: req.user._id,
    action: 'STUDENT_APPROVED',
    targetType: 'USER',
    targetId: userId,
    details: `Student ${userDoc?.name || 'Student'} approved by admin.`,
    req,
  });

  return success(res, 'Student approved successfully', { student: studentProfile });
});

// @desc    Unapprove / Cancel approval for student
// @route   PUT /api/admin/students/:id/unapprove
// @access  Private (Admin only)
exports.unapproveStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Approval cancelled by admin' } = req.body;

  let studentProfile = await StudentProfile.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { user: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  }).populate('user', 'name email phone role');

  let userDoc = null;
  if (studentProfile && studentProfile.user) {
    userDoc = studentProfile.user;
  } else {
    userDoc = await User.findById(id);
    if (userDoc) {
      studentProfile = await StudentProfile.findOne({ user: userDoc._id });
    }
  }

  if (!userDoc && !studentProfile) {
    return error(res, 'Student not found', 404);
  }

  const userId = userDoc ? userDoc._id : studentProfile.user;

  if (studentProfile) {
    studentProfile.isApproved = false;
    studentProfile.isVerified = false;
    studentProfile.profileVisibility = false;
    studentProfile.verificationStatus = 'PENDING';
    studentProfile.rejectionReason = reason;
    await studentProfile.save();
  }

  if (userDoc) {
    userDoc.isVerified = false;
    await userDoc.save();
  }

  try {
    const TuitionRequirement = mongoose.model('TuitionRequirement');
    await TuitionRequirement.updateMany(
      { student: userId },
      { $set: { isApproved: false, status: 'PAUSED' } }
    );
  } catch (_) {}

  await logAuditAction({
    adminId: req.user._id,
    action: 'STUDENT_UNAPPROVED',
    targetType: 'USER',
    targetId: userId,
    details: `Student ${userDoc?.name || 'Student'} approval cancelled and unapproved.`,
    req,
  });

  return success(res, 'Student approval cancelled and unapproved successfully', { student: studentProfile });
});

exports.suspendStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return error(res, 'Suspension reason is required', 400);
  }

  const targetUser = await User.findById(id).select('+role +isSuspended +suspensionReason');
  if (!targetUser) {
    return error(res, 'Student not found', 404);
  }

  if (targetUser.role !== 'STUDENT' && targetUser.role !== 'PARENT') {
    return error(res, 'Selected account is not a student/parent', 400);
  }

  targetUser.isSuspended = true;
  targetUser.suspensionReason = reason.trim();
  await targetUser.save();

  await logAuditAction({
    adminId: req.user._id,
    action: 'STUDENT_SUSPENDED',
    targetType: 'USER',
    targetId: targetUser._id,
    details: `Student ${targetUser.name} (${targetUser.email}) suspended. Reason: ${reason.trim()}`,
    req,
  });

  return success(res, `Student ${targetUser.name} suspended successfully`, {
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      isSuspended: true,
      suspensionReason: targetUser.suspensionReason,
    },
  });
});

exports.reactivateStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const targetUser = await User.findById(id).select('+role +isSuspended +suspensionReason');
  if (!targetUser) {
    return error(res, 'Student not found', 404);
  }

  targetUser.isSuspended = false;
  targetUser.suspensionReason = undefined;
  await targetUser.save();

  await logAuditAction({
    adminId: req.user._id,
    action: 'STUDENT_REACTIVATED',
    targetType: 'USER',
    targetId: targetUser._id,
    details: `Student ${targetUser.name} (${targetUser.email}) reactivated`,
    req,
  });

  return success(res, `Student ${targetUser.name} reactivated successfully`, {
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      isSuspended: false,
    },
  });
});

exports.deleteStudentPermanently = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason, confirmText } = req.body;

  if (confirmText !== 'DELETE') {
    return error(res, 'Permanent deletion requires typing "DELETE" exactly to confirm.', 400);
  }

  const targetUser = await User.findById(id).select('+role');
  if (!targetUser) {
    return error(res, 'Student account not found or already deleted', 404);
  }

  if (targetUser.role !== 'STUDENT' && targetUser.role !== 'PARENT') {
    return error(res, 'Selected account is not a student/parent', 400);
  }

  const studentName = targetUser.name;
  const studentEmail = targetUser.email;
  const studentUserId = targetUser._id;

  // 1. Record Audit Log BEFORE deletion
  await logAuditAction({
    adminId: req.user._id,
    action: 'STUDENT_ACCOUNT_PERMANENTLY_DELETED',
    targetType: 'USER',
    targetId: studentUserId,
    details: `Permanently deleted student account ${studentName} (${studentEmail}). Reason: ${reason || 'Admin deletion'}`,
    req,
  });

  // 2. Delete student profile & associations safely
  const StudentProfile = mongoose.model('StudentProfile');
  await StudentProfile.deleteOne({ user: studentUserId });
  await SavedTutor.deleteMany({ user: studentUserId });
  await TuitionRequirement.deleteMany({ student: studentUserId });
  await RiskFlag.deleteMany({ user: studentUserId });

  // 3. Delete the User account
  await User.findByIdAndDelete(studentUserId);

  return success(res, `Student "${studentName}" (${studentEmail}) permanently deleted successfully.`, {
    deletedStudentId: studentUserId,
  });
});

exports.getTutors = asyncHandler(async (req, res, next) => {
  const { status, accountStatus, kycStatus, verified, search, page = 1, limit = 50 } = req.query;
  const query = { role: 'TUTOR' };

  if (accountStatus === 'ACTIVE') {
    query.isSuspended = { $ne: true };
  } else if (accountStatus === 'SUSPENDED') {
    query.isSuspended = true;
  }

  if (search) {
    const searchTrim = search.trim();
    const searchRegex = new RegExp(searchTrim, 'i');
    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
    if (mongoose.Types.ObjectId.isValid(searchTrim)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(searchTrim) });
    }
    query.$or = searchConditions;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const startIndex = (pageNum - 1) * limitNum;

  const tutors = await User.find(query)
    .select('+phone +isSuspended +suspensionReason')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNum)
    .lean();

  let tutorsWithProfiles = await Promise.all(
    tutors.map(async (t) => {
      const profile = await TutorProfile.findOne({ user: t._id }).lean();
      const unlocksCount = await ContactUnlock.countDocuments({
        tutor: t._id,
        status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] },
      });

      return {
        ...t,
        profile,
        unlocksCount,
      };
    })
  );

  // Apply profile level filters
  if (kycStatus) {
    tutorsWithProfiles = tutorsWithProfiles.filter(
      (t) => (t.profile?.kycStatus || 'NOT_SUBMITTED') === kycStatus
    );
  } else if (status) {
    tutorsWithProfiles = tutorsWithProfiles.filter(
      (t) => (t.profile?.kycStatus || 'NOT_SUBMITTED') === status
    );
  }

  if (verified === 'true') {
    tutorsWithProfiles = tutorsWithProfiles.filter((t) => t.profile?.kycStatus === 'VERIFIED');
  } else if (verified === 'false') {
    tutorsWithProfiles = tutorsWithProfiles.filter((t) => t.profile?.kycStatus !== 'VERIFIED');
  }

  const total = await User.countDocuments(query);

  return success(res, 'Tutors retrieved successfully', {
    tutors: tutorsWithProfiles,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
});

exports.getTutorDetail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const tutorUser = await User.findOne({ _id: id, role: 'TUTOR' })
    .select('+phone +isSuspended +suspensionReason')
    .lean();

  if (!tutorUser) {
    return error(res, 'Tutor not found', 404);
  }

  const profile = await TutorProfile.findOne({ user: tutorUser._id }).lean();
  const kyc = await KYC.findOne({ user: tutorUser._id }).lean();
  const auditLogs = await AuditLog.find({ targetId: tutorUser._id })
    .populate('admin', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const unlocksCount = await ContactUnlock.countDocuments({
    tutor: tutorUser._id,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] },
  });

  return success(res, 'Tutor details retrieved', {
    tutor: {
      ...tutorUser,
      profile,
      kyc,
      auditLogs,
      unlocksCount,
    },
  });
});

exports.suspendTutor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return error(res, 'Suspension reason is required', 400);
  }

  const targetUser = await User.findById(id).select('+role +isSuspended +suspensionReason');
  if (!targetUser) {
    return error(res, 'Tutor not found', 404);
  }

  if (targetUser.role !== 'TUTOR') {
    return error(res, 'Selected account is not a tutor', 400);
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    return error(res, 'You cannot suspend your own admin account', 400);
  }

  targetUser.isSuspended = true;
  targetUser.suspensionReason = reason.trim();
  await targetUser.save();

  // Hide tutor profile from public search
  await TutorProfile.findOneAndUpdate({ user: targetUser._id }, { profileVisibility: false });

  // Record Audit Log
  await logAuditAction({
    adminId: req.user._id,
    action: 'TUTOR_SUSPENDED',
    targetType: 'USER',
    targetId: targetUser._id,
    details: `Tutor ${targetUser.name} (${targetUser.email}) suspended. Reason: ${reason.trim()}`,
    req,
  });

  return success(res, `Tutor ${targetUser.name} has been suspended successfully`, {
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      isSuspended: true,
      suspensionReason: targetUser.suspensionReason,
    },
  });
});

exports.reactivateTutor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const targetUser = await User.findById(id).select('+role +isSuspended +suspensionReason');
  if (!targetUser) {
    return error(res, 'Tutor not found', 404);
  }

  if (targetUser.role !== 'TUTOR') {
    return error(res, 'Selected account is not a tutor', 400);
  }

  targetUser.isSuspended = false;
  targetUser.suspensionReason = undefined;
  await targetUser.save();

  // Restore tutor profile visibility
  await TutorProfile.findOneAndUpdate({ user: targetUser._id }, { profileVisibility: true });

  // Record Audit Log
  await logAuditAction({
    adminId: req.user._id,
    action: 'TUTOR_REACTIVATED',
    targetType: 'USER',
    targetId: targetUser._id,
    details: `Tutor ${targetUser.name} (${targetUser.email}) reactivated`,
    req,
  });

  return success(res, `Tutor ${targetUser.name} has been reactivated successfully`, {
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      isSuspended: false,
    },
  });
});

exports.deleteTutorPermanently = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason, confirmText } = req.body;

  if (confirmText !== 'DELETE') {
    return error(res, 'Permanent deletion requires typing "DELETE" exactly to confirm.', 400);
  }

  const targetUser = await User.findById(id).select('+role');
  if (!targetUser) {
    return error(res, 'Tutor account not found or already deleted', 404);
  }

  if (targetUser.role !== 'TUTOR') {
    return error(res, 'Selected account is not a tutor', 400);
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    return error(res, 'You cannot delete your own admin account', 400);
  }

  const tutorName = targetUser.name;
  const tutorEmail = targetUser.email;
  const tutorUserId = targetUser._id;

  // 1. Record Audit Log BEFORE deletion
  await logAuditAction({
    adminId: req.user._id,
    action: 'TUTOR_PERMANENTLY_DELETED',
    targetType: 'USER',
    targetId: tutorUserId,
    details: `Permanently deleted tutor ${tutorName} (${tutorEmail}). Reason: ${reason || 'Admin manual deletion'}. Profile, KYC, reviews and saved references cleaned up.`,
    req,
  });

  // 2. Fetch associated documents for Cloudinary cleanup
  try {
    const tutorProfile = await TutorProfile.findOne({ user: tutorUserId });
    if (tutorProfile?.profilePhoto?.publicId) {
      await deleteFromCloudinary(tutorProfile.profilePhoto.publicId).catch((e) =>
        console.warn('Profile photo delete warning:', e.message)
      );
    }
    if (tutorProfile?.introVideo?.publicId) {
      await deleteFromCloudinary(tutorProfile.introVideo.publicId, 'video').catch((e) =>
        console.warn('Intro video delete warning:', e.message)
      );
    }
  } catch (cleanErr) {
    console.warn('Cloudinary asset cleanup warning:', cleanErr.message);
  }

  // 3. Delete tutor-specific collections safely
  await TutorProfile.deleteOne({ user: tutorUserId });
  await KYC.deleteOne({ user: tutorUserId });
  await SavedTutor.deleteMany({ tutor: tutorUserId });
  await Review.deleteMany({ tutor: tutorUserId });
  await TutorRequest.deleteMany({ tutor: tutorUserId });
  await RiskFlag.deleteMany({ user: tutorUserId });

  // 4. Delete the User account
  await User.findByIdAndDelete(tutorUserId);

  return success(res, `Tutor "${tutorName}" (${tutorEmail}) has been permanently deleted successfully.`, {
    deletedTutorId: tutorUserId,
  });
});

// @desc    Approve tutor profile & send congratulation email
// @route   PUT /api/admin/tutors/:id/approve
// @access  Private (Admin only)
exports.approveTutor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let tutorProfile = await TutorProfile.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { user: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  }).populate('user', 'name email phone avatar role');

  let userDoc = null;
  if (tutorProfile && tutorProfile.user) {
    userDoc = tutorProfile.user;
  } else {
    userDoc = await User.findById(id);
    if (userDoc) {
      tutorProfile = await TutorProfile.findOne({ user: userDoc._id });
    }
  }

  if (!userDoc && !tutorProfile) {
    return error(res, 'Tutor not found', 404);
  }

  const userId = userDoc ? userDoc._id : tutorProfile.user;

  if (tutorProfile) {
    tutorProfile.isApproved = true;
    tutorProfile.kycStatus = 'VERIFIED';
    tutorProfile.verificationStatus = 'approved';
    tutorProfile.profileStatus = 'approved';
    tutorProfile.profileVisibility = true;
    tutorProfile.isVerified = true;
    await tutorProfile.save();
  } else {
    tutorProfile = await TutorProfile.create({
      user: userId,
      isApproved: true,
      kycStatus: 'VERIFIED',
      verificationStatus: 'approved',
      profileStatus: 'approved',
      profileVisibility: true,
      isVerified: true
    });
  }

  if (userDoc) {
    userDoc.isVerified = true;
    await userDoc.save();
  }

  const recipientEmail = userDoc?.email || tutorProfile?.email;
  const recipientName = userDoc?.name || tutorProfile?.name || 'Tutor';

  if (recipientEmail) {
    try {
      const sendEmail = require('../services/emailService').sendEmail;
      await sendEmail({
        to: recipientEmail,
        subject: '🎉 Congratulations! You are now a Verified Tutor on MentorNearby',
        html: `
          <div style="font-family: Arial, sans-serif; background: #FFFBF5; padding: 30px; border-radius: 12px; border: 1px solid #F0EAD6;">
            <h2 style="color: #F59E0B; margin-top: 0;">Welcome to MentorNearby Family! 🎉</h2>
            <p style="color: #333; font-size: 15px;">Hi <b>${recipientName}</b>,</p>
            <p style="color: #333; font-size: 15px;"><b>Congratulations!</b> Your tutor profile has been <b>verified and approved</b> by our team.</p>
            <p style="color: #333; font-size: 15px;">You are now officially a tutor on <b>MentorNearby.com</b> — India's trusted platform to find nearby tutors.</p>
            <div style="background: #ffffff; border: 1px solid #F5EFE0; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <p style="margin: 8px 0; color: #166534;">✅ <b>Your profile is now live</b> and visible to thousands of students in your city.</p>
              <p style="margin: 8px 0; color: #166534;">✅ <b>Students can now contact you</b> and book your classes.</p>
            </div>
            <br>
            <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/tutor/dashboard" style="background: #000000; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Your Dashboard</a>
            <br><br>
            <p style="color: #666; font-size: 13px;">Keep your profile updated and respond quickly to get more students!</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px;">Best regards,<br><b>Team MentorNearby</b><br><a href="https://mentornearby.com" style="color: #F59E0B;">www.mentornearby.com</a></p>
          </div>
        `
      });
      console.log(`✅ Congratulation email sent to approved tutor ${recipientEmail}`);
    } catch (emailErr) {
      console.error('⚠️ Failed to send tutor approval email:', emailErr);
    }
  }

  await logAuditAction({
    adminId: req.user._id,
    action: 'TUTOR_APPROVED',
    targetType: 'USER',
    targetId: userId,
    details: `Tutor ${recipientName} (${recipientEmail}) approved & email sent.`,
    req,
  });

  return success(res, 'Tutor approved and email sent successfully', { tutor: tutorProfile });
});

// @desc    Reject tutor profile
// @route   PUT /api/admin/tutors/:id/reject
// @access  Private (Admin only)
exports.rejectTutor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Document or profile criteria not met' } = req.body;

  let tutorProfile = await TutorProfile.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { user: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  }).populate('user', 'name email phone avatar role');

  let userDoc = null;
  if (tutorProfile && tutorProfile.user) {
    userDoc = tutorProfile.user;
  } else {
    userDoc = await User.findById(id);
    if (userDoc) {
      tutorProfile = await TutorProfile.findOne({ user: userDoc._id });
    }
  }

  if (!userDoc && !tutorProfile) {
    return error(res, 'Tutor not found', 404);
  }

  if (tutorProfile) {
    tutorProfile.isApproved = false;
    tutorProfile.kycStatus = 'REJECTED';
    tutorProfile.verificationStatus = 'REJECTED';
    tutorProfile.rejectionReason = reason;
    await tutorProfile.save();
  }

  const recipientEmail = userDoc?.email || tutorProfile?.email;
  const recipientName = userDoc?.name || tutorProfile?.name || 'Tutor';

  if (recipientEmail) {
    try {
      const sendEmail = require('../services/emailService').sendEmail;
      await sendEmail({
        to: recipientEmail,
        subject: 'MentorNearby Profile Review Update',
        html: `
          <div style="font-family: Arial, sans-serif; background: #FFFBF5; padding: 30px; border-radius: 12px; border: 1px solid #F0EAD6;">
            <h2 style="color: #DC2626; margin-top: 0;">Profile Review Update</h2>
            <p style="color: #333; font-size: 15px;">Hi <b>${recipientName}</b>,</p>
            <p style="color: #333; font-size: 15px;">Thank you for registering on MentorNearby.</p>
            <p style="color: #333; font-size: 15px;">Upon reviewing your tutor profile, our team was unable to approve it at this time.</p>
            <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #991B1B; font-size: 14px;"><b>Reason:</b> ${reason}</p>
            </div>
            <p style="color: #333; font-size: 14px;">Please update your profile details or resubmit valid verification documents to get verified.</p>
            <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/tutor/kyc" style="background: #000000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Update Profile & KYC</a>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px;">Best regards,<br><b>Team MentorNearby</b></p>
          </div>
        `
      });
    } catch (e) {
      console.error('⚠️ Failed to send tutor rejection email:', e);
    }
  }

  return success(res, 'Tutor rejected successfully', { tutor: tutorProfile });
});

// @desc    Unapprove / Cancel approval for tutor (remove from website and search)
// @route   PUT /api/admin/tutors/:id/unapprove
// @access  Private (Admin only)
exports.unapproveTutor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason = 'Approval cancelled by admin' } = req.body;

  let tutorProfile = await TutorProfile.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { user: mongoose.Types.ObjectId.isValid(id) ? id : null }
    ]
  }).populate('user', 'name email phone avatar role');

  let userDoc = null;
  if (tutorProfile && tutorProfile.user) {
    userDoc = tutorProfile.user;
  } else {
    userDoc = await User.findById(id);
    if (userDoc) {
      tutorProfile = await TutorProfile.findOne({ user: userDoc._id });
    }
  }

  if (!userDoc && !tutorProfile) {
    return error(res, 'Tutor not found', 404);
  }

  const userId = userDoc ? userDoc._id : tutorProfile.user;

  if (tutorProfile) {
    tutorProfile.isApproved = false;
    tutorProfile.kycStatus = 'PENDING';
    tutorProfile.verificationStatus = 'pending';
    tutorProfile.profileStatus = 'pending';
    tutorProfile.profileVisibility = false;
    tutorProfile.isVerified = false;
    tutorProfile.rejectionReason = reason;
    await tutorProfile.save();
  }

  if (userDoc) {
    userDoc.isVerified = false;
    await userDoc.save();
  }

  await logAuditAction({
    adminId: req.user._id,
    action: 'TUTOR_UNAPPROVED',
    targetType: 'USER',
    targetId: userId,
    details: `Tutor ${userDoc?.name || tutorProfile?.name || 'Tutor'} approval cancelled and profile hidden from website.`,
    req,
  });

  return success(res, 'Tutor approval cancelled and removed from public website successfully', { tutor: tutorProfile });
});

// ============================================================
// SUBSCRIPTION MANAGEMENT (Admin Control Center)
// ============================================================

// @desc    Get all subscriptions with stats and pagination
// @route   GET /api/admin/subscriptions
// @access  Private (Admin only)
exports.adminGetSubscriptions = asyncHandler(async (req, res, next) => {
  const { search, role, status = 'all', page = 1, limit = 50 } = req.query;

  const query = {};

  if (role) {
    query.role = role.toUpperCase();
  }

  if (status === 'active') {
    query.isSubscribed = true;
    query.subscriptionExpiry = { $gt: new Date() };
  } else if (status === 'expired') {
    query.$or = [
      { isSubscribed: false, subscriptionExpiry: { $exists: true, $ne: null } },
      { isSubscribed: true, subscriptionExpiry: { $lte: new Date() } },
    ];
  } else {
    // Return anyone who is currently subscribed OR has a subscription expiry on record
    query.$or = [
      { isSubscribed: true },
      { subscriptionExpiry: { $exists: true, $ne: null } },
    ];
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$and = [
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      },
    ];
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(query);
  const subscribers = await User.find(query)
    .select('name email phone role isSubscribed subscriptionType subscriptionExpiry razorpaySubscriptionId freeChatsUsed freeLeadsUsed createdAt')
    .sort({ subscriptionExpiry: -1, createdAt: -1 })
    .skip(startIndex)
    .limit(limitNum)
    .lean();

  const now = new Date();
  const totalActive = await User.countDocuments({
    isSubscribed: true,
    subscriptionExpiry: { $gt: now },
  });
  const totalStudentsSubscribed = await User.countDocuments({
    role: { $in: ['STUDENT', 'PARENT'] },
    isSubscribed: true,
    subscriptionExpiry: { $gt: now },
  });
  const totalTutorsSubscribed = await User.countDocuments({
    role: 'TUTOR',
    isSubscribed: true,
    subscriptionExpiry: { $gt: now },
  });

  const estimatedMonthlyRevenue = (totalStudentsSubscribed * 99) + (totalTutorsSubscribed * 149);

  return success(res, 'Subscriptions fetched successfully', {
    subscribers,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    stats: {
      totalActive,
      totalStudentsSubscribed,
      totalTutorsSubscribed,
      estimatedMonthlyRevenue,
    },
  });
});

// @desc    Manually grant subscription to a user (teacher/student)
// @route   POST /api/admin/users/:id/grant-subscription
// @access  Private (Admin only)
exports.adminGrantSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { days = 30, planType } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return error(res, 'User not found', 404);
  }

  const durationDays = parseInt(days) || 30;
  const now = new Date();
  const currentExpiry = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now
    ? new Date(user.subscriptionExpiry)
    : now;

  const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const determinedPlan = planType || (user.role === 'TUTOR' ? 'teacher' : 'student');

  user.isSubscribed = true;
  user.subscriptionExpiry = newExpiry;
  user.subscriptionType = determinedPlan;
  await user.save();

  await logAuditAction({
    adminId: req.user._id,
    action: 'USER_ROLE_CHANGED',
    targetType: 'USER',
    targetId: user._id,
    details: `Manually granted ${durationDays} days of ${determinedPlan} subscription (valid until ${newExpiry.toLocaleDateString('en-IN')}) to ${user.name} (${user.email}).`,
    req,
  });

  return success(res, `Successfully granted ${durationDays} days of subscription to ${user.name}`, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed,
      subscriptionType: user.subscriptionType,
      subscriptionExpiry: user.subscriptionExpiry,
    },
  });
});

// @desc    Manually revoke subscription
// @route   POST /api/admin/users/:id/revoke-subscription
// @access  Private (Admin only)
exports.adminRevokeSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return error(res, 'User not found', 404);
  }

  user.isSubscribed = false;
  user.subscriptionExpiry = new Date(Date.now() - 1000);
  await user.save();

  await logAuditAction({
    adminId: req.user._id,
    action: 'USER_ROLE_CHANGED',
    targetType: 'USER',
    targetId: user._id,
    details: `Revoked active subscription for ${user.name} (${user.email}).`,
    req,
  });

  return success(res, `Subscription revoked for ${user.name}`, {
    user: {
      _id: user._id,
      name: user.name,
      isSubscribed: false,
      subscriptionExpiry: user.subscriptionExpiry,
    },
  });
});
