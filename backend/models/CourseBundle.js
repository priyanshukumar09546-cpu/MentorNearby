// ============================================================
// models/CourseBundle.js
// Multi-Subject Course Packs & Stream Combos Schema
// ============================================================

const mongoose = require('mongoose');

const CourseBundleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Bundle name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bundleType: {
      type: String,
      enum: ['TWO_SUBJECT_PACK', 'ALL_SUBJECT_COMBO', 'STREAM_COMBO', 'CUSTOM_BUNDLE'],
      required: true,
      index: true,
    },
    classLevel: {
      type: String,
      required: true,
      enum: ['9', '10', '11', '12', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
      index: true,
    },
    stream: {
      type: String,
      enum: ['General', 'Science', 'Commerce', 'Humanities', 'All'],
      default: 'General',
      index: true,
    },
    tagline: {
      type: String,
      default: 'Maximum Savings • Complete Exam Preparation Pack',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      required: true,
      min: [0, 'Original price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    badge: {
      type: String,
      default: 'MOST POPULAR',
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CourseBundleSchema.index({ classLevel: 1, bundleType: 1 });

module.exports = mongoose.model('CourseBundle', CourseBundleSchema);
