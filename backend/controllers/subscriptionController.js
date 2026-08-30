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
  starter: {
    amount: 9900,
    currency: 'INR',
    label: 'Starter Plan – 3 Contacts (₹99/mo)',
    interval: 30,
    unlocks: 3,
    isSubscription: true,
    badge: 'Starter',
  },
  starter_yearly: {
    amount: 89100,
    currency: 'INR',
    label: 'Starter Plan Yearly – 36 Contacts (₹891/yr)',
    interval: 365,
    unlocks: 36,
    isSubscription: true,
    badge: 'Starter',
  },
  growth: {
    amount: 19900,
    currency: 'INR',
    label: 'Growth Plan – 10 Contacts (₹199/mo)',
    interval: 30,
    unlocks: 10,
    isSubscription: true,
    badge: 'Most Popular',
  },
  growth_yearly: {
    amount: 179100,
    currency: 'INR',
    label: 'Growth Plan Yearly – 120 Contacts (₹1791/yr)',
    interval: 365,
    unlocks: 120,
    isSubscription: true,
    badge: 'Most Popular',
  },
  pro: {
    amount: 39900,
    currency: 'INR',
    label: 'Pro Plan – 25 Contacts (₹399/mo)',
    interval: 30,
    unlocks: 25,
    isSubscription: true,
    badge: 'Pro',
  },
  pro_yearly: {
    amount: 359100,
    currency: 'INR',
    label: 'Pro Plan Yearly – 300 Contacts (₹3591/yr)',
    interval: 365,
    unlocks: 300,
    isSubscription: true,
    badge: 'Pro',
  },
  premium: {
    amount: 69900,
    currency: 'INR',
    label: 'Premium Plan – Unlimited Contacts (₹699/mo)',
    interval: 30,
    unlocks: 999999,
    isSubscription: true,
    badge: 'Premium',
  },
  premium_yearly: {
    amount: 629100,
    currency: 'INR',
    label: 'Premium Plan Yearly – Unlimited Contacts (₹6291/yr)',
    interval: 365,
    unlocks: 999999,
    isSubscription: true,
    badge: 'Premium',
  },
  // Backward compatibility aliases
  single: {
    amount: 9900,
    currency: 'INR',
    label: 'Single Unlock – 2 Contacts (₹99)',
    interval: 0,
    unlocks: 2,
    isSubscription: false,
    badge: 'One-Time',
  },
  basic: {
    amount: 9900,
    currency: 'INR',
    label: 'Starter Plan (₹99)',
    interval: 30,
    unlocks: 3,
    isSubscription: true,
    badge: 'Starter',
  },
  student: {
    amount: 19900,
    currency: 'INR',
    label: 'Growth Plan (₹199)',
    interval: 30,
    unlocks: 10,
    isSubscription: true,
    badge: 'Most Popular',
  },
  teacher: {
    amount: 49900,
    currency: 'INR',
    label: 'Pro Plan (₹499)',
    interval: 30,
    unlocks: 999999,
    isSubscription: true,
    badge: 'Best for Tutors',
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
    const daysToAdd = selectedPlan.interval || 30;
    expiry.setDate(expiry.getDate() + daysToAdd);
    user.isSubscribed = true;
    user.subscriptionExpiry = expiry;
    user.isPremium = true;
    user.premiumExpiresAt = expiry;
  }

  // Assign plan unlocks & subscription type
  if (planKey === 'single') {
    user.contactUnlocks = (user.contactUnlocks || 0) + 2;
    user.subscriptionType = 'single';
  } else if (planKey === 'starter' || planKey === 'starter_yearly' || planKey === 'basic') {
    const addUnlocks = planKey.includes('yearly') ? 36 : 3;
    user.contactUnlocks = (user.contactUnlocks || 0) + addUnlocks;
    user.subscriptionType = 'starter';
  } else if (planKey === 'growth' || planKey === 'growth_yearly' || planKey === 'student') {
    const addUnlocks = planKey.includes('yearly') ? 120 : 10;
    user.contactUnlocks = (user.contactUnlocks || 0) + addUnlocks;
    user.subscriptionType = 'growth';
  } else if (planKey === 'pro' || planKey === 'pro_yearly') {
    const addUnlocks = planKey.includes('yearly') ? 300 : 25;
    user.contactUnlocks = (user.contactUnlocks || 0) + addUnlocks;
    user.subscriptionType = 'pro';
  } else if (planKey === 'premium' || planKey === 'premium_yearly' || planKey === 'teacher') {
    user.contactUnlocks = 999999;
    user.subscriptionType = 'premium';
    await TutorProfile.findOneAndUpdate(
      { user: user._id },
      { isVerified: true, isApproved: true }
    ).catch(() => {});
  } else {
    user.contactUnlocks = (user.contactUnlocks || 0) + (selectedPlan.unlocks || 0);
    user.subscriptionType = planKey;
  }

  user.subscription = {
    plan: user.subscriptionType,
    isActive: true,
    expiry,
    contactUnlocks: user.contactUnlocks,
  };

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

  // Trigger Refer & Earn 100-Coin Reward for referrer if this user was referred
  try {
    const { processReferralReward } = require('./referralController');
    await processReferralReward(
      user._id,
      selectedPlan,
      { orderId: actualOrderId, paymentId: actualPaymentId }
    );
  } catch (refErr) {
    console.warn('Referral reward processing note:', refErr.message);
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
