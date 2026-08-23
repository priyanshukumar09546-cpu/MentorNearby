// ============================================================
// controllers/adminResourceController.js
// Admin controllers for NCERT synchronization & study resource management
// ============================================================

const EducationalResource = require('../models/EducationalResource');
const ContentSource = require('../models/ContentSource');
const ncertSyncService = require('../services/ncertSyncService');
const logAuditAction = require('../utils/auditLogger');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Trigger NCERT content synchronization
 * POST /api/admin/ncert/sync
 */
exports.syncNcertContent = asyncHandler(async (req, res) => {
  const result = await ncertSyncService.runSync({ forced: true });

  await logAuditAction({
    adminId: req.user.id,
    action: 'SYNC_NCERT_CONTENT',
    targetType: 'EDUCATIONAL_RESOURCE',
    details: `NCERT Sync triggered by admin: ${result.message}`,
    req,
  });

  if (!result.success && result.status === 'RUNNING') {
    return error(res, result.message, 409);
  }

  if (!result.success) {
    return error(res, result.message, 500);
  }

  return success(res, 'NCERT Sync completed successfully', result);
});

/**
 * Get NCERT Sync Status and last sync statistics
 * GET /api/admin/ncert/sync-status
 */
exports.getSyncStatus = asyncHandler(async (req, res) => {
  const status = await ncertSyncService.getSyncStatus();
  return success(res, 'Sync status retrieved', status);
});

/**
 * Content Health Check
 * GET /api/admin/ncert/health
 */
exports.getContentHealth = asyncHandler(async (req, res) => {
  const [total, active, unavailable, missingUrls, categories, mediums, classes] = await Promise.all([
    EducationalResource.countDocuments(),
    EducationalResource.countDocuments({ isActive: true, availabilityStatus: 'AVAILABLE' }),
    EducationalResource.countDocuments({ availabilityStatus: 'UNAVAILABLE' }),
    EducationalResource.countDocuments({ $or: [{ officialUrl: { $exists: false } }, { officialUrl: '' }] }),
    EducationalResource.distinct('category'),
    EducationalResource.distinct('medium'),
    EducationalResource.distinct('classLevel'),
  ]);

  const source = await ContentSource.findOne({ name: 'NCERT' });

  return success(res, 'Content health retrieved', {
    total,
    active,
    unavailable,
    missingUrls,
    duplicates: 0,
    categoriesCount: categories.length,
    mediumsCount: mediums.length,
    classesCount: classes.length,
    lastSyncAt: source?.lastSyncAt || null,
    lastSyncStatus: source?.lastSyncStatus || 'IDLE',
    lastSyncSummary: source?.lastSyncSummary || null,
  });
});

/**
 * Validate Stored Resource Links
 * POST /api/admin/ncert/validate-links
 */
exports.validateLinks = asyncHandler(async (req, res) => {
  const result = await ncertSyncService.validateResourceLinks();

  await logAuditAction({
    adminId: req.user.id,
    action: 'VALIDATE_RESOURCE_LINKS',
    targetType: 'EDUCATIONAL_RESOURCE',
    details: `Validated links: ${result.checkedCount} checked, ${result.invalidCount} invalid.`,
    req,
  });

  return success(res, 'Links validated', result);
});

/**
 * Admin Get All Educational Resources (Paginated, Search, Filters)
 * GET /api/admin/resources
 */
exports.adminGetResources = asyncHandler(async (req, res) => {
  const {
    category,
    medium,
    classLevel,
    subject,
    status,
    search,
    page = 1,
    limit = 20,
    sort = 'order',
  } = req.query;

  const query = {};

  if (category && category !== 'All') query.category = category;
  if (medium && medium !== 'All') query.medium = medium;
  if (classLevel && classLevel !== 'All') query.classLevel = classLevel;
  if (subject && subject !== 'All') query.subject = subject;

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'unavailable') {
    query.availabilityStatus = 'UNAVAILABLE';
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: searchRegex },
      { subject: searchRegex },
      { classLevel: searchRegex },
      { sourceId: searchRegex },
      { 'chapters.title': searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  let sortObj = { order: 1, createdAt: -1 };
  if (sort === 'newest') sortObj = { createdAt: -1 };
  if (sort === 'title') sortObj = { title: 1 };
  if (sort === 'views') sortObj = { viewsCount: -1 };

  const [resources, total] = await Promise.all([
    EducationalResource.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
    EducationalResource.countDocuments(query),
  ]);

  return success(res, 'Admin resources retrieved', {
    resources,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

/**
 * Admin Get Single Resource for Editing
 * GET /api/admin/resources/:id
 */
exports.adminGetResourceById = asyncHandler(async (req, res) => {
  const resource = await EducationalResource.findById(req.params.id);
  if (!resource) {
    return error(res, 'Resource not found', 404);
  }
  return success(res, 'Resource retrieved', { resource });
});

/**
 * Admin Create Manual Educational Resource (Fallback)
 * POST /api/admin/resources
 */
exports.adminCreateResource = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    medium,
    classLevel,
    subject,
    resourceType = 'BOOK',
    publisher = 'NCERT',
    officialUrl,
    downloadUrl,
    coverImageUrl,
    chapters = [],
    isActive = true,
  } = req.body;

  if (!title || !category || !medium || !classLevel || !subject) {
    return error(res, 'Title, category, medium, class level, and subject are required', 400);
  }

  // Generate a safe unique sourceId if not provided
  const sourceId = `manual-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const resource = await EducationalResource.create({
    title,
    description,
    category,
    medium,
    classLevel,
    subject,
    resourceType,
    publisher,
    officialUrl,
    downloadUrl,
    coverImageUrl,
    chapters,
    isActive,
    sourceId,
    lastSyncedAt: new Date(),
  });

  await logAuditAction({
    adminId: req.user.id,
    action: 'CREATE_EDUCATIONAL_RESOURCE',
    targetType: 'EDUCATIONAL_RESOURCE',
    targetId: resource._id,
    details: `Created educational resource: ${title} (${classLevel} ${subject})`,
    req,
  });

  return success(res, 'Resource created successfully', { resource }, 201);
});

/**
 * Admin Update Resource and Chapters
 * PUT /api/admin/resources/:id
 */
exports.adminUpdateResource = asyncHandler(async (req, res) => {
  const resource = await EducationalResource.findById(req.params.id);
  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  const {
    title,
    description,
    category,
    medium,
    classLevel,
    subject,
    resourceType,
    publisher,
    officialUrl,
    downloadUrl,
    coverImageUrl,
    chapters,
    isActive,
    availabilityStatus,
    order,
  } = req.body;

  if (title) resource.title = title;
  if (description !== undefined) resource.description = description;
  if (category) resource.category = category;
  if (medium) resource.medium = medium;
  if (classLevel) resource.classLevel = classLevel;
  if (subject) resource.subject = subject;
  if (resourceType) resource.resourceType = resourceType;
  if (publisher) resource.publisher = publisher;
  if (officialUrl !== undefined) resource.officialUrl = officialUrl;
  if (downloadUrl !== undefined) resource.downloadUrl = downloadUrl;
  if (coverImageUrl !== undefined) resource.coverImageUrl = coverImageUrl;
  if (chapters !== undefined) resource.chapters = chapters;
  if (isActive !== undefined) resource.isActive = isActive;
  if (availabilityStatus) resource.availabilityStatus = availabilityStatus;
  if (order !== undefined) resource.order = order;

  await resource.save();

  await logAuditAction({
    adminId: req.user.id,
    action: 'UPDATE_EDUCATIONAL_RESOURCE',
    targetType: 'EDUCATIONAL_RESOURCE',
    targetId: resource._id,
    details: `Updated educational resource: ${resource.title}`,
    req,
  });

  return success(res, 'Resource updated successfully', { resource });
});

/**
 * Admin Deactivate / Soft-Delete Resource
 * DELETE /api/admin/resources/:id
 */
exports.adminDeleteResource = asyncHandler(async (req, res) => {
  const { hardDelete } = req.query;
  const resource = await EducationalResource.findById(req.params.id);

  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  if (hardDelete === 'true') {
    await EducationalResource.deleteOne({ _id: resource._id });
    await logAuditAction({
      adminId: req.user.id,
      action: 'HARD_DELETE_EDUCATIONAL_RESOURCE',
      targetType: 'EDUCATIONAL_RESOURCE',
      targetId: resource._id,
      details: `Permanently deleted resource: ${resource.title}`,
      req,
    });
    return success(res, 'Resource permanently deleted');
  }

  // Soft delete / deactivate
  resource.isActive = false;
  await resource.save();

  await logAuditAction({
    adminId: req.user.id,
    action: 'DEACTIVATE_EDUCATIONAL_RESOURCE',
    targetType: 'EDUCATIONAL_RESOURCE',
    targetId: resource._id,
    details: `Deactivated resource: ${resource.title}`,
    req,
  });

  return success(res, 'Resource deactivated successfully');
});

/**
 * Admin Restore Deactivated Resource
 * PUT /api/admin/resources/:id/restore
 */
exports.adminRestoreResource = asyncHandler(async (req, res) => {
  const resource = await EducationalResource.findById(req.params.id);
  if (!resource) {
    return error(res, 'Resource not found', 404);
  }

  resource.isActive = true;
  resource.availabilityStatus = 'AVAILABLE';
  await resource.save();

  await logAuditAction({
    adminId: req.user.id,
    action: 'RESTORE_EDUCATIONAL_RESOURCE',
    targetType: 'EDUCATIONAL_RESOURCE',
    targetId: resource._id,
    details: `Restored resource: ${resource.title}`,
    req,
  });

  return success(res, 'Resource restored successfully', { resource });
});
