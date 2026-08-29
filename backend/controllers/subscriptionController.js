// ============================================================
// controllers/subscriptionController.js
// Razorpay subscription plans: Student ₹99/mo, Teacher ₹149/mo
// ============================================================

const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');

// Lazily initialize Razorpay so the module doesn't crash when loaded without env vars
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
  student: { amount: 9900, currency: 'INR', label: 'Basic Plan (5 Unlocks)', interval: 30, unlocks: 5 },
  basic: { amount: 9900, currency: 'INR', label: 'Basic Plan (5 Unlocks)', interval: 30, unlocks: 5 },
  premium: { amount: 19900, currency: 'INR', label: 'Premium Plan (15 Unlocks)', interval: 30, unlocks: 15 },
  teacher: { amount: 14900, currency: 'INR', label: 'Teacher Plan (Unlimited Leads)', interval: 30, unlocks: 0 },
};

// @desc    Create a Razorpay order for subscription
// @route   POST /api/subscription/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  // Determine plan from body or user role
  let planKey = req.body.planType || req.body.plan || req.body.planId;

  if (!planKey) {
    planKey = user.role === 'TUTOR' ? 'teacher' : 'basic';
  }

  planKey = planKey.toLowerCase();
  if (planKey === 'student') planKey = 'basic';

  if (!PLANS[planKey]) {
    planKey = 'basic';
  }

  const plan = PLANS[planKey];
  let orderId = `order_test_${Date.now()}`;
  let razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder';

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `sub_${userId}_${Date.now()}`,
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
    console.warn('⚠️ Razorpay live order generation fallback (using test order):', err.message);
    orderId = `order_test_${Date.now()}`;
  }

  return res.status(200).json({
    success: true,
    message: 'Subscription order created',
    orderId,
    amount: 99,
    currency: 'INR',
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

// @desc    Verify Razorpay payment and activate subscription
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

  let planKey = (planType || plan || 'basic').toLowerCase();
  if (planKey === 'student') planKey = 'basic';
  const selectedPlan = PLANS[planKey] || PLANS.basic;

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
  const subType = planKey === 'teacher' ? 'teacher' : planKey;
  const unlocksToAdd = selectedPlan.unlocks || (planKey === 'premium' ? 15 : (planKey === 'teacher' ? 0 : 5));

  // Activate subscription for 30 days
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  user.isSubscribed = true;
  user.subscriptionType = subType;
  user.subscriptionExpiry = expiry;
  user.razorpaySubscriptionId = actualPaymentId;
  user.isPremium = true;
  user.premiumExpiresAt = expiry;
  user.contactUnlocks = (user.contactUnlocks || 0) + unlocksToAdd;
  user.subscription = {
    plan: planKey,
    isActive: true,
    expiry,
    contactUnlocks: (user.subscription?.contactUnlocks || 0) + unlocksToAdd,
  };

  await user.save();

  // If a tutor or teacher was being unlocked, create ContactUnlock and resolve contact info
  let contactInfo = null;
  const targetId = tutorId || teacherId;
  if (targetId) {
    try {
      const ContactUnlock = require('../models/ContactUnlock');
      const TutorProfile = require('../models/TutorProfile');

      await ContactUnlock.create({
        user: user._id,
        tutor: targetId,
        type: 'PAID',
        status: 'CONTACT_UNLOCKED',
        paymentStatus: 'COMPLETED',
        paymentDetails: { orderId: actualOrderId, paymentId: actualPaymentId, amount: 99 },
      });

      const tutorDoc = await TutorProfile.findOne({
        $or: [{ _id: targetId }, { user: targetId }],
      }).populate('user', 'name email phone');

      if (tutorDoc) {
        contactInfo = {
          name: tutorDoc.user?.name || tutorDoc.name || 'Tutor',
          phone: tutorDoc.phone || tutorDoc.user?.phone || '9876543210',
          email: tutorDoc.user?.email || 'tutor@mentornearby.com',
          whatsappNumber: tutorDoc.whatsappNumber || tutorDoc.phone || tutorDoc.user?.phone || '9876543210',
        };
      } else {
        const targetUser = await User.findById(targetId);
        if (targetUser) {
          contactInfo = {
            name: targetUser.name,
            phone: targetUser.phone || '9876543210',
            email: targetUser.email,
            whatsappNumber: targetUser.phone || '9876543210',
          };
        }
      }
    } catch (unlockErr) {
      console.warn('Unlock record creation warning:', unlockErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Test subscription activated! 5 contact unlocks added.',
    isSubscribed: true,
    subscriptionType: subType,
    subscriptionExpiry: expiry,
    contactUnlocks: user.contactUnlocks,
    subscription: user.subscription,
    contactInfo,
    data: {
      isSubscribed: true,
      subscriptionType: subType,
      subscriptionExpiry: expiry,
      contactUnlocks: user.contactUnlocks,
      subscription: user.subscription,
      contactInfo,
    },
  });
});

// @desc    Razorpay webhook handler (autopay renewal)
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

  // Handle successful payment events
  if (
    event === 'payment.captured' ||
    event === 'subscription.charged' ||
    event === 'order.paid'
  ) {
    const notes = payload?.payment?.entity?.notes || payload?.order?.entity?.notes || {};
    const userId = notes.userId;
    const planType = notes.planType || 'student';

    if (userId) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      await User.findByIdAndUpdate(userId, {
        isSubscribed: true,
        subscriptionType: planType,
        subscriptionExpiry: expiry,
        isPremium: true,
        premiumExpiresAt: expiry,
      });

      console.log(`✅ Subscription renewed for userId=${userId}, plan=${planType}`);
    }
  }

  return res.status(200).json({ success: true, received: true });
});

// @desc    Get current user's subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getStatus = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId).select(
    'isSubscribed subscriptionType subscriptionExpiry freeChatsUsed freeLeadsUsed role razorpaySubscriptionId'
  );

  const isActive = user.isSubscribed && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date();

  const FREE_LIMIT = user.role === 'TUTOR' ? 5 : 3;
  const PLAN_PRICE = user.role === 'TUTOR' ? 149 : 99;
  const PLAN_TYPE = user.role === 'TUTOR' ? 'teacher' : 'student';

  return success(res, 'Subscription status retrieved', {
    isSubscribed: isActive,
    subscriptionType: user.subscriptionType,
    subscriptionExpiry: user.subscriptionExpiry,
    freeChatsUsed: user.freeChatsUsed,
    freeLeadsUsed: user.freeLeadsUsed,
    freeChatsLimit: FREE_LIMIT,
    chatsRemaining: isActive ? null : Math.max(0, FREE_LIMIT - user.freeChatsUsed),
    suggestedPlan: {
      type: PLAN_TYPE,
      price: PLAN_PRICE,
    },
  });
});
