// ============================================================
// controllers/resourceController.js
// Public controllers for browsing, filtering & searching educational resources
// ============================================================

const EducationalResource = require('../models/EducationalResource');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all available categories with active resource counts
 * GET /api/resources/categories
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const counts = await EducationalResource.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const categoryMap = {
    NCERT_BOOK: { label: 'NCERT Books', icon: '📚', count: 0 },
    NCERT_SOLUTION: { label: 'NCERT Solutions', icon: '💡', count: 0 },
    NCERT_NOTE: { label: 'NCERT Notes & Formulas', icon: '📝', count: 0 },
    CBSE_PAPER: { label: 'CBSE Sample & Board Papers', icon: '📄', count: 0 },
    OTHER_SOLUTION: { label: 'Other Solutions & Practice', icon: '🎯', count: 0 },
  };

  counts.forEach((c) => {
    if (categoryMap[c._id]) {
      categoryMap[c._id].count = c.count;
    }
  });

  return success(res, 'Categories retrieved', { categories: categoryMap });
});

/**
 * Get distinct available classes from database
 * GET /api/resources/classes
 */
exports.getClasses = asyncHandler(async (req, res) => {
  const { category, medium } = req.query;
  const match = { isActive: true };

  if (category) match.category = category;
  if (medium) match.medium = medium;

  const rawClasses = await EducationalResource.distinct('classLevel', match);

  // Custom sort classes from Class 12 down to Class 1
  const sortedClasses = rawClasses.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  return success(res, 'Classes retrieved', { classes: sortedClasses });
});

/**
 * Get distinct subjects for given class and filters
 * GET /api/resources/subjects
 */
exports.getSubjects = asyncHandler(async (req, res) => {
  const { classLevel, category, medium } = req.query;
  const match = { isActive: true };

  if (classLevel) match.classLevel = classLevel;
  if (category) match.category = category;
  if (medium) match.medium = medium;

  const subjects = await EducationalResource.distinct('subject', match);

  return success(res, 'Subjects retrieved', { subjects: subjects.sort() });
});

/**
 * Get paginated list of resources with filters
 * GET /api/resources
 */
exports.getResources = asyncHandler(async (req, res) => {
  const {
    category,
    medium,
    classLevel,
    subject,
    resourceType,
    page = 1,
    limit = 24,
    sort = 'order',
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = category;
  if (medium && medium !== 'All') query.medium = medium;
  if (classLevel && classLevel !== 'All') query.classLevel = classLevel;
  if (subject && subject !== 'All') query.subject = subject;
  if (resourceType && resourceType !== 'All') query.resourceType = resourceType;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  let sortObj = { order: 1, title: 1 };
  if (sort === 'newest') sortObj = { createdAt: -1 };
  if (sort === 'popular') sortObj = { viewsCount: -1, bookmarksCount: -1 };
  if (sort === 'title') sortObj = { title: 1 };

  const [resources, total] = await Promise.all([
    EducationalResource.find(query)
      .select('-chapters.sourceUrl')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    EducationalResource.countDocuments(query),
  ]);

  return success(res, 'Resources retrieved', {
    resources,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

/**
 * Search resources across titles, chapters, subjects, classes
 * GET /api/resources/search
 */
exports.searchResources = asyncHandler(async (req, res) => {
  const { q, classLevel, medium, category, limit = 20 } = req.query;

  if (!q || !q.trim()) {
    return success(res, 'Search query empty', { resources: [], total: 0 });
  }

  const cleanQuery = q.trim();
  const filter = { isActive: true };

  if (classLevel && classLevel !== 'All') filter.classLevel = classLevel;
  if (medium && medium !== 'All') filter.medium = medium;
  if (category && category !== 'All') filter.category = category;

  // Search by regex across title, subject, and chapter titles
  const searchRegex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  filter.$or = [
    { title: searchRegex },
    { subject: searchRegex },
    { classLevel: searchRegex },
    { description: searchRegex },
    { 'chapters.title': searchRegex },
  ];

  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const resources = await EducationalResource.find(filter)
    .sort({ order: 1, viewsCount: -1 })
    .limit(limitNum)
    .lean();

  return success(res, 'Search results', {
    resources,
    total: resources.length,
    query: cleanQuery,
  });
});

/**
 * Get single educational resource details by ID
 * GET /api/resources/:id
 */
exports.getResourceById = asyncHandler(async (req, res) => {
  const resource = await EducationalResource.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  // Increment view counter asynchronously
  EducationalResource.findByIdAndUpdate(resource._id, { $inc: { viewsCount: 1 } }).exec();

  return success(res, 'Resource details retrieved', { resource });
});

/**
 * Get chapters for a specific resource
 * GET /api/resources/:id/chapters
 */
exports.getResourceChapters = asyncHandler(async (req, res) => {
  const resource = await EducationalResource.findById(req.params.id).select('title chapters classLevel subject medium');

  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  return success(res, 'Chapters retrieved', {
    resourceTitle: resource.title,
    classLevel: resource.classLevel,
    subject: resource.subject,
    medium: resource.medium,
    chapters: resource.chapters || [],
  });
});
