const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const TutorProfile = require('../models/TutorProfile');

exports.searchTutors = asyncHandler(async (req, res, next) => {
  const {
    lat, lng, radius = 20,
    pincode, city,
    subjects, grades, teachingModes,
    minFees, maxFees, minExperience,
    verified,
    page = 1, limit = 12, sort = 'relevance'
  } = req.query;

  const query = { profileVisibility: true };

  if (lat && lng) {
    query['location.coordinates'] = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius) * 1000 
      }
    };
  }

  if (pincode) {
    query['location.pincode'] = pincode;
  }

  const locationQuery = city || req.query.location;
  if (locationQuery) {
    if (/^\d{6}$/.test(locationQuery.trim())) {
      query['location.pincode'] = locationQuery.trim();
    } else {
      query['$or'] = [
        { 'location.city': new RegExp(locationQuery, 'i') },
        { 'location.area': new RegExp(locationQuery, 'i') }
      ];
    }
  }

  const subjectQuery = subjects || req.query.subject;
  if (subjectQuery) {
    const subjArr = subjectQuery.split(',').map(s => new RegExp(s.trim(), 'i'));
    query.subjects = { $in: subjArr };
  }

  const gradeQuery = grades || req.query.class;
  if (gradeQuery) {
    const gradeArr = gradeQuery.split(',').map(g => new RegExp(g.trim(), 'i'));
    query.grades = { $in: gradeArr };
  }

  if (teachingModes) {
    query.teachingModes = { $in: teachingModes.split(',') };
  }

  const effectiveMaxFees = maxFees || req.query.maxFee;
  if (minFees || effectiveMaxFees) {
    query['fees.amount'] = {};
    if (minFees) query['fees.amount'].$gte = Number(minFees);
    if (effectiveMaxFees) query['fees.amount'].$lte = Number(effectiveMaxFees);
  }

  if (minExperience) {
    query['experience.years'] = { $gte: Number(minExperience) };
  }

  const isVerifiedOnly = verified === 'true' || req.query.verifiedOnly === 'true';
  if (isVerifiedOnly) {
    query.kycStatus = 'VERIFIED';
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 50);

  // Fetch tutors with user subscription and lead tracking fields
  const tutors = await TutorProfile.find(query)
    .populate('user', 'name isSuspended isSubscribed freeLeadsUsed freeChatsUsed subscriptionExpiry subscriptionType')
    .lean();

  // Filter out any suspended or orphaned profiles
  const activeTutors = tutors.filter(t => t.user && !t.user.isSuspended);

  // Helper: check active subscription
  const isUserSubscribed = (t) =>
    Boolean(
      t.user?.isSubscribed &&
      t.user?.subscriptionExpiry &&
      new Date(t.user.subscriptionExpiry) > new Date()
    );

  // Apply Ranking / Sorting:
  if (sort === 'fees_asc') {
    activeTutors.sort((a, b) => (a.fees?.amount || 0) - (b.fees?.amount || 0));
  } else if (sort === 'fees_desc') {
    activeTutors.sort((a, b) => (b.fees?.amount || 0) - (a.fees?.amount || 0));
  } else if (sort === 'experience') {
    activeTutors.sort((a, b) => (b.experience?.years || 0) - (a.experience?.years || 0));
  } else if (sort === 'rating') {
    activeTutors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  } else {
    // ── Default Ranking Algorithm ────────────────────────────
    // 1. isSubscribed teachers first (top listing)
    // 2. Then by rating (highest rating)
    // 3. Then by freeLeadsUsed (new teachers get a chance)
    activeTutors.sort((a, b) => {
      const aSub = isUserSubscribed(a) ? 1 : 0;
      const bSub = isUserSubscribed(b) ? 1 : 0;
      if (aSub !== bSub) return bSub - aSub; // Subscribed first

      const aRating = a.averageRating || 0;
      const bRating = b.averageRating || 0;
      if (aRating !== bRating) return bRating - aRating; // Higher rating first

      const aLeads = a.user?.freeLeadsUsed ?? 0;
      const bLeads = b.user?.freeLeadsUsed ?? 0;
      if (aLeads !== bLeads) return aLeads - bLeads; // Lower leads used first (new teacher boost)

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  // Decorate with isTop and isNew flags
  const decoratedTutors = activeTutors.map((t) => ({
    ...t,
    isTop: isUserSubscribed(t),
    isNew: !isUserSubscribed(t) && ((t.user?.freeLeadsUsed ?? 0) <= 1),
    isSubscribed: isUserSubscribed(t),
  }));

  const total = decoratedTutors.length;
  const pages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedTutors = decoratedTutors.slice(startIndex, startIndex + limitNum);

  // Increment search appearances in background
  Promise.all(paginatedTutors.map(tutor => 
    TutorProfile.findByIdAndUpdate(tutor._id, { $inc: { searchAppearances: 1 } })
  )).catch(err => console.error('Error incrementing search appearances:', err));

  return success(res, 'Tutors fetched successfully', {
    tutors: paginatedTutors,
    total,
    page: pageNum,
    pages
  });
});

exports.getPublicStats = asyncHandler(async (req, res, next) => {
  const User = require('../models/User');
  const TutorProfile = require('../models/TutorProfile');
  const Review = require('../models/Review');

  const totalStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'PARENT'] } });
  const totalVerifiedTutors = await TutorProfile.countDocuments({ kycStatus: 'VERIFIED' });
  const totalTutors = await TutorProfile.countDocuments({ profileVisibility: true });

  const reviewAgg = await Review.aggregate([
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avgRating = reviewAgg.length && reviewAgg[0].count > 0 ? Number(reviewAgg[0].avgRating.toFixed(1)) : 0;
  const totalReviews = reviewAgg.length ? reviewAgg[0].count : 0;

  return success(res, 'Public stats fetched', {
    totalStudents,
    totalVerifiedTutors,
    totalTutors,
    avgRating,
    totalReviews
  });
});

