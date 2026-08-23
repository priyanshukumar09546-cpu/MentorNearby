// ============================================================
// models/Course.js
// TutorNearby Course Schema (PYQ Mastery, Subject Courses, Crash Courses)
// ============================================================

const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['PYQ_MASTERY', 'SUBJECT_COURSE', 'CRASH_COURSE', 'REVISION_COURSE', 'BOARD_PREP', 'VIDEO_COURSE'],
      default: 'PYQ_MASTERY',
      index: true,
    },
    board: {
      type: String,
      default: 'CBSE',
      trim: true,
      index: true,
    },
    classLevel: {
      type: String,
      required: [true, 'Class level is required'],
      enum: ['9', '10', '11', '12', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    stream: {
      type: String,
      enum: ['General', 'Science', 'Commerce', 'Humanities', 'All'],
      default: 'General',
      index: true,
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      default: '10 Years of Board PYQs + Complete Video Solutions',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    youtubeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    youtubeVideoId: {
      type: String,
      default: '',
      trim: true,
    },
    chapter: {
      type: String,
      default: '',
      trim: true,
    },
    pyqYearsRange: {
      type: String,
      default: '2015–2026',
      trim: true,
    },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: 499,
      min: [0, 'Original price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    instructor: {
      name: { type: String, default: 'TutorNearby Academic Faculty' },
      bio: { type: String, default: 'Top-tier board subject experts and senior educators.' },
      avatar: { type: String, default: '' },
      credentials: { type: String, default: 'M.Sc, B.Ed • 10+ Years Teaching Experience' },
    },
    yearsCovered: {
      type: [Number],
      default: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016],
    },
    highlights: {
      type: [String],
      default: [
        '10 Years of Board PYQs with step-by-step video solutions',
        'Official CBSE marking scheme and answer-writing templates',
        'Downloadable solution PPTs and key formula summaries',
        'Common board exam pitfalls and high-scoring strategies',
      ],
    },
    contentSource: {
      type: String,
      default: 'Original TutorNearby Academic Productions',
    },
    licenseInfo: {
      type: String,
      default: 'Proprietary Content • All Rights Reserved TutorNearby',
    },
    rightsStatus: {
      type: String,
      enum: ['VERIFIED_ORIGINAL', 'PROPRIETARY_LICENSED', 'PENDING_REVIEW'],
      default: 'VERIFIED_ORIGINAL',
    },
    totalVideosCount: {
      type: Number,
      default: 10,
    },
    totalDurationMinutes: {
      type: Number,
      default: 450,
    },
    totalPptCount: {
      type: Number,
      default: 10,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 28,
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ classLevel: 1, subject: 1, category: 1 });
CourseSchema.index({ published: 1, isFeatured: 1 });

module.exports = mongoose.model('Course', CourseSchema);
