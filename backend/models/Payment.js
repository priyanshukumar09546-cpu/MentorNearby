// ============================================================
// models/Payment.js
// MentorNearby Payment Audit Log
// Stores verified charges, renewals, and refunds
// ============================================================

const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in INR (e.g., 199)
    },
    amountInPaise: {
      type: Number,
      required: true, // in paise (e.g., 19900)
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CAPTURED',
      index: true,
    },
    method: {
      type: String, // 'upi', 'card', 'mandate', 'netbanking'
      default: 'card',
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    cycleNumber: {
      type: Number,
      default: 1,
    },
    failureReason: {
      type: String,
      default: null,
    },
    invoiceUrl: {
      type: String,
      default: null,
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

PaymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
