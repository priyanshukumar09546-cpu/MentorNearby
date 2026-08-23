// ============================================================
// controllers/bookmarkController.js
// Bookmark management for study materials & NCERT resources
// ============================================================

const Bookmark = require('../models/Bookmark');
const EducationalResource = require('../models/EducationalResource');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all bookmarks for currently authenticated user
 * GET /api/bookmarks
 */
exports.getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user.id })
    .populate({
      path: 'resource',
      select: 'title category medium classLevel subject resourceType officialUrl coverImageUrl chapters',
    })
    .sort({ createdAt: -1 });

  return success(res, 'Bookmarks retrieved', { bookmarks });
});

/**
 * Check if a resource is bookmarked
 * GET /api/bookmarks/check/:resourceId
 */
exports.checkBookmark = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const { chapterIndex = -1 } = req.query;

  const bookmark = await Bookmark.findOne({
    user: req.user.id,
    resource: resourceId,
    chapterIndex: parseInt(chapterIndex, 10),
  });

  return success(res, 'Bookmark status', {
    isBookmarked: !!bookmark,
    bookmarkId: bookmark ? bookmark._id : null,
  });
});

/**
 * Add a new bookmark
 * POST /api/bookmarks
 */
exports.addBookmark = asyncHandler(async (req, res) => {
  const { resourceId, chapterIndex = -1, chapterTitle = '', notes = '' } = req.body;

  if (!resourceId) {
    return error(res, 'Resource ID is required', 400);
  }

  const resource = await EducationalResource.findById(resourceId);
  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  // Check for existing bookmark
  const existing = await Bookmark.findOne({
    user: req.user.id,
    resource: resourceId,
    chapterIndex: parseInt(chapterIndex, 10),
  });

  if (existing) {
    return success(res, 'Resource already bookmarked', { bookmark: existing });
  }

  const bookmark = await Bookmark.create({
    user: req.user.id,
    resource: resourceId,
    resourceType: resource.resourceType,
    chapterIndex: parseInt(chapterIndex, 10),
    chapterTitle,
    notes,
  });

  // Increment bookmark count on resource
  await EducationalResource.findByIdAndUpdate(resourceId, { $inc: { bookmarksCount: 1 } });

  return success(res, 'Resource bookmarked successfully', { bookmark }, 201);
});

/**
 * Remove bookmark by bookmark ID or resource ID
 * DELETE /api/bookmarks/:id
 */
exports.removeBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let bookmark = await Bookmark.findOne({ _id: id, user: req.user.id });

  // If not found by bookmark _id, try finding by resource ID
  if (!bookmark) {
    bookmark = await Bookmark.findOne({ resource: id, user: req.user.id });
  }

  if (!bookmark) {
    return error(res, 'Bookmark not found', 404);
  }

  const resourceId = bookmark.resource;
  await Bookmark.deleteOne({ _id: bookmark._id });

  // Decrement bookmark count
  await EducationalResource.findByIdAndUpdate(resourceId, { $inc: { bookmarksCount: -1 } });

  return success(res, 'Bookmark removed successfully');
});
