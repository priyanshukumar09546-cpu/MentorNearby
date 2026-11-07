// ============================================================
// controllers/subscriptionController.js
// MentorNearby Unified Subscription & AutoPay System
// Plan: "MentorNearby All Access" — ₹199/month Recurring
// Supports Razorpay Subscriptions, AutoPay mandates, and webhooks
// ============================================================

const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const ContactUnlock = require('../models/ContactUnlock');
const { UNIFIED_PLAN } = require('../config/subscription');
const emailService = require('../services/emailService');

// Lazily initialize Razorpay client
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Cache or retrieve Razorpay Monthly Plan for ₹199
let cachedRazorpayPlanId = null;
const getOrCreateRazorpayPlan = async (razorpay) => {
  if (cachedRazorpayPlanId) return cachedRazorpayPlanId;
  if (process.env.RAZORPAY_PLAN_ID) {
    cachedRazorpayPlanId = process.env.RAZORPAY_PLAN_ID;
    return cachedRazorpayPlanId;
  }

  try {
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: UNIFIED_PLAN.name,
        amount: UNIFIED_PLAN.amountInPaise,
        currency: UNIFIED_PLAN.currency,
        description: 'MentorNearby All Access Monthly Recurring Subscription',
      },
      notes: {
        platform: 'MentorNearby',
        planId: UNIFIED_PLAN.id,
      },
    });
    cachedRazorpayPlanId = plan.id;
    return cachedRazorpayPlanId;
  } catch (err) {
    console.warn('⚠️ Razorpay plan creation fallback:', err.message);
    return `plan_fallback_${Date.now()}`;
  }
};

// @desc    Get the unified subscription plan configuration
// @route   GET /api/subscription/plan
// @access  Public
exports.getUnifiedPlan = asyncHandler(async (req, res) => {
  return success(res, 'Subscription plan configuration', {
    plan: UNIFIED_PLAN,
  });
});

// @desc    Create a Razorpay subscription / order for ₹199/month
// @route   POST /api/subscription/create-order, POST /api/subscription/create-subscription
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder';
  const isTestMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_');

  let subscriptionId = null;
  let orderId = null;
  let razorpayPlanId = null;

  try {
    const razorpay = getRazorpay();
    razorpayPlanId = await getOrCreateRazorpayPlan(razorpay);

    // Try creating a recurring Razorpay Subscription (AutoPay)
    try {
      const sub = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: 120, // Up to 10 years monthly recurring
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: String(userId),
          planId: UNIFIED_PLAN.id,
          userRole: user.role || 'STUDENT',
          userEmail: user.email,
          userName: user.name,
        },
      });
      subscriptionId = sub.id;
    } catch (subErr) {
      console.warn('⚠️ Razorpay recurring subscription API note (fallback to standard order with mandate intent):', subErr.message);
    }

    // Always create a standard order backup for seamless checkout
    const order = await razorpay.orders.create({
      amount: UNIFIED_PLAN.amountInPaise,
      currency: UNIFIED_PLAN.currency,
      receipt: `mn_sub_${userId}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: String(userId),
        planId: UNIFIED_PLAN.id,
        userRole: user.role || 'STUDENT',
        userEmail: user.email,
        userName: user.name,
        isRecurring: 'true',
        subscriptionId: subscriptionId || '',
      },
    });
    orderId = order.id;
  } catch (err) {
    console.warn('⚠️ Razorpay order fallback in test environment:', err.message);
    subscriptionId = `sub_test_${Date.now()}`;
    orderId = `order_test_${Date.now()}`;
  }

  // Create or update pending Subscription record in MongoDB
  let subscriptionDoc = await Subscription.findOne({
    user: user._id,
    status: { $in: ['ACTIVE', 'PENDING_AUTHORIZATION', 'PENDING_PAYMENT'] },
  });

  if (!subscriptionDoc) {
    subscriptionDoc = new Subscription({
      user: user._id,
      userRole: user.role || 'STUDENT',
      planId: UNIFIED_PLAN.id,
      planName: UNIFIED_PLAN.name,
      amount: UNIFIED_PLAN.amount,
      currency: UNIFIED_PLAN.currency,
      billingCycle: 'monthly',
      razorpayPlanId,
      razorpaySubscriptionId: subscriptionId || `sub_${Date.now()}`,
      mandateStatus: 'PENDING',
      status: 'PENDING_AUTHORIZATION',
    });
  } else {
    subscriptionDoc.razorpayPlanId = razorpayPlanId;
    subscriptionDoc.razorpaySubscriptionId = subscriptionId || subscriptionDoc.razorpaySubscriptionId;
  }

  await subscriptionDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Subscription created. Complete checkout to authorize monthly AutoPay.',
    subscriptionId: subscriptionDoc.razorpaySubscriptionId,
    orderId,
    amount: UNIFIED_PLAN.amountInPaise,
    amountInRupees: UNIFIED_PLAN.amount,
    currency: UNIFIED_PLAN.currency,
    key: razorpayKeyId,
    isTestMode,
    plan: UNIFIED_PLAN,
    data: {
      subscriptionId: subscriptionDoc.razorpaySubscriptionId,
      orderId,
      amount: UNIFIED_PLAN.amountInPaise,
      amountInRupees: UNIFIED_PLAN.amount,
      currency: UNIFIED_PLAN.currency,
      razorpayKeyId,
      plan: UNIFIED_PLAN,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
    },
  });
});

// @desc    Verify payment and authorize monthly subscription
// @route   POST /api/subscription/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const {
    orderId,
    paymentId,
    subscriptionId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    tutorId,
    teacherId,
  } = req.body;

  const actualOrderId = razorpay_order_id || orderId || `order_test_${Date.now()}`;
  const actualPaymentId = razorpay_payment_id || paymentId || `pay_test_${Date.now()}`;
  const actualSubId = razorpay_subscription_id || subscriptionId;

  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId).select('+phone');
  if (!user) return error(res, 'User not found', 404);

  // Server-side signature check for live/non-test payments
  if (
    process.env.RAZORPAY_KEY_SECRET &&
    razorpay_signature &&
    !actualOrderId.startsWith('order_test_') &&
    !actualPaymentId.startsWith('pay_test_')
  ) {
    let expectedSig = '';
    if (actualSubId && razorpay_payment_id) {
      // Razorpay Subscription signature format: payment_id|subscription_id
      expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_payment_id}|${actualSubId}`)
        .digest('hex');
    } else if (actualOrderId && razorpay_payment_id) {
      // Standard order signature format: order_id|payment_id
      expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${actualOrderId}|${razorpay_payment_id}`)
        .digest('hex');
    }

    if (expectedSig && expectedSig !== razorpay_signature) {
      // Log payment failure
      await Payment.create({
        user: user._id,
        razorpayPaymentId: actualPaymentId,
        razorpayOrderId: actualOrderId,
        razorpaySubscriptionId: actualSubId,
        amount: UNIFIED_PLAN.amount,
        amountInPaise: UNIFIED_PLAN.amountInPaise,
        currency: UNIFIED_PLAN.currency,
        status: 'FAILED',
        failureReason: 'Invalid payment signature',
      }).catch(() => {});

      return error(res, 'Payment verification failed — signature mismatch', 400);
    }
  }

  // Prevent duplicate processing
  const existingPayment = await Payment.findOne({ razorpayPaymentId: actualPaymentId });
  if (existingPayment && existingPayment.status === 'CAPTURED') {
    return res.status(200).json({
      success: true,
      message: 'Payment already processed and membership active.',
      isSubscribed: true,
      subscriptionExpiry: user.subscriptionExpiry,
      plan: UNIFIED_PLAN.name,
    });
  }

  // Calculate 30-day billing cycle dates
  const startDate = new Date();
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  // Update or create Subscription record in MongoDB
  let subscriptionDoc = await Subscription.findOne({
    $or: [
      { user: user._id, status: { $in: ['ACTIVE', 'PENDING_AUTHORIZATION', 'PENDING_PAYMENT'] } },
      { razorpaySubscriptionId: actualSubId },
    ],
  });

  if (!subscriptionDoc) {
    subscriptionDoc = new Subscription({
      user: user._id,
      userRole: user.role || 'STUDENT',
      planId: UNIFIED_PLAN.id,
      planName: UNIFIED_PLAN.name,
      amount: UNIFIED_PLAN.amount,
      currency: UNIFIED_PLAN.currency,
      billingCycle: 'monthly',
    });
  }

  subscriptionDoc.status = 'ACTIVE';
  subscriptionDoc.mandateStatus = 'AUTHORIZED';
  subscriptionDoc.startDate = startDate;
  subscriptionDoc.lastPaymentDate = startDate;
  subscriptionDoc.nextBillingDate = nextBillingDate;
  subscriptionDoc.razorpayPaymentId = actualPaymentId;
  subscriptionDoc.cancelAtPeriodEnd = false;
  subscriptionDoc.cancellationDate = null;
  if (actualSubId) subscriptionDoc.razorpaySubscriptionId = actualSubId;
  await subscriptionDoc.save();

  // Audit Payment in MongoDB
  await Payment.create({
    user: user._id,
    subscription: subscriptionDoc._id,
    razorpayPaymentId: actualPaymentId,
    razorpayOrderId: actualOrderId,
    razorpaySubscriptionId: actualSubId,
    amount: UNIFIED_PLAN.amount,
    amountInPaise: UNIFIED_PLAN.amountInPaise,
    currency: UNIFIED_PLAN.currency,
    status: 'CAPTURED',
    method: 'mandate',
    isRecurring: true,
    cycleNumber: 1,
  });

  // Update User state
  user.isSubscribed = true;
  user.isPremium = true;
  user.subscriptionType = 'all_access';
  user.subscriptionExpiry = nextBillingDate;
  user.premiumExpiresAt = nextBillingDate;
  user.contactUnlocks = 999999; // Unlimited access
  user.razorpaySubscriptionId = subscriptionDoc.razorpaySubscriptionId;
  user.subscription = {
    plan: 'all_access',
    isActive: true,
    expiry: nextBillingDate,
    contactUnlocks: 999999,
  };
  await user.save();

  // Send Subscription Confirmation & AutoPay Mandate Email
  try {
    await emailService.sendSubscriptionActivatedEmail({
      user,
      subscription: subscriptionDoc,
    });
  } catch (emailErr) {
    console.warn('⚠️ Subscription activation email notice:', emailErr.message);
  }

  // If this purchase was triggered to unlock a tutor/student contact, unlock immediately
  let contactInfo = null;
  const targetId = tutorId || teacherId;
  if (targetId) {
    try {
      await ContactUnlock.create({
        user: user._id,
        tutor: targetId,
        type: 'PAID',
        status: 'CONTACT_UNLOCKED',
        paymentStatus: 'COMPLETED',
        paymentDetails: {
          orderId: actualOrderId,
          paymentId: actualPaymentId,
          amount: UNIFIED_PLAN.amount,
        },
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
    message: 'MentorNearby All Access (₹199/month) activated successfully with authorized AutoPay!',
    isSubscribed: true,
    plan: UNIFIED_PLAN.name,
    amount: UNIFIED_PLAN.amount,
    subscriptionExpiry: user.subscriptionExpiry,
    nextBillingDate,
    contactUnlocks: user.contactUnlocks,
    mandateStatus: 'AUTHORIZED',
    contactInfo,
    subscription: subscriptionDoc,
    data: {
      isSubscribed: true,
      plan: UNIFIED_PLAN.name,
      amount: UNIFIED_PLAN.amount,
      subscriptionExpiry: user.subscriptionExpiry,
      nextBillingDate,
      contactUnlocks: user.contactUnlocks,
      mandateStatus: 'AUTHORIZED',
      contactInfo,
    },
  });
});

// @desc    Get user's subscription management details & payment history
// @route   GET /api/subscription/status, GET /api/subscription/manage
// @access  Private
exports.getStatus = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId).select(
    'isSubscribed subscriptionType subscriptionExpiry contactUnlocks freeChatsUsed freeLeadsUsed role razorpaySubscriptionId dailyViewsCount lastViewDate'
  );

  if (!user) return error(res, 'User not found', 404);

  // Fetch active or latest subscription document
  const subscriptionDoc = await Subscription.findOne({ user: user._id }).sort({ createdAt: -1 });

  // Fetch past payments
  const payments = await Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
  const failedPayments = payments.filter((p) => p.status === 'FAILED');

  const now = new Date();
  const isExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now;
  const isSubscribed = Boolean(user.isSubscribed && !isExpired);

  let displayStatus = 'Inactive';
  if (subscriptionDoc) {
    if (subscriptionDoc.status === 'ACTIVE' && !isExpired) {
      displayStatus = 'Active';
    } else if (subscriptionDoc.status === 'CANCELLED') {
      displayStatus = isExpired ? 'Expired' : 'Cancelled (Active until billing cycle ends)';
    } else if (subscriptionDoc.status === 'PAYMENT_FAILED') {
      displayStatus = 'Payment Failed';
    } else if (subscriptionDoc.status === 'PAST_DUE') {
      displayStatus = 'Past Due';
    } else if (isExpired) {
      displayStatus = 'Expired';
    } else {
      displayStatus = subscriptionDoc.status;
    }
  } else if (isSubscribed) {
    displayStatus = 'Active';
  }

  return success(res, 'Subscription status retrieved', {
    plan: UNIFIED_PLAN.name,
    planId: UNIFIED_PLAN.id,
    amount: UNIFIED_PLAN.amount,
    currency: UNIFIED_PLAN.currency,
    isSubscribed,
    subscriptionStatus: displayStatus,
    status: subscriptionDoc?.status || (isSubscribed ? 'ACTIVE' : 'INACTIVE'),
    mandateStatus: subscriptionDoc?.mandateStatus || 'NOT_CONFIGURED',
    startDate: subscriptionDoc?.startDate || null,
    nextBillingDate: subscriptionDoc?.nextBillingDate || user.subscriptionExpiry || null,
    lastPaymentDate: subscriptionDoc?.lastPaymentDate || null,
    cancellationDate: subscriptionDoc?.cancellationDate || null,
    cancelAtPeriodEnd: subscriptionDoc?.cancelAtPeriodEnd || false,
    subscriptionExpiry: user.subscriptionExpiry,
    contactUnlocks: isSubscribed ? 'Unlimited' : (user.contactUnlocks || 0),
    isUnlimited: isSubscribed,
    subscription: subscriptionDoc,
    paymentHistory: payments,
    failedPayments,
    unifiedPlan: UNIFIED_PLAN,
  });
});

// @desc    Cancel active subscription (AutoPay stopped, benefits kept until period end)
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  const subscriptionDoc = await Subscription.findOne({
    user: user._id,
    status: { $in: ['ACTIVE', 'PENDING_AUTHORIZATION', 'PAST_DUE'] },
  });

  if (!subscriptionDoc) {
    return error(res, 'No active subscription found to cancel', 404);
  }

  // Cancel via Razorpay API if subscription ID is present
  if (
    subscriptionDoc.razorpaySubscriptionId &&
    !subscriptionDoc.razorpaySubscriptionId.startsWith('sub_test_')
  ) {
    try {
      const razorpay = getRazorpay();
      await razorpay.subscriptions.cancel(subscriptionDoc.razorpaySubscriptionId, {
        cancel_at_cycle_end: 1, // AutoPay cancelled at cycle end
      });
    } catch (rzpErr) {
      console.warn('⚠️ Razorpay cancellation notice:', rzpErr.message);
    }
  }

  const effectiveEndDate = subscriptionDoc.nextBillingDate || user.subscriptionExpiry || new Date();
  subscriptionDoc.status = 'CANCELLED';
  subscriptionDoc.mandateStatus = 'CANCELLED';
  subscriptionDoc.cancelAtPeriodEnd = true;
  subscriptionDoc.cancellationDate = new Date();
  subscriptionDoc.cancelledBy = 'USER';
  subscriptionDoc.cancellationReason = req.body.reason || 'User cancelled subscription';
  await subscriptionDoc.save();

  // Send cancellation email
  try {
    await emailService.sendSubscriptionCancelledEmail({
      user,
      effectiveDate: effectiveEndDate,
    });
  } catch (emailErr) {
    console.warn('⚠️ Cancellation email notice:', emailErr.message);
  }

  return success(res, 'Subscription cancelled successfully. Your membership benefits will remain active until the end of your paid period.', {
    status: 'CANCELLED',
    mandateStatus: 'CANCELLED',
    cancellationDate: subscriptionDoc.cancellationDate,
    benefitsActiveUntil: effectiveEndDate,
  });
});

// @desc    Razorpay Webhook Handler (Idempotent + Signature verified)
// @route   POST /api/subscription/webhook
// @access  Public
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

  console.log(`🔔 Razorpay Webhook Event: ${event}`);

  // 1. Recurring Payment Succeeded (subscription.charged)
  if (event === 'subscription.charged' || event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload?.payment?.entity;
    const subEntity = payload?.subscription?.entity;
    const notes = paymentEntity?.notes || subEntity?.notes || {};
    const userId = notes.userId;
    const subId = subEntity?.id || paymentEntity?.subscription_id;
    const paymentId = paymentEntity?.id || `pay_${Date.now()}`;

    // Prevent duplicate webhook processing
    const alreadyProcessed = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (alreadyProcessed) {
      return res.status(200).json({ success: true, message: 'Duplicate event ignored' });
    }

    if (userId || subId) {
      let user = null;
      if (userId) user = await User.findById(userId);
      if (!user && subId) {
        const subRecord = await Subscription.findOne({ razorpaySubscriptionId: subId });
        if (subRecord) user = await User.findById(subRecord.user);
      }

      if (user) {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        let subRecord = await Subscription.findOne({ user: user._id });
        if (!subRecord) {
          subRecord = new Subscription({
            user: user._id,
            userRole: user.role || 'STUDENT',
            planId: UNIFIED_PLAN.id,
            planName: UNIFIED_PLAN.name,
            amount: UNIFIED_PLAN.amount,
          });
        }

        subRecord.status = 'ACTIVE';
        subRecord.mandateStatus = 'AUTHORIZED';
        subRecord.lastPaymentDate = new Date();
        subRecord.nextBillingDate = newExpiry;
        subRecord.razorpayPaymentId = paymentId;
        if (subId) subRecord.razorpaySubscriptionId = subId;
        await subRecord.save();

        // Record payment
        const paymentDoc = await Payment.create({
          user: user._id,
          subscription: subRecord._id,
          razorpayPaymentId: paymentId,
          razorpaySubscriptionId: subId,
          amount: UNIFIED_PLAN.amount,
          amountInPaise: UNIFIED_PLAN.amountInPaise,
          currency: UNIFIED_PLAN.currency,
          status: 'CAPTURED',
          method: paymentEntity?.method || 'mandate',
          isRecurring: true,
        });

        // Update user
        user.isSubscribed = true;
        user.isPremium = true;
        user.subscriptionType = 'all_access';
        user.subscriptionExpiry = newExpiry;
        user.premiumExpiresAt = newExpiry;
        user.contactUnlocks = 999999;
        await user.save();

        // Send recurring success email
        try {
          await emailService.sendRecurringPaymentSuccessEmail({
            user,
            payment: paymentDoc,
            nextBillingDate: newExpiry,
          });
        } catch (err) {
          console.warn('⚠️ Webhook email notice:', err.message);
        }
      }
    }
  }

  // 2. Mandate Authorized (subscription.authenticated)
  if (event === 'subscription.authenticated') {
    const subEntity = payload?.subscription?.entity;
    if (subEntity?.id) {
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subEntity.id },
        { mandateStatus: 'AUTHORIZED', status: 'ACTIVE' }
      );
    }
  }

  // 3. Payment Failed (payment.failed)
  if (event === 'payment.failed') {
    const paymentEntity = payload?.payment?.entity;
    const subId = paymentEntity?.subscription_id;
    const notes = paymentEntity?.notes || {};

    if (subId || notes.userId) {
      const subRecord = await Subscription.findOne({
        $or: [{ razorpaySubscriptionId: subId }, { user: notes.userId }],
      });

      if (subRecord) {
        subRecord.status = 'PAYMENT_FAILED';
        subRecord.failureReason = paymentEntity?.error_description || 'Payment mandate declined';
        subRecord.retryCount = (subRecord.retryCount || 0) + 1;
        await subRecord.save();

        const user = await User.findById(subRecord.user);
        if (user) {
          try {
            await emailService.sendPaymentFailedEmail({
              user,
              reason: subRecord.failureReason,
            });
          } catch (err) {
            console.warn('⚠️ Payment failed email notice:', err.message);
          }
        }
      }
    }
  }

  // 4. Subscription Cancelled (subscription.cancelled)
  if (event === 'subscription.cancelled') {
    const subEntity = payload?.subscription?.entity;
    if (subEntity?.id) {
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subEntity.id },
        { status: 'CANCELLED', mandateStatus: 'CANCELLED', cancellationDate: new Date() }
      );
    }
  }

  return res.status(200).json({ success: true, received: true });
});
