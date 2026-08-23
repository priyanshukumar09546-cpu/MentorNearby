// ============================================================
// models/EducationalResource.js
// Database model for NCERT Books, Solutions, Notes & Papers
// ============================================================

const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  unitNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  openUrl: {
    type: String,
    trim: true,
  },
  downloadUrl: {
    type: String,
    trim: true,
  },
  contentType: {
    type: String,
    enum: ['PDF', 'ONLINE_VIEWER', 'ARTICLE', 'DOCUMENT', 'OTHER'],
    default: 'PDF',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  sourceUrl: {
    type: String,
    trim: true,
  },
}, { _id: true });

const educationalResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxLength: 250,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['NCERT_BOOK', 'NCERT_SOLUTION', 'NCERT_NOTE', 'CBSE_PAPER', 'OTHER_SOLUTION'],
      index: true,
    },
    medium: {
      type: String,
      required: [true, 'Medium is required'],
      enum: ['English', 'Hindi', 'Urdu', 'Other'],
      default: 'English',
      index: true,
    },
    classLevel: {
      type: String,
      required: [true, 'Class level is required'],
      trim: true,
      index: true, // e.g. "Class 12", "Class 11", ... "Class 1"
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true, // e.g. "Mathematics", "Physics", "Chemistry", "Science"
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['BOOK', 'CHAPTER', 'SOLUTION', 'NOTES', 'QUESTION_PAPER'],
      default: 'BOOK',
      index: true,
    },
    publisher: {
      type: String,
      default: 'NCERT',
      trim: true,
    },
    officialUrl: {
      type: String,
      trim: true,
    },
    downloadUrl: {
      type: String,
      trim: true,
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    chapters: [chapterSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'CHECKING'],
      default: 'AVAILABLE',
      index: true,
    },
    sourceId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true, // Stable canonical identifier to prevent duplicates during sync
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid browsing & search queries
educationalResourceSchema.index({ category: 1, medium: 1, classLevel: 1, subject: 1 });
educationalResourceSchema.index({ isActive: 1, classLevel: 1, subject: 1 });
educationalResourceSchema.index({
  title: 'text',
  subject: 'text',
  classLevel: 'text',
  description: 'text',
  'chapters.title': 'text',
});

const EducationalResource = mongoose.model('EducationalResource', educationalResourceSchema);

module.exports = EducationalResource;
