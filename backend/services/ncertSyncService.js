// ============================================================
// services/ncertSyncService.js
// Automatic and On-Demand NCERT Educational Content Sync Engine
// ============================================================

const EducationalResource = require('../models/EducationalResource');
const ContentSource = require('../models/ContentSource');
const ncertCatalog = require('./ncertCatalogData');

let isSyncInProgress = false;

/**
 * Get current sync status and latest sync information
 */
const getSyncStatus = async () => {
  let source = await ContentSource.findOne({ name: 'NCERT' });
  if (!source) {
    source = await ContentSource.create({
      name: 'NCERT',
      baseUrl: 'https://ncert.nic.in',
      enabled: true,
      lastSyncStatus: isSyncInProgress ? 'RUNNING' : 'IDLE',
      lastSyncSummary: { newResources: 0, updated: 0, unavailable: 0, total: 0, message: 'Not synced yet' },
    });
  }

  const totalInDb = await EducationalResource.countDocuments();
  const activeInDb = await EducationalResource.countDocuments({ isActive: true });
  const unavailableInDb = await EducationalResource.countDocuments({ availabilityStatus: 'UNAVAILABLE' });

  return {
    inProgress: isSyncInProgress,
    name: source.name,
    baseUrl: source.baseUrl,
    enabled: source.enabled,
    lastSyncAt: source.lastSyncAt,
    lastSyncStatus: isSyncInProgress ? 'RUNNING' : source.lastSyncStatus,
    lastSyncSummary: source.lastSyncSummary,
    health: {
      total: totalInDb,
      active: activeInDb,
      unavailable: unavailableInDb,
      missingUrls: 0,
      duplicates: 0,
    },
    syncLogs: source.syncLogs?.slice(-10) || [],
  };
};

/**
 * Execute synchronization of NCERT official catalog into MongoDB
 * Safe, idempotent, non-destructive to existing resources
 */
const runSync = async ({ forced = false } = {}) => {
  if (isSyncInProgress) {
    return {
      success: false,
      message: 'Sync is already running. Please wait for the current operation to complete.',
      status: 'RUNNING',
    };
  }

  isSyncInProgress = true;
  const startTime = new Date();

  // Update or create source state
  let source = await ContentSource.findOne({ name: 'NCERT' });
  if (!source) {
    source = new ContentSource({ name: 'NCERT', baseUrl: 'https://ncert.nic.in' });
  }

  source.lastSyncStatus = 'RUNNING';
  await source.save();

  let newCount = 0;
  let updatedCount = 0;
  let unavailableCount = 0;
  let totalProcessed = 0;

  try {
    const catalog = ncertCatalog.getResources();
    totalProcessed = catalog.length;

    for (const item of catalog) {
      if (!item.sourceId) continue;

      const existing = await EducationalResource.findOne({ sourceId: item.sourceId });

      if (!existing) {
        // Create new resource
        await EducationalResource.create({
          ...item,
          isActive: true,
          availabilityStatus: 'AVAILABLE',
          lastSyncedAt: new Date(),
        });
        newCount++;
      } else {
        // Update existing resource safely (preserve views, bookmarks, custom overrides if any)
        existing.title = item.title;
        existing.description = item.description || existing.description;
        existing.category = item.category;
        existing.medium = item.medium;
        existing.classLevel = item.classLevel;
        existing.subject = item.subject;
        existing.resourceType = item.resourceType;
        existing.publisher = item.publisher || 'NCERT';
        existing.officialUrl = item.officialUrl;
        existing.downloadUrl = item.downloadUrl || existing.downloadUrl;
        existing.coverImageUrl = item.coverImageUrl || existing.coverImageUrl;
        existing.chapters = item.chapters;
        existing.lastSyncedAt = new Date();
        existing.order = item.order || existing.order || 0;
        
        // If it was marked unavailable previously, restore to available upon successful re-sync
        if (existing.availabilityStatus === 'UNAVAILABLE' && item.officialUrl) {
          existing.availabilityStatus = 'AVAILABLE';
        }

        await existing.save();
        updatedCount++;
      }
    }

    const summary = {
      newResources: newCount,
      updated: updatedCount,
      unavailable: unavailableCount,
      total: await EducationalResource.countDocuments(),
      message: `NCERT Sync completed successfully on ${startTime.toLocaleString()}`,
    };

    source.lastSyncAt = new Date();
    source.lastSyncStatus = 'SUCCESS';
    source.lastSyncSummary = summary;
    source.syncLogs.push({
      timestamp: new Date(),
      status: 'SUCCESS',
      details: `Processed ${totalProcessed} resources (${newCount} new, ${updatedCount} updated)`,
      stats: summary,
    });

    // Keep last 50 logs
    if (source.syncLogs.length > 50) {
      source.syncLogs = source.syncLogs.slice(-50);
    }

    await source.save();

    isSyncInProgress = false;

    return {
      success: true,
      message: 'NCERT Sync completed successfully',
      summary,
      lastSyncAt: source.lastSyncAt,
    };
  } catch (error) {
    console.error('NCERT Sync Error:', error);

    source.lastSyncStatus = 'FAILED';
    source.syncLogs.push({
      timestamp: new Date(),
      status: 'FAILED',
      details: `Sync failed: ${error.message}`,
    });
    await source.save();

    isSyncInProgress = false;

    return {
      success: false,
      message: `NCERT sync failed. Existing resources remain available. Error: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * Validate links across educational resources
 */
const validateResourceLinks = async () => {
  const resources = await EducationalResource.find({ isActive: true }).limit(50);
  let checkedCount = 0;
  let invalidCount = 0;

  for (const res of resources) {
    checkedCount++;
    if (!res.officialUrl || !res.officialUrl.startsWith('http')) {
      res.availabilityStatus = 'UNAVAILABLE';
      invalidCount++;
      await res.save();
    }
  }

  return {
    checkedCount,
    invalidCount,
    validCount: checkedCount - invalidCount,
  };
};

/**
 * Initialize recurring background sync scheduler
 */
const initScheduledSync = () => {
  // Check on startup after 15 seconds, and then every 7 days
  setTimeout(async () => {
    try {
      const source = await ContentSource.findOne({ name: 'NCERT' });
      const total = await EducationalResource.countDocuments();
      
      // Auto-run initial sync if DB is empty
      if (total === 0) {
        console.log('📚 [NCERT Sync Engine] Initializing database with official NCERT content...');
        await runSync();
        console.log('✅ [NCERT Sync Engine] Initial sync completed successfully.');
      } else if (source && source.lastSyncAt) {
        const daysSinceLastSync = (Date.now() - new Date(source.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSync >= (source.syncIntervalDays || 7)) {
          console.log('📚 [NCERT Sync Engine] Running scheduled weekly sync...');
          await runSync();
        }
      }
    } catch (err) {
      console.warn('NCERT scheduled sync check skipped:', err.message);
    }
  }, 15000);

  // Periodic interval check every 24 hours
  setInterval(async () => {
    try {
      const source = await ContentSource.findOne({ name: 'NCERT' });
      if (source && source.enabled && source.lastSyncAt) {
        const daysSinceLastSync = (Date.now() - new Date(source.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSync >= (source.syncIntervalDays || 7)) {
          console.log('📚 [NCERT Sync Engine] Weekly sync timer triggered...');
          await runSync();
        }
      }
    } catch (err) {
      console.warn('NCERT periodic sync error:', err.message);
    }
  }, 24 * 60 * 60 * 1000);
};

module.exports = {
  getSyncStatus,
  runSync,
  validateResourceLinks,
  initScheduledSync,
};
