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

  let sortOption = {};
  switch (sort) {
    case 'fees_asc':
      sortOption = { 'fees.amount': 1 };
      break;
    case 'fees_desc':
      sortOption = { 'fees.amount': -1 };
      break;
    case 'experience':
      sortOption = { 'experience.years': -1 };
      break;
    case 'rating':
      sortOption = { averageRating: -1 };
      break;
    default:
      // relevance - might need complex scoring, default to profileCompletion or random for now
      sortOption = { profileCompletionPercentage: -1 };
  }

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const startIndex = (pageNum - 1) * limitNum;

  const tutors = await TutorProfile.find(query)
    .populate('user', 'name isSuspended')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limitNum);

  // Filter out any suspended or orphaned profiles
  const activeTutors = tutors.filter(t => t.user && !t.user.isSuspended);

  const total = await TutorProfile.countDocuments(query);
  const pages = Math.ceil(total / limitNum);

  // Increment search appearances in background
  Promise.all(activeTutors.map(tutor => 
    TutorProfile.findByIdAndUpdate(tutor._id, { $inc: { searchAppearances: 1 } })
  )).catch(err => console.error('Error incrementing search appearances:', err));

  return success(res, 'Tutors fetched successfully', {
    tutors: activeTutors,
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

