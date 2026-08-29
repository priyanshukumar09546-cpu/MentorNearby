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
  student: { amount: 9900, currency: 'INR', label: 'Student Plan', interval: 30 },
  teacher: { amount: 14900, currency: 'INR', label: 'Teacher Plan', interval: 30 },
};

// @desc    Create a Razorpay order for subscription
// @route   POST /api/subscription/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  // Determine plan from user role or explicit request
  const requestedPlan = req.body.planType; // 'student' | 'teacher'
  let planKey = requestedPlan;

  if (!planKey) {
    planKey = user.role === 'TUTOR' ? 'teacher' : 'student';
  }

  if (!PLANS[planKey]) {
    return error(res, 'Invalid plan type. Use "student" or "teacher".', 400);
  }

  const plan = PLANS[planKey];
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

  return success(res, 'Subscription order created', {
    orderId: order.id,
    amount: plan.amount,
    currency: plan.currency,
    planType: planKey,
    planLabel: plan.label,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    userEmail: user.email,
    userName: user.name,
  });
});

// @desc    Verify Razorpay payment and activate subscription
// @route   POST /api/subscription/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return error(res, 'Missing payment verification fields', 400);
  }

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return error(res, 'Payment verification failed — invalid signature', 400);
  }

  const userId = req.user._id || req.user.id;
  const subType = planType === 'teacher' ? 'teacher' : 'student';

  // Activate subscription for 30 days
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      isSubscribed: true,
      subscriptionType: subType,
      subscriptionExpiry: expiry,
      razorpaySubscriptionId: razorpay_payment_id,
      isPremium: true,
      premiumExpiresAt: expiry,
    },
    { new: true }
  ).select('name email isSubscribed subscriptionType subscriptionExpiry');

  return success(res, `Subscription activated! Welcome to MentorNearby ${subType === 'teacher' ? 'Teacher' : 'Student'} Plan.`, {
    isSubscribed: true,
    subscriptionType: subType,
    subscriptionExpiry: expiry,
    user: updatedUser,
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
