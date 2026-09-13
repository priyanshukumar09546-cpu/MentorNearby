const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ContactUnlock = require('../models/ContactUnlock');
const AdminConfig = require('../models/AdminConfig');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const razorpayService = require('../services/razorpayService');
const emailService = require('../services/emailService');
const { createNotification } = require('./notificationController');

// Helper to resolve contact information for Tutor, Student, or Tuition Requirement
const mongoose = require('mongoose');

const resolveContactInfo = async (targetId) => {
  if (!targetId) return null;
  const isValidObjId = mongoose.Types.ObjectId.isValid(targetId);
  const objId = isValidObjId ? new mongoose.Types.ObjectId(targetId) : null;

  // 1. Try TutorProfile
  let tutorProfile = null;
  if (objId) {
    tutorProfile = await TutorProfile.findOne({
      $or: [{ _id: objId }, { user: objId }]
    }).populate({ path: 'user', select: '+phone name email' });
  } else if (typeof targetId === 'string' && targetId.trim()) {
    tutorProfile = await TutorProfile.findOne({
      slug: new RegExp(`^${targetId.trim()}$`, 'i')
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
      whatsappNumber: rawWhatsApp
    };
  }

  // 2. Try TuitionRequirement
  const TuitionRequirement = require('../models/TuitionRequirement');
  let reqDoc = null;
  if (objId) {
    reqDoc = await TuitionRequirement.findById(objId).populate({ path: 'student', select: '+phone name email avatar' }).catch(() => null);
  }
  if (reqDoc) {
    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ user: reqDoc.student?._id || reqDoc.student }).select('+phone +parentDetails.phone').catch(() => null);
    const rawPhone = reqDoc.student?.phone || studentProfile?.parentDetails?.phone || studentProfile?.phone || reqDoc.phone || '';
    const studentName = reqDoc.studentName || reqDoc.student?.name || studentProfile?.studentDetails?.name || 'Student Lead';
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
      city: reqDoc.location?.city || ''
    };
  }

  // 3. Try StudentProfile or User
  const StudentProfile = require('../models/StudentProfile');
  let studentProfile = null;
  if (objId) {
    studentProfile = await StudentProfile.findOne({
      $or: [{ _id: objId }, { user: objId }]
    }).populate({ path: 'user', select: '+phone name email' }).catch(() => null);
  }
  if (studentProfile) {
    const rawPhone = studentProfile.user?.phone || studentProfile.parentDetails?.phone || studentProfile.phone || '';
    return {
      type: 'STUDENT',
      targetId: studentProfile._id,
      targetUserId: studentProfile.user?._id || studentProfile.user,
      name: studentProfile.user?.name || studentProfile.studentDetails?.name || 'Student',
      phone: rawPhone,
      email: studentProfile.user?.email || '',
      whatsappNumber: studentProfile.whatsappNumber || rawPhone
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
        whatsappNumber: userDoc.phone || ''
      };
    }
  }

  return null;
};

exports.checkUnlockEligibility = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id;
  const currentUserId = req.user.id;
  const isAdmin = (req.user.role || '').toString().trim().toUpperCase() === 'ADMIN';

  const userDoc = await User.findById(currentUserId);
  if (!userDoc) return error(res, 'User not found', 404);

  const isExpired = userDoc.subscriptionExpiry && new Date(userDoc.subscriptionExpiry) < new Date();
  const isPro = userDoc.subscriptionType === 'pro' && !isExpired;
  const availableCredits = userDoc.contactUnlocks || 0;

  // 1. Check if already unlocked in database
  const resolved = await resolveContactInfo(targetId);
  const candidateIds = [String(targetId)];
  if (resolved?.targetId) candidateIds.push(String(resolved.targetId));
  if (resolved?.targetUserId) candidateIds.push(String(resolved.targetUserId));
  if (resolved?.tutorProfileId) candidateIds.push(String(resolved.tutorProfileId));
  if (resolved?.tutorUserId) candidateIds.push(String(resolved.tutorUserId));

  const validObjectIds = candidateIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [
      { tutor: { $in: validObjectIds } },
      { targetId: { $in: candidateIds } },
      { 'paymentDetails.targetId': { $in: candidateIds } }
    ],
    paymentStatus: 'COMPLETED'
  });

  if (existingUnlock) {
    return success(res, 'Already unlocked', {
      alreadyUnlocked: true,
      isUnlocked: true,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      availableCredits,
    });
  }

  // 2. Admin or Pro has instant unlimited access
  if (isAdmin || isPro) {
    return success(res, 'Instant unlimited contact access', {
      alreadyUnlocked: true,
      isUnlocked: true,
      isUnlimited: true,
      isAdmin,
      isPro,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      availableCredits: 999999,
    });
  }

  // 3. User has available unlock credits
  if (availableCredits > 0) {
    return success(res, 'Credits available to unlock', {
      alreadyUnlocked: false,
      isUnlocked: false,
      hasCredits: true,
      requiresSubscription: false,
      availableCredits,
    });
  }

  // 4. Testing configuration: ₹99 plan is currently FREE
  return success(res, 'Unlock requires plan activation', {
    alreadyUnlocked: false,
    isUnlocked: false,
    hasCredits: false,
    requiresSubscription: true,
    availableCredits: 0,
    testingConfig: {
      singlePlanFree: true,
      planName: '₹99 Contact Unlock',
      price: 0,
      originalPrice: 99,
      currency: 'INR'
    }
  });
});

exports.createFreeUnlock = exports.unlockContact = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id || req.body.targetId || req.body.tutorId;
  const currentUserId = req.user.id;
  const isAdmin = (req.user.role || '').toString().trim().toUpperCase() === 'ADMIN';

  if (!targetId) {
    return error(res, 'Target contact ID is required', 400);
  }

  const userDoc = await User.findById(currentUserId);
  if (!userDoc) return error(res, 'User not found', 404);

  const isExpired = userDoc.subscriptionExpiry && new Date(userDoc.subscriptionExpiry) < new Date();
  const isPro = userDoc.subscriptionType === 'pro' && !isExpired;

  const resolved = await resolveContactInfo(targetId);
  const candidateIds = [String(targetId)];
  if (resolved?.targetId) candidateIds.push(String(resolved.targetId));
  if (resolved?.targetUserId) candidateIds.push(String(resolved.targetUserId));
  if (resolved?.tutorProfileId) candidateIds.push(String(resolved.tutorProfileId));
  if (resolved?.tutorUserId) candidateIds.push(String(resolved.tutorUserId));

  const validObjectIds = candidateIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  // 1. Check if already unlocked (idempotency - prevent multiple unlocks / credit deduction)
  const existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [
      { tutor: { $in: validObjectIds } },
      { targetId: { $in: candidateIds } },
      { 'paymentDetails.targetId': { $in: candidateIds } }
    ],
    paymentStatus: 'COMPLETED'
  });

  if (existingUnlock) {
    return success(res, 'Contact already unlocked', {
      alreadyUnlocked: true,
      isUnlocked: true,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      remainingCredits: userDoc.contactUnlocks || 0,
    });
  }

  // Determine target User ID for schema
  const targetUserId = resolved?.targetUserId || resolved?.tutorUserId || validObjectIds[0];

  // 2. Admin or Pro (unlimited)
  if (isAdmin || isPro) {
    const unlock = await ContactUnlock.create({
      user: currentUserId,
      tutor: targetUserId,
      targetId: String(targetId),
      plan: 'pro_unlimited',
      type: 'PRO_UNLIMITED',
      status: 'CONTACT_UNLOCKED',
      paymentStatus: 'COMPLETED',
      amount: 0,
      unlockedAt: new Date(),
      paymentDetails: { amount: 0, plan: 'pro', targetId: String(targetId) },
    });

    return success(res, 'Contact unlocked with Pro membership', {
      alreadyUnlocked: false,
      isUnlocked: true,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      remainingCredits: 999999,
      unlock
    });
  }

  // 3. User has at least 1 credit (Single ₹99 or Starter ₹199)
  if ((userDoc.contactUnlocks || 0) > 0) {
    userDoc.contactUnlocks = Math.max(0, userDoc.contactUnlocks - 1);
    userDoc.unlocksUsed = (userDoc.unlocksUsed || 0) + 1;
    await userDoc.save();

    const unlock = await ContactUnlock.create({
      user: currentUserId,
      tutor: targetUserId,
      targetId: String(targetId),
      plan: userDoc.subscriptionType || 'credit',
      type: 'CREDIT',
      status: 'CONTACT_UNLOCKED',
      paymentStatus: 'COMPLETED',
      amount: 0,
      unlockedAt: new Date(),
      paymentDetails: { amount: 0, plan: userDoc.subscriptionType || 'single', targetId: String(targetId) },
    });

    return success(res, 'Contact unlocked successfully! 1 credit used.', {
      alreadyUnlocked: false,
      isUnlocked: true,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      remainingCredits: userDoc.contactUnlocks,
      unlock
    });
  }

  // 4. CURRENT TESTING CONFIGURATION: The ₹99 plan has been made FREE for testing
  // Allows teachers to unlock without Razorpay charges in testing configuration
  const requestedPlan = req.body.plan || req.body.planId || 'single_99';
  const isTestingFreeAllowed = true; // Testing configuration active

  if (isTestingFreeAllowed) {
    userDoc.unlocksUsed = (userDoc.unlocksUsed || 0) + 1;
    await userDoc.save();

    const unlock = await ContactUnlock.create({
      user: currentUserId,
      tutor: targetUserId,
      targetId: String(targetId),
      plan: '₹99 Contact Unlock (Testing Configuration - Free)',
      type: 'FREE',
      status: 'CONTACT_UNLOCKED',
      paymentStatus: 'COMPLETED',
      amount: 0,
      currency: 'INR',
      unlockedAt: new Date(),
      paymentDetails: {
        amount: 0,
        plan: requestedPlan,
        targetId: String(targetId),
        isTestConfiguration: true,
        activatedAt: new Date()
      },
    });

    return success(res, 'Contact unlocked successfully under testing configuration!', {
      alreadyUnlocked: false,
      isUnlocked: true,
      contactInfo: resolved || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' },
      remainingCredits: userDoc.contactUnlocks || 0,
      unlock
    });
  }

  // 5. Fallback if subscription required
  return res.status(403).json({
    success: false,
    needSubscription: true,
    code: 'SUBSCRIPTION_REQUIRED',
    message: 'Active MentorNearby subscription or unlock credit required to view contact details.',
  });
});

exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
  const targetId = req.body.tutorId || req.body.targetId;
  const currentUserId = req.user.id;

  const existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [{ tutor: targetId }, { 'paymentDetails.targetId': targetId }],
    paymentStatus: 'COMPLETED'
  });

  if (existingUnlock) {
    return error(res, 'Contact already unlocked', 400);
  }

  const contact = await resolveContactInfo(targetId);
  const isStudentLead = contact?.type === 'STUDENT' || contact?.type === 'STUDENT_REQUIREMENT';
  const price = isStudentLead ? 49 : 99;

  const previousUnlocksCount = await ContactUnlock.countDocuments({
    user: currentUserId,
    paymentStatus: 'COMPLETED'
  });

  const nextUnlockNumber = previousUnlocksCount + 1;

  const order = await razorpayService.createOrder(price, 'INR', { userId: currentUserId, targetId });

  await ContactUnlock.create({
    user: currentUserId,
    tutor: targetId,
    type: 'PAID',
    status: 'REQUESTED',
    paymentStatus: 'PENDING',
    paymentDetails: {
      orderId: order.id,
      amount: price,
      currency: 'INR',
      targetId
    }
  });

  return success(res, 'Payment order created', {
    orderId: order.id,
    amount: price,
    currency: 'INR',
    unlockNumber: nextUnlockNumber,
    keyId: process.env.RAZORPAY_KEY_ID
  });
});

exports.verifyPaymentAndUnlock = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    return error(res, 'PAYMENT_VERIFICATION_FAILED', 400);
  }

  const unlockRecord = await ContactUnlock.findOne({ 'paymentDetails.orderId': razorpayOrderId });
  if (!unlockRecord) {
    return error(res, 'Unlock record not found', 404);
  }
  
  if (unlockRecord.paymentStatus === 'COMPLETED') {
    const contact = await resolveContactInfo(unlockRecord.tutor || unlockRecord.paymentDetails?.targetId);
    return success(res, 'Contact already unlocked', { contactInfo: contact });
  }

  unlockRecord.status = 'CONTACT_UNLOCKED';
  unlockRecord.paymentStatus = 'COMPLETED';
  unlockRecord.paymentDetails.paymentId = razorpayPaymentId;
  await unlockRecord.save();

  const user = await User.findById(unlockRecord.user);
  if (user) {
    user.unlocksUsed = (user.unlocksUsed || 0) + 1;
    await user.save();
  }

  const targetId = unlockRecord.tutor || unlockRecord.paymentDetails?.targetId;
  const contact = await resolveContactInfo(targetId);

  return success(res, 'Payment verified and contact unlocked', {
    contactInfo: contact || { phone: 'N/A', email: 'N/A', whatsappNumber: 'N/A' }
  });
});

exports.getMyUnlocks = asyncHandler(async (req, res, next) => {
  let unlocks;
  
  if (req.user.role === 'TUTOR') {
    unlocks = await ContactUnlock.find({ tutor: req.user.id, status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] } })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
      
    // Fetch student profiles for these unlocks
    const StudentProfile = require('../models/StudentProfile');
    unlocks = await Promise.all(unlocks.map(async (unlock) => {
      const unlockObj = unlock.toObject();
      if (unlock.user) {
        unlockObj.studentProfile = await StudentProfile.findOne({ user: unlock.user._id }).select('+location.address');
      }
      return unlockObj;
    }));
    
  } else {
    unlocks = await ContactUnlock.find({ user: req.user.id, status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] } })
      .populate('tutor', 'name email phone')
      .sort({ createdAt: -1 });
  }
  
  return success(res, 'Unlocks retrieved', { unlocks });
});
