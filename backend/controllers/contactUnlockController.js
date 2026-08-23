const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ContactUnlock = require('../models/ContactUnlock');
const AdminConfig = require('../models/AdminConfig');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const razorpayService = require('../services/razorpayService');
const emailService = require('../services/emailService');
const { createNotification } = require('./notificationController');

exports.checkUnlockEligibility = asyncHandler(async (req, res, next) => {
  const { tutorId } = req.params;
  const studentId = req.user.id;

  const existingUnlock = await ContactUnlock.findOne({
    user: studentId,
    tutor: tutorId,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] }
  });

  if (existingUnlock) {
    const tutorProfile = await TutorProfile.findOne({ user: tutorId }).populate('user', 'name email');
    return success(res, 'Already unlocked', {
      alreadyUnlocked: true,
      contactInfo: { phone: tutorProfile?.phone || 'N/A', email: tutorProfile?.user?.email }
    });
  }

  const previousUnlocksCount = await ContactUnlock.countDocuments({
    user: studentId,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] }
  });

  const nextUnlockNumber = previousUnlocksCount + 1;
  const price = 100;

  return success(res, 'Unlock eligibility', {
    alreadyUnlocked: false,
    isFree: false,
    price,
    unlockNumber: nextUnlockNumber,
    freeRemaining: 0
  });
});

exports.createFreeUnlock = asyncHandler(async (req, res, next) => {
  return error(res, 'Free contact unlocks are no longer available. All contact unlocks are ₹100.', 400);
});

exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
  const { tutorId } = req.body;
  const studentId = req.user.id;

  const existingUnlock = await ContactUnlock.findOne({ user: studentId, tutor: tutorId, status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] } });
  if (existingUnlock) {
    return error(res, 'Contact already unlocked', 400);
  }

  const previousUnlocksCount = await ContactUnlock.countDocuments({
    user: studentId,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] }
  });

  const nextUnlockNumber = previousUnlocksCount + 1;
  const price = 100;

  const order = await razorpayService.createOrder(price, 'INR', { userId: studentId, tutorId });

  await ContactUnlock.create({
    user: studentId,
    tutor: tutorId,
    type: 'PAID',
    status: 'REQUESTED',
    paymentStatus: 'PENDING',
    paymentDetails: {
      orderId: order.id,
      amount: price,
      currency: 'INR'
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
    return error(res, 'Contact already unlocked', 400);
  }

  unlockRecord.status = 'CONTACT_UNLOCKED';
  unlockRecord.paymentStatus = 'COMPLETED';
  unlockRecord.paymentDetails.paymentId = razorpayPaymentId;
  await unlockRecord.save();

  const user = await User.findById(unlockRecord.user);
  user.unlocksUsed += 1;
  await user.save();

  const tutorProfile = await TutorProfile.findOne({ user: unlockRecord.tutor }).populate('user', 'name email');

  await emailService.sendEmail({
    to: req.user.email,
    subject: 'Contact Unlocked (Paid)',
    text: `You have successfully unlocked contact details for ${tutorProfile.user.name}`
  });

  await createNotification(
    user._id,
    'Contact Unlocked (Paid)',
    `You have successfully unlocked contact details for ${tutorProfile.user.name}`,
    'CONTACT',
    `/chat/${unlockRecord.tutor}`
  );

  await createNotification(
    unlockRecord.tutor,
    'Contact Unlocked',
    `${user.name} has unlocked your contact details.`,
    'CONTACT',
    `/chat/${user._id}`
  );

  return success(res, 'Payment verified and contact unlocked', {
    contactInfo: { phone: tutorProfile.phone || 'N/A', email: tutorProfile.user.email }
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
