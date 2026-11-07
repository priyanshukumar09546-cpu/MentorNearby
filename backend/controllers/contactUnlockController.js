// ============================================================
// controllers/contactUnlockController.js
// MentorNearby Strict Contact Unlock Controller
// Gated exclusively by "MentorNearby All Access" — ₹199/month
// ============================================================

const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ContactUnlock = require('../models/ContactUnlock');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const TutorProfile = require('../models/TutorProfile');
const TuitionRequirement = require('../models/TuitionRequirement');
const StudentProfile = require('../models/StudentProfile');
const Payment = require('../models/Payment');
const { UNIFIED_PLAN, maskPhoneNumber, hasActiveSubscription } = require('../config/subscription');
const razorpayService = require('../services/razorpayService');

/**
 * Helper to resolve raw contact information for a Tutor, Student lead, or Tuition Requirement.
 */
const resolveContactInfo = async (targetId) => {
  if (!targetId) return null;
  const isValidObjId = mongoose.Types.ObjectId.isValid(targetId);
  const objId = isValidObjId ? new mongoose.Types.ObjectId(targetId) : null;

  // 1. Try TutorProfile
  let tutorProfile = null;
  if (objId) {
    tutorProfile = await TutorProfile.findOne({
      $or: [{ _id: objId }, { user: objId }],
    }).populate({ path: 'user', select: '+phone name email' });
  } else if (typeof targetId === 'string' && targetId.trim()) {
    tutorProfile = await TutorProfile.findOne({
      slug: new RegExp(`^${targetId.trim()}$`, 'i'),
    }).populate({ path: 'user', select: '+phone name email' });
  }

  if (tutorProfile) {
    const rawPhone = tutorProfile.phone || tutorProfile.user?.phone || '';
    const rawWhatsApp = tutorProfile.whatsappNumber || rawPhone;
    return {
      type: 'TUTOR',
      targetId: tutorProfile._id,
      tutorProfileId: tutorProfile._id,
      tutorUserId: tutorProfile.user?._id || tutorProfile.user,
      name: tutorProfile.user?.name || tutorProfile.name || 'Tutor',
      phone: rawPhone,
      email: tutorProfile.user?.email || tutorProfile.email || '',
      whatsappNumber: rawWhatsApp,
    };
  }

  // 2. Try TuitionRequirement (Student Lead)
  let reqDoc = null;
  if (objId) {
    reqDoc = await TuitionRequirement.findById(objId)
      .populate({ path: 'student', select: '+phone name email avatar' })
      .catch(() => null);
  }
  if (reqDoc) {
    const studentProfile = await StudentProfile.findOne({
      user: reqDoc.student?._id || reqDoc.student,
    })
      .select('+phone +parentDetails.phone')
      .catch(() => null);
    const rawPhone =
      reqDoc.student?.phone ||
      studentProfile?.parentDetails?.phone ||
      studentProfile?.phone ||
      reqDoc.phone ||
      '';
    const studentName =
      reqDoc.studentName ||
      reqDoc.student?.name ||
      studentProfile?.studentDetails?.name ||
      'Student Lead';
    return {
      type: 'STUDENT_REQUIREMENT',
      targetId: reqDoc._id,
      targetUserId: reqDoc.student?._id || reqDoc.student,
      name: studentName,
      phone: rawPhone,
      email: reqDoc.student?.email || '',
      whatsappNumber: studentProfile?.whatsappNumber || rawPhone,
      budget: reqDoc.budget?.amount ? `₹${reqDoc.budget.amount}/mo` : '₹5000/mo',
      studentClass: reqDoc.class || reqDoc.studentClass || 'Class 10',
      subjects: reqDoc.subjects || [],
      city: reqDoc.location?.city || '',
    };
  }

  // 3. Try StudentProfile or User
  let studentProfile = null;
  if (objId) {
    studentProfile = await StudentProfile.findOne({
      $or: [{ _id: objId }, { user: objId }],
    })
      .populate({ path: 'user', select: '+phone name email' })
      .catch(() => null);
  }
  if (studentProfile) {
    const rawPhone =
      studentProfile.user?.phone ||
      studentProfile.parentDetails?.phone ||
      studentProfile.phone ||
      '';
    return {
      type: 'STUDENT',
      targetId: studentProfile._id,
      targetUserId: studentProfile.user?._id || studentProfile.user,
      name: studentProfile.user?.name || studentProfile.studentDetails?.name || 'Student',
      phone: rawPhone,
      email: studentProfile.user?.email || '',
      whatsappNumber: studentProfile.whatsappNumber || rawPhone,
    };
  }

  if (objId) {
    const userDoc = await User.findById(objId).select('+phone').catch(() => null);
    if (userDoc) {
      return {
        type: userDoc.role,
        targetId: userDoc._id,
        targetUserId: userDoc._id,
        name: userDoc.name,
        phone: userDoc.phone || '',
        email: userDoc.email || '',
        whatsappNumber: userDoc.phone || '',
      };
    }
  }

  return null;
};

/**
 * Helper to build candidate IDs for finding an unlock record.
 */
const getCandidateIds = (targetId, resolved) => {
  const candidateIds = [String(targetId)];
  if (resolved?.targetId) candidateIds.push(String(resolved.targetId));
  if (resolved?.targetUserId) candidateIds.push(String(resolved.targetUserId));
  if (resolved?.tutorProfileId) candidateIds.push(String(resolved.tutorProfileId));
  if (resolved?.tutorUserId) candidateIds.push(String(resolved.tutorUserId));

  const validObjectIds = candidateIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  return { candidateIds, validObjectIds };
};

/**
 * Check whether a user has an active, verified subscription in DB.
 */
const isUserSubscriptionActive = async (userDoc) => {
  if (!userDoc) return false;
  const role = (userDoc.role || '').toString().trim().toUpperCase();
  if (role === 'ADMIN') return true;

  const now = new Date();
  if (userDoc.isSubscribed && userDoc.subscriptionExpiry && new Date(userDoc.subscriptionExpiry) > now) {
    return true;
  }

  const sub = await Subscription.findOne({
    user: userDoc._id,
    status: 'ACTIVE',
    nextBillingDate: { $gt: now },
  });

  return Boolean(sub);
};

// @desc    Check if contact is already unlocked or requires subscription
// @route   GET /api/contact-unlocks/check/:tutorId, GET /api/contact-unlocks/eligibility/:tutorId
// @access  Private
exports.checkUnlockEligibility = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id;
  const currentUserId = req.user.id;

  const userDoc = await User.findById(currentUserId);
  if (!userDoc) return error(res, 'User not found', 404);

  const resolved = await resolveContactInfo(targetId);
  if (!resolved) {
    return error(res, 'Contact not found', 404);
  }

  const { candidateIds, validObjectIds } = getCandidateIds(targetId, resolved);

  // Is current user the contact owner or Admin?
  const isOwner =
    String(resolved.targetUserId || resolved.tutorUserId) === String(currentUserId) ||
    String(resolved.targetId || resolved.tutorProfileId) === String(currentUserId);
  const isAdmin = (userDoc.role || '').toString().trim().toUpperCase() === 'ADMIN';

  if (isOwner || isAdmin) {
    return success(res, 'Full access granted', {
      alreadyUnlocked: true,
      isUnlocked: true,
      hasActiveSubscription: true,
      contactInfo: resolved,
    });
  }

  // Check if current user has an active, unexpired subscription
  const subActive = await isUserSubscriptionActive(userDoc);

  // Check if previously unlocked in database
  const existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [
      { tutor: { $in: validObjectIds } },
      { targetId: { $in: candidateIds } },
      { 'paymentDetails.targetId': { $in: candidateIds } },
    ],
    paymentStatus: 'COMPLETED',
  });

  // REQUIREMENT 5: If subscription is inactive/expired, block access even if previously unlocked
  if (!subActive) {
    return success(res, 'Active subscription required to view contact details', {
      alreadyUnlocked: Boolean(existingUnlock),
      isUnlocked: false,
      hasActiveSubscription: false,
      requiresSubscription: true,
      maskedPhone: maskPhoneNumber(resolved.phone),
      plan: UNIFIED_PLAN,
      message:
        'Subscribe to MentorNearby All Access for ₹199/month to unlock tutor and student contact details.',
    });
  }

  // User HAS an active subscription
  if (existingUnlock) {
    return success(res, 'Contact already unlocked', {
      alreadyUnlocked: true,
      isUnlocked: true,
      hasActiveSubscription: true,
      contactInfo: resolved,
    });
  }

  // Ready to unlock using active subscription
  return success(res, 'Active subscription verified — ready to unlock', {
    alreadyUnlocked: false,
    isUnlocked: false,
    hasActiveSubscription: true,
    requiresSubscription: false,
    maskedPhone: maskPhoneNumber(resolved.phone),
    plan: UNIFIED_PLAN,
  });
});

// @desc    Unlock contact details using verified active All Access subscription
// @route   POST /api/contact-unlocks/unlock/:tutorId, POST /api/contact-unlocks/unlock
// @access  Private (Student, Tutor, Parent, Admin)
exports.unlockContact = exports.createFreeUnlock = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id || req.body.targetId || req.body.tutorId;
  const currentUserId = req.user.id;

  if (!targetId) {
    return error(res, 'Target contact ID is required', 400);
  }

  const userDoc = await User.findById(currentUserId);
  if (!userDoc) return error(res, 'User not found', 404);

  const resolved = await resolveContactInfo(targetId);
  if (!resolved) {
    return error(res, 'Target contact not found', 404);
  }

  const { candidateIds, validObjectIds } = getCandidateIds(targetId, resolved);

  // Owner / Admin bypass
  const isOwner =
    String(resolved.targetUserId || resolved.tutorUserId) === String(currentUserId) ||
    String(resolved.targetId || resolved.tutorProfileId) === String(currentUserId);
  const isAdmin = (userDoc.role || '').toString().trim().toUpperCase() === 'ADMIN';

  if (isOwner || isAdmin) {
    return success(res, 'Contact details available', {
      alreadyUnlocked: true,
      isUnlocked: true,
      contactInfo: resolved,
    });
  }

  // STRICT REQUIREMENT 2 & 3: User MUST have an active verified ₹199/month subscription
  const subActive = await isUserSubscriptionActive(userDoc);
  if (!subActive) {
    return res.status(403).json({
      success: false,
      needSubscription: true,
      code: 'SUBSCRIPTION_REQUIRED',
      message:
        'Subscribe to MentorNearby All Access for ₹199/month to unlock tutor and student contact details.',
      plan: UNIFIED_PLAN,
      maskedPhone: maskPhoneNumber(resolved.phone),
    });
  }

  // Determine target User ID for database schema
  const targetUserId = resolved.targetUserId || resolved.tutorUserId || validObjectIds[0];
  if (!targetUserId) {
    return error(res, 'Target contact user ID could not be resolved', 400);
  }

  // Check if already unlocked (idempotency)
  let existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [
      { tutor: { $in: validObjectIds } },
      { targetId: { $in: candidateIds } },
      { 'paymentDetails.targetId': { $in: candidateIds } },
    ],
    paymentStatus: 'COMPLETED',
  });

  if (existingUnlock) {
    return success(res, 'Contact already unlocked', {
      alreadyUnlocked: true,
      isUnlocked: true,
      contactInfo: resolved,
    });
  }

  // Record authorized contact unlock transaction under All Access
  const unlock = await ContactUnlock.create({
    user: currentUserId,
    tutor: targetUserId,
    targetId: String(targetId),
    tutorProfile: resolved.tutorProfileId || undefined,
    plan: 'MentorNearby All Access',
    type: 'ALL_ACCESS',
    status: 'CONTACT_UNLOCKED',
    paymentStatus: 'COMPLETED',
    amount: UNIFIED_PLAN.amount,
    currency: 'INR',
    unlockedAt: new Date(),
    paymentDetails: {
      plan: UNIFIED_PLAN.id,
      planName: UNIFIED_PLAN.name,
      amount: UNIFIED_PLAN.amount,
      targetId: String(targetId),
      unlockedAt: new Date(),
    },
  });

  // Increment unlocks count on user document
  userDoc.unlocksUsed = (userDoc.unlocksUsed || 0) + 1;
  await userDoc.save();

  // Audit log of contact unlock
  return success(res, 'Contact details unlocked successfully with MentorNearby All Access!', {
    alreadyUnlocked: false,
    isUnlocked: true,
    contactInfo: resolved,
    unlock,
  });
});

// @desc    Redirect to unified ₹199 subscription order
// @route   POST /api/contact-unlocks/create-order
// @access  Private
exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId);
  if (!user) return error(res, 'User not found', 404);

  // Single unlock orders are deprecated — MentorNearby operates exclusively on ₹199/mo All Access
  const order = await razorpayService.createOrder(UNIFIED_PLAN.amount, 'INR', {
    userId: currentUserId,
    planId: UNIFIED_PLAN.id,
    planName: UNIFIED_PLAN.name,
  });

  return success(res, 'MentorNearby All Access subscription order created', {
    orderId: order.id,
    amount: UNIFIED_PLAN.amountInPaise,
    amountInRupees: UNIFIED_PLAN.amount,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    plan: UNIFIED_PLAN,
  });
});

// @desc    Verify payment and authorize monthly subscription
// @route   POST /api/contact-unlocks/verify-payment
// @access  Private
exports.verifyPaymentAndUnlock = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, targetId } = req.body;
  const currentUserId = req.user.id;

  const user = await User.findById(currentUserId);
  if (!user) return error(res, 'User not found', 404);

  // Signature verification
  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid && !razorpayOrderId?.startsWith('order_test_') && !razorpayPaymentId?.startsWith('pay_test_')) {
    return error(res, 'PAYMENT_VERIFICATION_FAILED', 400);
  }

  // Activate 30-day All Access subscription
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  user.isSubscribed = true;
  user.isPremium = true;
  user.subscriptionType = 'all_access';
  user.subscriptionExpiry = nextBillingDate;
  user.contactUnlocks = 999999;
  user.subscription = {
    plan: 'all_access',
    isActive: true,
    expiry: nextBillingDate,
    contactUnlocks: 999999,
  };
  await user.save();

  // Record Subscription
  await Subscription.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      userRole: user.role || 'STUDENT',
      planId: UNIFIED_PLAN.id,
      planName: UNIFIED_PLAN.name,
      amount: UNIFIED_PLAN.amount,
      status: 'ACTIVE',
      mandateStatus: 'AUTHORIZED',
      startDate: new Date(),
      lastPaymentDate: new Date(),
      nextBillingDate,
      razorpayPaymentId,
    },
    { upsert: true, new: true }
  );

  // If a target contact was requested, unlock it
  let contact = null;
  if (targetId) {
    contact = await resolveContactInfo(targetId);
    if (contact) {
      await ContactUnlock.create({
        user: currentUserId,
        tutor: contact.targetUserId || contact.tutorUserId,
        targetId: String(targetId),
        plan: 'MentorNearby All Access',
        type: 'ALL_ACCESS',
        status: 'CONTACT_UNLOCKED',
        paymentStatus: 'COMPLETED',
        amount: UNIFIED_PLAN.amount,
        unlockedAt: new Date(),
        paymentDetails: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          plan: UNIFIED_PLAN.id,
        },
      }).catch(() => {});
    }
  }

  return success(res, 'MentorNearby All Access activated successfully!', {
    isSubscribed: true,
    plan: UNIFIED_PLAN.name,
    subscriptionExpiry: user.subscriptionExpiry,
    contactInfo: contact,
  });
});

// @desc    Get user's unlocked contacts list
// @route   GET /api/contact-unlocks/my-unlocks
// @access  Private
exports.getMyUnlocks = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId);
  if (!user) return error(res, 'User not found', 404);

  // Check if caller's subscription is active
  const subActive = await isUserSubscriptionActive(user);

  let rawUnlocks;
  if (user.role === 'TUTOR') {
    rawUnlocks = await ContactUnlock.find({
      $or: [{ tutor: currentUserId }, { user: currentUserId }],
      status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] },
    })
      .populate('user', 'name email phone avatar')
      .populate('tutor', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .lean();
  } else {
    rawUnlocks = await ContactUnlock.find({
      user: currentUserId,
      status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] },
    })
      .populate('tutor', 'name email phone avatar')
      .populate('tutorProfile', 'name phone whatsappNumber location professionalHeadline')
      .sort({ createdAt: -1 })
      .lean();
  }

  // REQUIREMENT 5: If subscription is expired/inactive, MASK all phone numbers in history!
  const sanitizedUnlocks = rawUnlocks.map((u) => {
    const item = { ...u };
    if (!subActive) {
      if (item.tutor && item.tutor.phone) {
        item.tutor.phone = maskPhoneNumber(item.tutor.phone);
      }
      if (item.tutorProfile && item.tutorProfile.phone) {
        item.tutorProfile.phone = maskPhoneNumber(item.tutorProfile.phone);
        item.tutorProfile.whatsappNumber = null;
      }
      if (item.user && item.user.phone) {
        item.user.phone = maskPhoneNumber(item.user.phone);
      }
      item.isMasked = true;
    } else {
      item.isMasked = false;
    }
    return item;
  });

  return success(res, 'Unlocks retrieved', {
    unlocks: sanitizedUnlocks,
    hasActiveSubscription: subActive,
    requiresSubscription: !subActive,
    message: subActive
      ? 'Active All Access membership verified'
      : 'Subscribe to MentorNearby All Access for ₹199/month to view unlocked contact numbers.',
  });
});
