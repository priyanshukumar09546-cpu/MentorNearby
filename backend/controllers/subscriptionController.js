// ============================================================
// controllers/subscriptionController.js
// MentorNearby 4-Tier Subscription & Contact Unlock System
// Free ₹0 | Single Unlock ₹99 | Starter ₹199/mo | Pro ₹499/mo
// ============================================================

const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const ContactUnlock = require('../models/ContactUnlock');

// Lazily initialize Razorpay
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Plan pricing (in paise — INR × 100)
const PLANS = {
  free: {
    amount: 0,
    currency: 'INR',
    label: 'Free Plan',
    interval: 0,
    unlocks: 0,
    isSubscription: false,
    badge: null,
  },
  single: {
    amount: 9900,
    currency: 'INR',
    label: 'Single Unlock – 2 Contacts (₹99)',
    interval: 0,
    unlocks: 2,
    isSubscription: false,
    badge: 'One-Time',
  },
  starter: {
    amount: 19900,
    currency: 'INR',
    label: 'Starter Plan – 20 Contacts (₹199/mo)',
    interval: 30,
    unlocks: 20,
    isSubscription: true,
    badge: 'Most Popular for Students',
  },
  pro: {
    amount: 49900,
    currency: 'INR',
    label: 'Pro Plan – Unlimited Contacts (₹499/mo)',
    interval: 30,
    unlocks: 999999,
    isSubscription: true,
    badge: 'Best for Tutors',
  },
  // Backward compatibility aliases
  basic: {
    amount: 9900,
    currency: 'INR',
    label: 'Single Unlock – 2 Contacts (₹99)',
    interval: 0,
    unlocks: 2,
    isSubscription: false,
    badge: 'One-Time',
  },
  student: {
    amount: 19900,
    currency: 'INR',
    label: 'Starter Plan – 20 Contacts (₹199/mo)',
    interval: 30,
    unlocks: 20,
    isSubscription: true,
    badge: 'Most Popular for Students',
  },
  teacher: {
    amount: 49900,
    currency: 'INR',
    label: 'Pro Plan – Unlimited Contacts (₹499/mo)',
    interval: 30,
    unlocks: 999999,
    isSubscription: true,
    badge: 'Best for Tutors',
  },
  premium: {
    amount: 19900,
    currency: 'INR',
    label: 'Starter Plan – 20 Contacts (₹199/mo)',
    interval: 30,
    unlocks: 20,
    isSubscription: true,
    badge: 'Most Popular for Students',
  },
};

// @desc    Create a Razorpay order for subscription / unlock
// @route   POST /api/subscription/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  // Normalize plan key
  let planKey = (req.body.planType || req.body.plan || req.body.planId || 'single').toLowerCase();
  if (planKey === 'single_unlock' || planKey === 'single-unlock') planKey = 'single';
  if (!PLANS[planKey]) planKey = 'single';

  const plan = PLANS[planKey];

  if (plan.amount === 0) {
    return res.status(200).json({
      success: true,
      message: 'Free plan activated',
      planType: 'free',
      amount: 0,
    });
  }

  let orderId = `order_test_${Date.now()}`;
  let razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder';

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `mn_${planKey}_${userId}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: String(userId),
        planType: planKey,
        userEmail: user.email,
        userName: user.name,
      },
    });
    orderId = order.id;
    razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  } catch (err) {
    console.warn('⚠️ Razorpay live order fallback (using test order):', err.message);
    orderId = `order_test_${Date.now()}`;
  }

  return res.status(200).json({
    success: true,
    message: 'Subscription order created',
    orderId,
    amount: plan.amount,
    currency: plan.currency,
    key: razorpayKeyId,
    planType: planKey,
    planLabel: plan.label,
    isTestMode: orderId.startsWith('order_test_') || orderId.startsWith('order_sim_'),
    data: {
      orderId,
      amount: plan.amount,
      currency: plan.currency,
      planType: planKey,
      planLabel: plan.label,
      razorpayKeyId,
      userEmail: user.email,
      userName: user.name,
    },
  });
});

// @desc    Verify Razorpay payment and activate subscription / unlock credits
// @route   POST /api/subscription/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const {
    orderId,
    paymentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planType,
    plan,
    tutorId,
    teacherId,
  } = req.body;

  const actualOrderId = razorpay_order_id || orderId || `order_test_${Date.now()}`;
  const actualPaymentId = razorpay_payment_id || paymentId || `pay_test_${Date.now()}`;

  let planKey = (planType || plan || 'single').toLowerCase();
  if (planKey === 'single_unlock' || planKey === 'single-unlock') planKey = 'single';
  if (!PLANS[planKey]) planKey = 'single';

  const selectedPlan = PLANS[planKey];

  // Verify HMAC signature if keys exist and signature is provided (skip for test payments)
  if (
    process.env.RAZORPAY_KEY_SECRET &&
    razorpay_order_id &&
    razorpay_signature &&
    !actualOrderId.startsWith('order_test_') &&
    !actualPaymentId.startsWith('pay_test_')
  ) {
    try {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${actualOrderId}|${actualPaymentId}`)
        .digest('hex');

      if (expectedSig !== razorpay_signature) {
        return error(res, 'Payment verification failed — invalid signature', 400);
      }
    } catch (e) {
      console.warn('Signature check warning:', e.message);
    }
  }

  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  // Prevent duplicate payment credits
  if (user.razorpaySubscriptionId === actualPaymentId && !actualPaymentId.startsWith('pay_test_')) {
    return res.status(200).json({
      success: true,
      message: 'Payment already processed.',
      plan: user.subscriptionType,
      contactUnlocks: user.contactUnlocks,
      isSubscribed: user.isSubscribed,
    });
  }

  const isMonthlySubscription = selectedPlan.isSubscription;
  let expiry = null;

  if (isMonthlySubscription) {
    expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    user.isSubscribed = true;
    user.subscriptionExpiry = expiry;
    user.isPremium = true;
    user.premiumExpiresAt = expiry;
  }

  // 1. Single Unlock (₹99) -> EXACTLY 2 unlock credits
  if (planKey === 'single' || planKey === 'basic') {
    user.contactUnlocks = (user.contactUnlocks || 0) + 2;
    user.subscriptionType = 'single';
    user.subscription = {
      plan: 'single',
      isActive: true,
      expiry: user.subscriptionExpiry || null,
      contactUnlocks: user.contactUnlocks,
    };
  } else if (planKey === 'starter' || planKey === 'student' || planKey === 'premium') {
    // 2. Starter (₹199) -> 20 unlock credits + 30 days validity
    user.contactUnlocks = (user.contactUnlocks || 0) + 20;
    user.subscriptionType = 'starter';
    user.subscription = {
      plan: 'starter',
      isActive: true,
      expiry,
      contactUnlocks: user.contactUnlocks,
    };
  } else if (planKey === 'pro' || planKey === 'teacher') {
    // 3. Pro (₹499) -> Unlimited unlocks + Top Featured Listing + Verified
    user.contactUnlocks = 999999;
    user.subscriptionType = 'pro';
    user.subscription = {
      plan: 'pro',
      isActive: true,
      expiry,
      contactUnlocks: 999999,
    };

    // If user is a tutor, mark verified and profile completion
    await TutorProfile.findOneAndUpdate(
      { user: user._id },
      { isVerified: true, isApproved: true }
    ).catch(() => {});
  }

  user.razorpaySubscriptionId = actualPaymentId;
  await user.save();

  // If this purchase was triggered to unlock a specific tutor/student, unlock now
  let contactInfo = null;
  const targetId = tutorId || teacherId;
  if (targetId) {
    try {
      // Consume 1 credit if not pro
      if (user.subscriptionType !== 'pro' && user.contactUnlocks > 0) {
        user.contactUnlocks -= 1;
        await user.save();
      }

      await ContactUnlock.create({
        user: user._id,
        tutor: targetId,
        type: 'PAID',
        status: 'CONTACT_UNLOCKED',
        paymentStatus: 'COMPLETED',
        paymentDetails: { orderId: actualOrderId, paymentId: actualPaymentId, amount: selectedPlan.amount / 100 },
      });

      const tutorDoc = await TutorProfile.findOne({
        $or: [{ _id: targetId }, { user: targetId }],
      }).populate('user', 'name email phone');

      if (tutorDoc) {
        const realPhone = tutorDoc.phone || tutorDoc.user?.phone || '';
        contactInfo = {
          name: tutorDoc.user?.name || tutorDoc.name || 'Tutor',
          phone: realPhone,
          email: tutorDoc.user?.email || tutorDoc.email || '',
          whatsappNumber: tutorDoc.whatsappNumber || realPhone,
        };
      }
    } catch (unlockErr) {
      console.warn('Unlock record creation warning:', unlockErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: `${selectedPlan.label} activated successfully!`,
    planType: user.subscriptionType,
    isSubscribed: user.isSubscribed,
    subscriptionExpiry: user.subscriptionExpiry,
    contactUnlocks: user.contactUnlocks,
    contactInfo,
    data: {
      planType: user.subscriptionType,
      isSubscribed: user.isSubscribed,
      subscriptionExpiry: user.subscriptionExpiry,
      contactUnlocks: user.contactUnlocks,
      contactInfo,
    },
  });
});

// @desc    Razorpay webhook handler
// @route   POST /api/subscription/webhook
// @access  Public (validated by Razorpay-Signature header)
exports.webhook = asyncHandler(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  if (secret && signature) {
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expectedSig !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured' || event === 'subscription.charged' || event === 'order.paid') {
    const notes = payload?.payment?.entity?.notes || payload?.order?.entity?.notes || {};
    const userId = notes.userId;
    const planType = notes.planType || 'starter';

    if (userId) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const planUnlocks = planType === 'pro' ? 999999 : (planType === 'starter' ? 20 : 2);

      await User.findByIdAndUpdate(userId, {
        isSubscribed: true,
        subscriptionType: planType,
        subscriptionExpiry: expiry,
        isPremium: true,
        premiumExpiresAt: expiry,
        $inc: { contactUnlocks: planUnlocks },
      });

      console.log(`✅ Subscription processed for userId=${userId}, plan=${planType}`);
    }
  }

  return res.status(200).json({ success: true, received: true });
});

// @desc    Get current user's subscription status & unlock entitlement
// @route   GET /api/subscription/status
// @access  Private
exports.getStatus = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId).select(
    'isSubscribed subscriptionType subscriptionExpiry contactUnlocks freeChatsUsed freeLeadsUsed role razorpaySubscriptionId dailyViewsCount lastViewDate'
  );

  if (!user) return error(res, 'User not found', 404);

  const isExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date();
  let currentPlan = user.subscriptionType || 'free';
  if (isExpired && (currentPlan === 'starter' || currentPlan === 'pro')) {
    currentPlan = 'free';
  }

  const isPro = currentPlan === 'pro' && !isExpired;
  const isStarter = currentPlan === 'starter' && !isExpired;
  const isSingle = currentPlan === 'single';

  let remainingUnlocksFormatted = '0 Unlocks';
  if (isPro) {
    remainingUnlocksFormatted = 'Unlimited';
  } else if (isStarter) {
    remainingUnlocksFormatted = `${user.contactUnlocks || 0} / 20 Remaining`;
  } else if (isSingle || (user.contactUnlocks || 0) > 0) {
    remainingUnlocksFormatted = `${user.contactUnlocks || 0} Remaining`;
  }

  return success(res, 'Subscription status retrieved', {
    plan: currentPlan,
    subscriptionType: currentPlan,
    isSubscribed: isPro || isStarter || (user.contactUnlocks > 0),
    subscriptionExpiry: user.subscriptionExpiry,
    contactUnlocks: user.contactUnlocks || 0,
    remainingUnlocksFormatted,
    isPro,
    isStarter,
    isSingle,
    dailyViewsRemaining: Math.max(0, 3 - (user.dailyViewsCount || 0)),
  });
});
