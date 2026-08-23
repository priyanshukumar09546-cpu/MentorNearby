// ============================================================
// models/StudyPurchase.js
// Database model for Study Resource & Subject Bundle Purchases
// Handles individual and combo purchases via Razorpay
// ============================================================

const mongoose = require('mongoose');

const studyPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    purchaseType: {
      type: String,
      required: [true, 'Purchase type is required'],
      enum: ['INDIVIDUAL_RESOURCE', 'FORMULA_COMBO', 'QA_COMBO', 'SUBJECT_BUNDLE'],
      index: true,
    },
    comboType: {
      type: String,
      enum: ['FORMULA_COMBO', 'QA_COMBO', null],
      default: null,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyResource',
      default: null,
      index: true,
    },
    bundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyResourceBundle',
      default: null,
      index: true,
    },
    classLevel: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      select: false, // Internal verification audit only
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for rapid access checks
studyPurchaseSchema.index({ user: 1, purchaseType: 1, paymentStatus: 1 });
studyPurchaseSchema.index({ user: 1, resource: 1, paymentStatus: 1 });
studyPurchaseSchema.index({ user: 1, classLevel: 1, subject: 1, comboType: 1, paymentStatus: 1 });
studyPurchaseSchema.index({ user: 1, classLevel: 1, subject: 1, paymentStatus: 1 });

const StudyPurchase = mongoose.model('StudyPurchase', studyPurchaseSchema);

module.exports = StudyPurchase;
