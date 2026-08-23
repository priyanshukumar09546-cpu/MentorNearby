const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const KYC = require('../models/KYC');
const TutorProfile = require('../models/TutorProfile');
const User = require('../models/User');
const cloudinaryService = require('../services/cloudinaryService');
const emailService = require('../services/emailService');
const logAuditAction = require('../utils/auditLogger');
const { createNotification } = require('./notificationController');

exports.submitKyc = asyncHandler(async (req, res, next) => {
  let existingKyc = await KYC.findOne({ user: req.user.id });

  if (existingKyc && existingKyc.status === 'VERIFIED') {
    return error(res, 'KYC is already verified', 400);
  }

  const { govtIdType, govtIdLast4, documents } = req.body;

  let docs = [];
  if (req.files && req.files.length > 0) {
    docs = await Promise.all(
      req.files.map(async file => {
        const result = await cloudinaryService.uploadKycDocument(file.buffer, req.user.id);
        return {
          type: req.body.documentType || 'GOVT_ID',
          url: result.secure_url,
          publicId: result.public_id
        };
      })
    );
  } else if (Array.isArray(documents) && documents.length > 0) {
    docs = documents.map(d => ({
      type: d.type || 'GOVT_ID',
      url: d.url,
      publicId: d.publicId || ''
    }));
  }

  if (docs.length === 0 && (!existingKyc || existingKyc.documents.length === 0)) {
    return error(res, 'At least one document (Govt ID / Qualification / College ID) must be provided', 400);
  }

  const tutorProfile = await TutorProfile.findOne({ user: req.user.id });

  if (existingKyc) {
    existingKyc.documents = docs.length > 0 ? docs : existingKyc.documents;
    existingKyc.status = 'PENDING';
    if (govtIdType) existingKyc.govtIdType = govtIdType;
    if (govtIdLast4) existingKyc.govtIdLast4 = govtIdLast4;
    existingKyc.rejectionReason = undefined;
    await existingKyc.save();
  } else {
    existingKyc = await KYC.create({
      user: req.user.id,
      tutorProfile: tutorProfile ? tutorProfile._id : null,
      documents: docs,
      govtIdType: govtIdType || 'AADHAAR',
      govtIdLast4: govtIdLast4 || '',
      status: 'PENDING'
    });
  }

  if (tutorProfile) {
    tutorProfile.kycStatus = 'PENDING';
    await tutorProfile.save();
  }

  try {
    await emailService.sendEmail({
      to: req.user.email,
      subject: 'KYC Submitted Successfully',
      text: 'Your KYC documents have been submitted and are pending review.'
    });
  } catch (err) {
    console.error('KYC email notification failed:', err.message);
  }

  return success(res, 'KYC submitted successfully', { kyc: existingKyc });
});

exports.getMyKycStatus = asyncHandler(async (req, res, next) => {
  const kyc = await KYC.findOne({ user: req.user.id });
  
  if (!kyc) {
    return success(res, 'No KYC record found', { status: 'NOT_SUBMITTED' });
  }

  const safeDocs = kyc.documents.map(doc => ({
    type: doc.type,
    url: doc.url,
    uploadedAt: doc.uploadedAt || doc.createdAt
  }));

  return success(res, 'KYC status retrieved', {
    status: kyc.status,
    submittedAt: kyc.createdAt,
    rejectionReason: kyc.rejectionReason,
    govtIdType: kyc.govtIdType,
    govtIdLast4: kyc.govtIdLast4,
    documents: safeDocs
  });
});

exports.adminGetKycList = asyncHandler(async (req, res, next) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const pendingCount = await KYC.countDocuments({ status: 'PENDING' });
  const verifiedToday = await KYC.countDocuments({ status: 'VERIFIED', updatedAt: { $gte: startOfToday } });
  const rejectedToday = await KYC.countDocuments({ status: 'REJECTED', updatedAt: { $gte: startOfToday } });

  let kycRecords = await KYC.find(query)
    .populate('user', 'name email phone role createdAt')
    .populate('tutorProfile', 'professionalHeadline bio teachingPhilosophy profilePhoto introVideo education subjects grades languages teachingModes experience fees location serviceAreas availability verificationStatus kycStatus profileCompletionPercentage')
    .sort({ createdAt: -1 });

  // In-memory filter if search query is provided
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    kycRecords = kycRecords.filter(record => {
      const name = record.user?.name?.toLowerCase() || '';
      const email = record.user?.email?.toLowerCase() || '';
      const phone = record.user?.phone?.toLowerCase() || '';
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }

  const total = kycRecords.length;
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const paginatedRecords = kycRecords.slice(startIndex, startIndex + parseInt(limit));

  return success(res, 'KYC records retrieved', {
    kycRecords: paginatedRecords,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)) || 1,
    pendingCount,
    verifiedToday,
    rejectedToday
  });
});

exports.adminGetKycDetail = asyncHandler(async (req, res, next) => {
  let kyc = await KYC.findById(req.params.id)
    .populate('user', 'name email phone role createdAt')
    .populate('tutorProfile');

  if (!kyc) {
    kyc = await KYC.findOne({ user: req.params.id })
      .populate('user', 'name email phone role createdAt')
      .populate('tutorProfile');
  }
  
  if (!kyc) {
    return error(res, 'KYC record not found', 404);
  }

  // Audit document viewing
  try {
    await logAuditAction({
      adminId: req.user?._id || req.user?.id,
      action: 'KYC_DOCUMENT_VIEWED',
      targetType: 'KYC',
      targetId: kyc._id,
      details: `Admin viewed KYC details for user ${kyc.user?._id || kyc.user}`,
      req
    });
  } catch (auditErr) {
    console.error('Audit log failed:', auditErr.message);
  }

  return success(res, 'KYC detail retrieved', { kyc });
});

exports.adminUpdateKycStatus = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason, adminNotes } = req.body;

  if (!status) {
    return error(res, 'Status is required', 400);
  }

  // Try finding by KYC ID, or user ID
  let kyc = await KYC.findById(req.params.id).populate('user');
  if (!kyc) {
    kyc = await KYC.findOne({ user: req.params.id }).populate('user');
  }
  
  if (!kyc) {
    return error(res, 'KYC record not found', 404);
  }

  const previousStatus = kyc.status;

  kyc.status = status;
  if (status === 'REJECTED') {
    kyc.rejectionReason = rejectionReason || 'Documents non-verifiable or incomplete';
  } else if (status === 'VERIFIED') {
    kyc.rejectionReason = undefined;
  }
  if (adminNotes) kyc.adminNotes = adminNotes;
  
  await kyc.save();

  // Update linked TutorProfile
  const updateFields = { kycStatus: status };
  if (status === 'VERIFIED') {
    updateFields['verificationStatus.identity'] = true;
    updateFields['verificationStatus.collegeId'] = true;
    updateFields['verificationStatus.profile'] = true;
  } else if (status === 'REJECTED') {
    updateFields['verificationStatus.identity'] = false;
  }

  const userId = kyc.user?._id || kyc.user;

  const updatedTutorProfile = await TutorProfile.findOneAndUpdate(
    { user: userId },
    updateFields,
    { new: true }
  );

  if (updatedTutorProfile && typeof updatedTutorProfile.calculateProfileCompletion === 'function') {
    updatedTutorProfile.calculateProfileCompletion();
    await updatedTutorProfile.save();
  }

  // Write to AuditLog
  try {
    await logAuditAction({
      adminId: req.user?._id || req.user?.id,
      action: status === 'VERIFIED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      targetType: 'KYC',
      targetId: kyc._id,
      details: `Updated KYC status for user ${userId} to ${status}.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`,
      req
    });
  } catch (auditErr) {
    console.error('Audit logging failed:', auditErr.message);
  }

  // Send email safely
  if (previousStatus !== status && kyc.user?.email) {
    try {
      await emailService.sendEmail({
        to: kyc.user.email,
        subject: `KYC Status Update: ${status}`,
        text: `Your KYC verification status has been updated to ${status}.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`
      });
    } catch (emailErr) {
      console.error('KYC notification email failed:', emailErr.message);
    }
  }

  // Send In-App Notification
  if (previousStatus !== status) {
    try {
      const isApproved = status === 'VERIFIED';
      await createNotification(
        userId,
        isApproved ? 'KYC Verification Approved 🎉' : 'KYC Verification Update',
        isApproved
          ? 'Congratulations! Your Tutor KYC verification has been approved. Your profile is now verified.'
          : `Your KYC submission was marked as ${status}.${rejectionReason ? ' Reason: ' + rejectionReason : ' Please review and resubmit documents.'}`,
        'KYC_VERIFICATION',
        '/tutor/kyc',
        { actionText: isApproved ? 'View Profile' : 'Review KYC' }
      );
    } catch (nErr) {
      console.error('KYC in-app notification failed:', nErr);
    }
  }

  return success(res, `KYC status updated to ${status} successfully`, { kyc });
});
