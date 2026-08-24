const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
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
  console.log('Login attempt:', email, 'found:', !!user, 'role:', user?.role);

  if (!user || (user.role && user.role.toString().trim().toUpperCase() !== 'ADMIN')) {
    return error(res, 'Invalid admin credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  console.log('Login attempt password match:', isMatch);
  if (!isMatch) {
    return error(res, 'Invalid admin credentials', 401);
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

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
  const totalRevenue = revenueAgg.length ? (revenueAgg[0].totalRevenue || 0) : 0;

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
  const periodRevenue = dateFilter ? (periodRevenueAgg.length ? (periodRevenueAgg[0].periodRevenue || 0) : 0) : totalRevenue;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

  const recentUsers = await User.find(dateFilter ? { role: { $in: ['STUDENT', 'TUTOR', 'PARENT'] }, createdAt: dateFilter } : { role: { $in: ['STUDENT', 'TUTOR', 'PARENT'] } })
    .select('+phone -password')
    .sort({ createdAt: -1 })
    .limit(8);

  const kycBreakdown = {
    verified: verifiedTutors,
    pending: pendingKYC,
    rejected: rejectedKYC,
    notSubmitted: await TutorProfile.countDocuments({ kycStatus: 'NOT_SUBMITTED' })
  };

  const roleDistribution = {
    students: totalStudents,
    tutors: totalTutors,
    admins: await User.countDocuments({ role: 'ADMIN' })
  };

  // --- Previous Period Trends Calculation ---
  let prevDateFilter = null;
  if (range === 'today') {
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    prevDateFilter = { $gte: startOfYesterday, $lt: startOfToday };
  } else if (range === '7d') {
    const prev7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const curr7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevDateFilter = { $gte: prev7d, $lt: curr7d };
  } else if (range === '30d') {
    const prev30d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const curr30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    prevDateFilter = { $gte: prev30d, $lt: curr30d };
  } else if (range === '90d') {
    const prev90d = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const curr90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    prevDateFilter = { $gte: prev90d, $lt: curr90d };
  }

  const prevStudents = prevDateFilter ? await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, createdAt: prevDateFilter }) : 0;
  const prevTutors = prevDateFilter ? await User.countDocuments({ role: 'TUTOR', createdAt: prevDateFilter }) : 0;
  const prevUsers = prevStudents + prevTutors;
  const prevPendingKYC = prevDateFilter ? await KYC.countDocuments({ status: 'PENDING', createdAt: prevDateFilter }) : 0;
  const prevReports = prevDateFilter ? await Report.countDocuments({ createdAt: prevDateFilter }) : 0;
  const prevTutorRequests = prevDateFilter ? await TutorRequest.countDocuments({ createdAt: prevDateFilter }) : 0;
  const prevUnlocks = prevDateFilter ? await ContactUnlock.countDocuments({ createdAt: prevDateFilter }) : 0;
  
  let prevRevenue = 0;
  if (prevDateFilter) {
    const prevRevAgg = await ContactUnlock.aggregate([
      { $match: { paymentStatus: 'COMPLETED', updatedAt: prevDateFilter } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);
    prevRevenue = prevRevAgg.length ? (prevRevAgg[0].total || 0) : 0;
  }

  const calculateTrend = (curr, prev) => {
    if (range === 'all' || prev === 0) return null;
    return (((curr - prev) / prev) * 100);
  };

  const trends = {
    users: calculateTrend((periodStudents + periodTutors), prevUsers),
    students: calculateTrend(periodStudents, prevStudents),
    tutors: calculateTrend(periodTutors, prevTutors),
    pendingKYC: calculateTrend(pendingKYC, prevPendingKYC), // pendingKYC is lifetime, maybe not exact but best approx
    reports: calculateTrend(totalReports, prevReports), 
    tutorRequests: calculateTrend(totalTutorRequests, prevTutorRequests),
    contactUnlocks: calculateTrend(periodUnlocks, prevUnlocks),
    revenue: calculateTrend(periodRevenue, prevRevenue)
  };

  // Today's registration counts
  const todayStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, createdAt: { $gte: startOfToday } });
  const todayTutors = await User.countDocuments({ role: 'TUTOR', createdAt: { $gte: startOfToday } });
  const todayUsers = todayStudents + todayTutors;

  // Real 7-day daily growth series
  const growthSeries = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 6; i >= 0; i--) {
    const dStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dStart.setHours(0, 0, 0, 0);
    const dEnd = new Date(dStart.getTime() + 24 * 60 * 60 * 1000);

    const dayStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] }, createdAt: { $gte: dStart, $lt: dEnd } });
    const dayTutors = await User.countDocuments({ role: 'TUTOR', createdAt: { $gte: dStart, $lt: dEnd } });
    const dayUsers = dayStudents + dayTutors;

    growthSeries.push({
      dateLabel: `${dStart.getDate()} ${monthNames[dStart.getMonth()]}`,
      dayName: dayNames[dStart.getDay()],
      users: dayUsers,
      students: dayStudents,
      tutors: dayTutors,
    });
  }

  // Fetch recent platform activities
  const recentAuditLogs = await AuditLog.find()
    .populate('user', 'name role')
    .sort({ createdAt: -1 })
    .limit(6);

  const recentActivities = recentAuditLogs.map(log => ({
    _id: log._id,
    action: log.action,
    details: log.details?.action || log.details?.description || `${log.user?.name || 'Admin'} performed ${log.action}`,
    createdAt: log.createdAt,
  }));

  const hundredRupeeUnlocks = await ContactUnlock.countDocuments({
    paymentStatus: 'COMPLETED',
    'paymentDetails.amount': 100
  });

  const sixtyRupeeUnlocks = await ContactUnlock.countDocuments({
    paymentStatus: 'COMPLETED',
    'paymentDetails.amount': 60
  });

  return success(res, 'Dashboard statistics fetched successfully', {
    totalUsers,
    totalStudents,
    totalTutors,
    verifiedTutors,
    pendingKYC,
    rejectedKYC,
    totalReports,
    totalUnlocks,
    paidUnlocks,
    suspendedUsers,
    totalRequirements,
    openRequirements,
    totalTutorRequests,
    totalReviews,
    totalRevenue,
    todayRevenue,
    periodRevenue,
    periodUnlocks,
    periodStudents,
    periodTutors,
    todayStudents,
    todayTutors,
    todayUsers,
    activeUsers,
    recentUsers,
    recentActivities,
    growthSeries,
    kycBreakdown,
    roleDistribution,
    unlockPricingStats: {
      hundredRupeeUnlocks,
      sixtyRupeeUnlocks
    },
    trends
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
