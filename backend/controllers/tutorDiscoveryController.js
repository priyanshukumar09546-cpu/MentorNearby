// ============================================================
// controllers/tutorDiscoveryController.js
// Tutor Discovery Engine & City Target Management Endpoints
// ============================================================

const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const DiscoveryCity = require('../models/DiscoveryCity');
const TutorLead = require('../models/TutorLead');
const DiscoveryLog = require('../models/DiscoveryLog');
const discoveryWorker = require('../services/discovery/DiscoveryWorker');
const providerRegistry = require('../services/discovery/ProviderRegistry');
const deduplicationService = require('../services/discovery/DeduplicationService');
const seedDiscoveryCities = require('../seeds/seedDiscoveryCities');

// ── 1. GET ALL CITIES ──
exports.getCities = asyncHandler(async (req, res) => {
  // Ensure cities exist on first load
  const totalInDb = await DiscoveryCity.countDocuments();
  if (totalInDb === 0) {
    await seedDiscoveryCities().catch(() => {});
  }

  const cities = await DiscoveryCity.find().sort({ isPriority: -1, discoveredCount: -1, name: 1 });
  return success(res, 'Discovery cities fetched successfully', { cities, total: cities.length });
});

// ── 2. ADD CUSTOM INDIAN CITY ──
exports.addCity = asyncHandler(async (req, res) => {
  const { name, state, targetLeadCount = 50, isPriority = false } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return error(res, 'Valid city name is required', 400);
  }

  const cleanName = name.trim();
  const existing = await DiscoveryCity.findOne({ name: new RegExp(`^${cleanName}$`, 'i') });
  if (existing) {
    return error(res, `City [${cleanName}] already exists in discovery manager`, 409);
  }

  const target = parseInt(targetLeadCount) || 50;
  const newCity = await DiscoveryCity.create({
    name: cleanName,
    state: (state || '').trim(),
    targetLeadCount: Math.min(Math.max(target, 5), 5000),
    isPriority: Boolean(isPriority),
    isEnabled: true,
    status: 'IDLE',
  });

  return success(res, `City [${cleanName}] added with target ${target} leads`, newCity, 201);
});

// ── 3. UPDATE CITY ──
exports.updateCity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetLeadCount, isEnabled, isPriority, state } = req.body;

  const city = await DiscoveryCity.findById(id);
  if (!city) {
    return error(res, 'City not found', 404);
  }

  if (targetLeadCount !== undefined) {
    city.targetLeadCount = Math.min(Math.max(parseInt(targetLeadCount) || 50, 5), 5000);
  }
  if (isEnabled !== undefined) {
    city.isEnabled = Boolean(isEnabled);
  }
  if (isPriority !== undefined) {
    city.isPriority = Boolean(isPriority);
  }
  if (state !== undefined) {
    city.state = state.trim();
  }

  await city.save();
  return success(res, `City [${city.name}] updated successfully`, city);
});

// ── 4. DELETE CITY ──
exports.deleteCity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const city = await DiscoveryCity.findById(id);
  if (!city) {
    return error(res, 'City not found', 404);
  }

  await DiscoveryCity.findByIdAndDelete(id);
  return success(res, `City [${city.name}] removed from discovery manager`, { id });
});

// ── 5. START DISCOVERY RUN ──
exports.startDiscovery = asyncHandler(async (req, res) => {
  const { cityName, cityId, allEnabled } = req.body;

  const result = await discoveryWorker.start({
    cityName,
    cityId,
    allEnabled: Boolean(allEnabled),
  });

  if (!result.success) {
    return error(res, result.message, 400);
  }

  return success(res, result.message, discoveryWorker.getStatus());
});

// ── 6. PAUSE DISCOVERY ──
exports.pauseDiscovery = asyncHandler(async (req, res) => {
  const result = discoveryWorker.pause();
  if (!result.success) {
    return error(res, result.message, 400);
  }
  return success(res, result.message, discoveryWorker.getStatus());
});

// ── 7. RESUME DISCOVERY ──
exports.resumeDiscovery = asyncHandler(async (req, res) => {
  const result = await discoveryWorker.resume();
  if (!result.success) {
    return error(res, result.message, 400);
  }
  return success(res, result.message, discoveryWorker.getStatus());
});

// ── 8. RETRY FAILED CITIES ──
exports.retryFailed = asyncHandler(async (req, res) => {
  const failedCities = await DiscoveryCity.find({ status: 'FAILED' });
  for (const c of failedCities) {
    c.status = 'IDLE';
    c.lastError = '';
    await c.save();
  }

  const result = await discoveryWorker.start({ allEnabled: true });
  return success(res, `Retrying ${failedCities.length} failed cities`, result);
});

// ── 9. GET DISCOVERY STATS (KPIS) ──
exports.getDiscoveryStats = asyncHandler(async (req, res) => {
  const totalCities = await DiscoveryCity.countDocuments();
  const totalLeads = await TutorLead.countDocuments();

  const [
    discoveredCount,
    leadCount,
    invitedCount,
    claimedCount,
    completedCount,
    pendingVerificationCount,
    verifiedCount,
    liveCount,
  ] = await Promise.all([
    TutorLead.countDocuments({ status: 'DISCOVERED' }),
    TutorLead.countDocuments({ status: 'LEAD' }),
    TutorLead.countDocuments({ status: 'INVITED' }),
    TutorLead.countDocuments({ status: 'CLAIMED' }),
    TutorLead.countDocuments({ status: 'PROFILE_COMPLETED' }),
    TutorLead.countDocuments({ status: 'VERIFICATION_PENDING' }),
    TutorLead.countDocuments({ status: 'VERIFIED' }),
    TutorLead.countDocuments({ status: 'LIVE' }),
  ]);

  const workerStatus = discoveryWorker.getStatus();

  return success(res, 'Discovery stats fetched successfully', {
    totalCities,
    totalLeads,
    pipeline: {
      discovered: discoveredCount,
      lead: leadCount,
      invited: invitedCount,
      claimed: claimedCount,
      profileCompleted: completedCount,
      verificationPending: pendingVerificationCount,
      verified: verifiedCount,
      live: liveCount,
    },
    worker: workerStatus,
  });
});

// ── 10. GET RECENT DISCOVERY LOGS ──
exports.getDiscoveryLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const city = req.query.city;
  const level = req.query.level;

  const query = {};
  if (city) query.city = new RegExp(`^${city}$`, 'i');
  if (level) query.level = level.toUpperCase();

  const logs = await DiscoveryLog.find(query).sort({ timestamp: -1 }).limit(limit);
  return success(res, 'Discovery logs fetched successfully', logs);
});

// ── 11. MANUAL DEDUPLICATION SWEEP ──
exports.runDeduplication = asyncHandler(async (req, res) => {
  const result = await deduplicationService.sweepDuplicates();
  return success(res, `Deduplication complete. Scanned: ${result.scanned}, Consolidated duplicates: ${result.consolidated}`, result);
});

// ── 12. GET PROVIDERS ──
exports.getProviders = asyncHandler(async (req, res) => {
  const providers = providerRegistry.getAll();
  return success(res, 'Providers fetched', providers);
});

// ── 13. TOGGLE PROVIDER ──
exports.toggleProvider = asyncHandler(async (req, res) => {
  const { name, isEnabled } = req.body;
  const updated = providerRegistry.setEnabled(name, isEnabled);
  return success(res, `Provider [${name}] set to ${isEnabled ? 'enabled' : 'disabled'}`, updated);
});

// ── 14. PUBLIC CLAIM ENDPOINT: GET CLAIM DETAILS ──
exports.getClaimDetails = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) return error(res, 'Claim token is required', 400);

  const lead = await TutorLead.findOne({
    claimToken: token,
    claimTokenExpires: { $gt: new Date() },
  });

  if (!lead) {
    return error(res, 'Invalid or expired claim token. Please contact MentorNearby support.', 404);
  }

  if (lead.claimed) {
    return error(res, 'This tutor profile has already been claimed.', 400);
  }

  return success(res, 'Claim details retrieved', {
    name: lead.name,
    city: lead.city,
    locality: lead.locality,
    subjects: lead.subjects,
    classes: lead.classes,
    qualification: lead.qualification,
    experience: lead.experience,
    teachingMode: lead.teachingMode,
    source: lead.source,
    discoveredAt: lead.discoveredAt,
  });
});

// ── 15. PUBLIC CLAIM ENDPOINT: SUBMIT CLAIM & PROFILE ──
exports.submitClaim = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { phone, email, subjects, classes, qualification, experience, teachingMode, fee } = req.body;

  const lead = await TutorLead.findOne({
    claimToken: token,
    claimTokenExpires: { $gt: new Date() },
  });

  if (!lead) {
    return error(res, 'Invalid or expired claim token', 404);
  }

  if (lead.claimed) {
    return error(res, 'This tutor profile has already been claimed', 400);
  }

  // Update lead details with tutor's verified input
  if (phone) lead.phone = phone.trim();
  if (email) lead.email = email.trim().toLowerCase();
  if (Array.isArray(subjects) && subjects.length > 0) lead.subjects = subjects;
  if (Array.isArray(classes) && classes.length > 0) lead.classes = classes;
  if (qualification) lead.qualification = qualification.trim();
  if (experience) lead.experience = experience.trim();
  if (teachingMode) lead.teachingMode = teachingMode;
  if (fee !== undefined && fee !== null) {
    if (typeof fee === 'number') {
      lead.fee = { amount: fee, frequency: 'PER_MONTH', rawText: `₹${fee}/month` };
    } else if (typeof fee === 'object') {
      lead.fee = {
        amount: Number(fee.amount) || null,
        frequency: fee.frequency || 'PER_MONTH',
        rawText: fee.rawText || (fee.amount ? `₹${fee.amount}` : ''),
      };
    } else {
      const parsed = parseInt(fee, 10);
      lead.fee = { amount: isNaN(parsed) ? null : parsed, frequency: 'PER_MONTH', rawText: String(fee) };
    }
  }

  lead.claimed = true;
  lead.claimedAt = new Date();
  lead.status = 'VERIFICATION_PENDING'; // Ready for admin KYC review!

  await lead.save();

  // Also update city claimed count
  await DiscoveryCity.findOneAndUpdate(
    { name: new RegExp(`^${lead.city}$`, 'i') },
    { $inc: { claimedCount: 1 } }
  );

  return success(res, 'Profile claimed and submitted for verification! Our team will review your profile shortly.', {
    leadId: lead._id,
    status: lead.status,
  });
});
