// ============================================================
// models/Referral.js
// MentorNearby Refer & Earn Tracking Model
// Anti-abuse, Idempotent 100-Coin Reward Transaction Engine
// ============================================================

const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A user can only be referred once
      index: true,
    },
    referredUserRole: {
      type: String,
      enum: ['TUTOR', 'STUDENT', 'PARENT'],
      default: 'TUTOR',
    },
    status: {
      type: String,
      enum: ['JOINED', 'VERIFIED', 'PREMIUM_PURCHASED', 'REWARDED'],
      default: 'JOINED',
      index: true,
    },
    coinsRewarded: {
      type: Number,
      default: 0,
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    planPurchased: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick referral queries
ReferralSchema.index({ referrer: 1, createdAt: -1 });

module.exports = mongoose.model('Referral', ReferralSchema);
