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
const resolveContactInfo = async (targetId) => {
  // 1. Try TutorProfile
  const tutorProfile = await TutorProfile.findOne({
    $or: [{ _id: targetId }, { user: targetId }]
  }).populate('user', 'name email phone');
  if (tutorProfile) {
    return {
      type: 'TUTOR',
      name: tutorProfile.user?.name || tutorProfile.name || 'Tutor',
      phone: tutorProfile.phone || tutorProfile.user?.phone || 'N/A',
      email: tutorProfile.user?.email || 'N/A',
      whatsappNumber: tutorProfile.whatsappNumber || tutorProfile.phone || tutorProfile.user?.phone || 'N/A'
    };
  }

  // 2. Try TuitionRequirement
  const TuitionRequirement = require('../models/TuitionRequirement');
  const reqDoc = await TuitionRequirement.findById(targetId).populate('student', 'name email phone');
  if (reqDoc) {
    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ user: reqDoc.student?._id || reqDoc.student });
    return {
      type: 'STUDENT_REQUIREMENT',
      name: reqDoc.studentName || reqDoc.student?.name || 'Student Lead',
      phone: reqDoc.student?.phone || studentProfile?.parentDetails?.phone || 'N/A',
      email: reqDoc.student?.email || 'N/A',
      whatsappNumber: studentProfile?.whatsappNumber || reqDoc.student?.phone || 'N/A'
    };
  }

  // 3. Try StudentProfile or User
  const StudentProfile = require('../models/StudentProfile');
  const studentProfile = await StudentProfile.findOne({
    $or: [{ _id: targetId }, { user: targetId }]
  }).populate('user', 'name email phone');
  if (studentProfile) {
    return {
      type: 'STUDENT',
      name: studentProfile.user?.name || studentProfile.studentDetails?.name || 'Student',
      phone: studentProfile.user?.phone || studentProfile.parentDetails?.phone || 'N/A',
      email: studentProfile.user?.email || 'N/A',
      whatsappNumber: studentProfile.whatsappNumber || studentProfile.user?.phone || 'N/A'
    };
  }

  const userDoc = await User.findById(targetId);
  if (userDoc) {
    return {
      type: userDoc.role,
      name: userDoc.name,
      phone: userDoc.phone || 'N/A',
      email: userDoc.email || 'N/A',
      whatsappNumber: userDoc.phone || 'N/A'
    };
  }

  return null;
};

exports.checkUnlockEligibility = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id;
  const currentUserId = req.user.id;
  const userDoc = await User.findById(currentUserId);
  const isSubscribed = Boolean(
    userDoc?.isSubscribed &&
    userDoc?.subscriptionExpiry &&
    new Date(userDoc.subscriptionExpiry) > new Date()
  );

  // Admin or Subscribed user has instant, free universal access to any tutor/student contact
  if (isAdmin || isSubscribed) {
    const contact = await resolveContactInfo(targetId);
    return success(res, 'Instant contact access for subscribed user', {
      alreadyUnlocked: true,
      isSubscribed: true,
      isAdmin,
      contactInfo: contact || {
        phone: 'N/A',
        email: 'N/A',
        whatsappNumber: 'N/A'
      }
    });
  }

  const existingUnlock = await ContactUnlock.findOne({
    user: currentUserId,
    $or: [{ tutor: targetId }, { 'paymentDetails.targetId': targetId }],
    paymentStatus: 'COMPLETED'
  });

  if (existingUnlock) {
    const contact = await resolveContactInfo(targetId);
    return success(res, 'Already unlocked', {
      alreadyUnlocked: true,
      contactInfo: contact || {
        phone: 'N/A',
        email: 'N/A',
        whatsappNumber: 'N/A'
      }
    });
  }

  return success(res, 'Unlock eligibility - requires subscription', {
    alreadyUnlocked: false,
    requiresSubscription: true,
    isSubscribed: false,
    price: 99,
    unlockNumber: 1,
    freeRemaining: 0
  });
});

exports.createFreeUnlock = asyncHandler(async (req, res, next) => {
  const targetId = req.params.tutorId || req.params.id;
  const currentUserId = req.user.id;
  const isAdmin = (req.user.role || '').toString().trim().toUpperCase() === 'ADMIN';

  const userDoc = await User.findById(currentUserId);
  const isSubscribed = Boolean(
    userDoc?.isSubscribed &&
    userDoc?.subscriptionExpiry &&
    new Date(userDoc.subscriptionExpiry) > new Date()
  );

  if (isAdmin || isSubscribed) {
    const contact = await resolveContactInfo(targetId);
    return success(res, 'Unlocked contact successfully', {
      contactInfo: contact || {
        phone: 'N/A',
        email: 'N/A',
        whatsappNumber: 'N/A'
      }
    });
  }

  return error(res, 'Active MentorNearby subscription required to unlock direct contact details.', 402);
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
