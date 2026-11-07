// ============================================================
// models/Subscription.js
// MentorNearby All Access Subscription Model
// Tracks Razorpay Subscriptions, AutoPay mandates, and lifecycle
// ============================================================

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['TUTOR', 'STUDENT', 'PARENT', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    planId: {
      type: String,
      default: 'all_access_monthly',
    },
    planName: {
      type: String,
      default: 'MentorNearby All Access',
    },
    amount: {
      type: Number,
      default: 199,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    billingCycle: {
      type: String,
      enum: ['monthly'],
      default: 'monthly',
    },
    razorpayPlanId: {
      type: String,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    mandateStatus: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'FAILED', 'CANCELLED', 'NOT_CONFIGURED'],
      default: 'PENDING',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'ACTIVE',
        'PENDING_AUTHORIZATION',
        'PENDING_PAYMENT',
        'PAYMENT_FAILED',
        'PAST_DUE',
        'CANCELLED',
        'EXPIRED',
      ],
      default: 'PENDING_AUTHORIZATION',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    cancellationDate: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledBy: {
      type: String,
      enum: ['USER', 'ADMIN', 'SYSTEM', null],
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for admin reporting and user dashboard queries
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ status: 1, nextBillingDate: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
