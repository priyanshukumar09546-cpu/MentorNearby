// ============================================================
// controllers/tutorLeadController.js
// Management of Discovered Tutor Leads Pipeline
// Invite, Claim Token Generation, Admin KYC Approval & Rejection
// ============================================================

const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const TutorLead = require('../models/TutorLead');
const DiscoveryCity = require('../models/DiscoveryCity');
const TutorProfile = require('../models/TutorProfile');
const User = require('../models/User');

// ── 1. GET PAGINATED & FILTERED LEADS ──
exports.getLeads = asyncHandler(async (req, res) => {
  const {
    city,
    status,
    subject,
    provider,
    search,
    page = 1,
    limit = 20,
    sort = '-discoveredAt',
  } = req.query;

  const query = {};

  if (city) {
    query.city = new RegExp(`^${city.trim()}$`, 'i');
  }

  if (status) {
    query.status = status.trim().toUpperCase();
  }

  if (subject) {
    query.subjects = { $in: [new RegExp(subject.trim(), 'i')] };
  }

  if (provider) {
    query.sourceProvider = provider.trim();
  }

  if (search) {
    const sRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: sRegex },
      { city: sRegex },
      { locality: sRegex },
      { subjects: sRegex },
      { qualification: sRegex },
    ];
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [leads, total] = await Promise.all([
    TutorLead.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('claimedBy', 'name email phone avatar')
      .populate('tutorProfile', '_id isApproved isVerified profileStatus'),
    TutorLead.countDocuments(query),
  ]);

  return success(res, 'Tutor leads fetched successfully', {
    leads,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// ── 2. GET LEAD DETAILS BY ID ──
exports.getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await TutorLead.findById(id)
    .populate('claimedBy', 'name email phone avatar')
    .populate('tutorProfile');

  if (!lead) {
    return error(res, 'Tutor lead not found', 404);
  }

  return success(res, 'Tutor lead fetched successfully', lead);
});

// ── 3. INVITE LEAD (Generate secure unique claim token & URL) ──
exports.inviteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await TutorLead.findById(id);

  if (!lead) {
    return error(res, 'Tutor lead not found', 404);
  }

  if (lead.claimed) {
    return error(res, 'Tutor has already claimed this profile', 400);
  }

  // Generate 32-byte secure hex token valid for 30 days
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  lead.claimToken = token;
  lead.claimTokenExpires = expires;
  lead.inviteSentAt = new Date();
  lead.status = 'INVITED';
  await lead.save();

  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const claimUrl = `${baseUrl}/claim-profile/${token}`;

  return success(res, `Invitation generated for ${lead.name}`, {
    claimToken: token,
    claimUrl,
    expiresAt: expires,
    status: lead.status,
  });
});

// ── 4. ADMIN APPROVE LEAD (Transitions to VERIFIED & LIVE) ──
exports.approveLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await TutorLead.findById(id);

  if (!lead) {
    return error(res, 'Tutor lead not found', 404);
  }

  // Require lead to be claimed or completed first (or admin manual approval)
  lead.status = 'LIVE';
  lead.verified = true;
  await lead.save();

  // If claimedBy user exists, ensure TutorProfile is marked LIVE
  if (lead.claimedBy) {
    let tutorProfile = await TutorProfile.findOne({ user: lead.claimedBy });
    if (tutorProfile) {
      tutorProfile.isApproved = true;
      tutorProfile.isVerified = true;
      tutorProfile.verificationStatus = 'verified';
      tutorProfile.profileStatus = 'approved';
      tutorProfile.profileVisibility = true;
      await tutorProfile.save();
    }
  }

  // Update city live count
  await DiscoveryCity.findOneAndUpdate(
    { name: new RegExp(`^${lead.city}$`, 'i') },
    { $inc: { verifiedCount: 1, liveCount: 1 } }
  );

  return success(res, `Tutor lead [${lead.name}] approved and marked LIVE`, {
    leadId: lead._id,
    status: lead.status,
  });
});

// ── 5. ADMIN REJECT LEAD ──
exports.rejectLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = '' } = req.body;
  const lead = await TutorLead.findById(id);

  if (!lead) {
    return error(res, 'Tutor lead not found', 404);
  }

  lead.status = 'REJECTED';
  lead.adminNotes = reason || 'Rejected by administrator';
  await lead.save();

  return success(res, `Tutor lead [${lead.name}] rejected`, {
    leadId: lead._id,
    status: lead.status,
  });
});
