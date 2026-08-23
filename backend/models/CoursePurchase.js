// ============================================================
// models/CoursePurchase.js
// Student Course & Bundle Purchases Entitlement Schema
// ============================================================

const mongoose = require('mongoose');

const CoursePurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purchaseType: {
      type: String,
      enum: ['PYQ_SUBJECT', 'PYQ_TWO_SUBJECT', 'PYQ_ALL_SUBJECT', 'PYQ_STREAM_COMBO', 'COURSE_BUNDLE', 'INDIVIDUAL_COURSE', 'PPT_DOWNLOAD'],
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursePaper',
      index: true,
    },
    bundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseBundle',
      index: true,
    },
    includedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    classLevel: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    stream: {
      type: String,
      default: 'General',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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
      index: true,
    },
    razorpaySignature: {
      type: String,
      select: false,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CoursePurchaseSchema.index({ user: 1, course: 1, paymentStatus: 1 });
CoursePurchaseSchema.index({ user: 1, bundle: 1, paymentStatus: 1 });

module.exports = mongoose.model('CoursePurchase', CoursePurchaseSchema);
