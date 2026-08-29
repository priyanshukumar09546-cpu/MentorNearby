// ============================================================
// models/StudyResource.js
// Database model for Study Resources (Formula Sheets, Notes, Questions)
// Enforces Single Source of Truth Access & Pricing Rules
// ============================================================

const mongoose = require('mongoose');

const studyResourceSchema = new mongoose.Schema(
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
    classLevel: {
      type: String,
      required: [true, 'Class level is required'],
      trim: true,
      index: true, // e.g. "9", "10", "11", "12"
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true, // e.g. "Mathematics", "Science", "Physics", "Chemistry"
    },
    chapter: {
      type: String,
      trim: true, // e.g. "Chapter 1"
    },
    unit: {
      type: String,
      trim: true, // e.g. "Unit 1: Matter"
    },
    chapterNumber: {
      type: Number,
      default: 1,
      index: true,
    },
    chapterTitle: {
      type: String,
      trim: true, // e.g. "Matter in Our Surroundings"
    },
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'UP_BOARD_ENGLISH', 'UP_BOARD_HINDI', 'UP Board', 'All'],
      default: 'CBSE',
      index: true,
    },
    medium: {
      type: String,
      enum: ['English', 'Hindi', 'Bilingual'],
      default: 'English',
      index: true,
    },
    chaptersCount: {
      type: Number,
      default: 16,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: [
        'BOOK',
        'TEXTBOOK',
        'SOLUTIONS',
        'PYQ',
        'PYQ_PAPERS',
        'NOTES',
        'NOTES_FORMULAS',
        'SAMPLE_PAPER',
        'FORMULA_SHEET',
        'IMPORTANT_QUESTIONS_ANSWERS',
        'REVISION_NOTES',
        'REVISION_MATERIAL',
        'QUESTION_BANK',
        'COURSE',
        'OTHER',
      ],
      default: 'BOOK',
      index: true,
    },
    accessType: {
      type: String,
      enum: ['FREE_DEMO', 'PAID'],
      default: function () {
        const chNum = Number(this.chapterNumber) || 1;
        return chNum <= 2 ? 'FREE_DEMO' : 'PAID';
      },
      index: true,
    },
    isFree: {
      type: Boolean,
      default: function () {
        const chNum = Number(this.chapterNumber) || 1;
        return chNum <= 2;
      },
      index: true,
    },
    isFreeDemo: {
      type: Boolean,
      default: function () {
        const chNum = Number(this.chapterNumber) || 1;
        return chNum <= 2;
      },
      index: true,
    },
    readingEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    downloadEnabled: {
      type: Boolean,
      default: true,
    },
    contentSummary: {
      type: String,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      default: 49,
    },
    downloadPrice: {
      type: Number,
      default: function () {
        if (this.salePrice !== undefined) return this.salePrice;
        if (this.resourceType === 'FORMULA_SHEET') return 7;
        return 39;
      },
    },
    salePrice: {
      type: Number,
      required: true,
      default: function () {
        if (this.resourceType === 'FORMULA_SHEET') return 7;
        return 39;
      },
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'IMAGE', 'PDF'],
      default: 'image',
    },
    mimeType: {
      type: String,
      trim: true,
    },
    fileFormat: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    cloudinaryResourceType: {
      type: String,
      trim: true,
    },
    fileReference: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      filename: { type: String, trim: true },
      fileSize: { type: Number },
      mimeType: { type: String },
      fileType: { type: String },
      secureStorageKey: { type: String },
    },
    thumbnail: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },
    previewPages: [
      {
        page: { type: Number },
        url: { type: String, trim: true },
      },
    ],
    previewUrl: {
      type: String,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      trim: true,
      default: 'NCERT / Board Panel',
    },
    publisher: {
      type: String,
      trim: true,
      default: 'NCERT / State Board',
    },
    year: {
      type: Number,
      default: 2025,
    },
    pageCount: {
      type: Number,
      default: 220,
    },
    coverImage: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },
    officialBookUrl: {
      type: String,
      trim: true,
    },
    chapters: [
      {
        id: { type: String },
        chapterNumber: { type: Number },
        title: { type: String, trim: true },
        officialUrl: { type: String, trim: true },
        pageCount: { type: Number, default: 20 },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
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

const { detectFileType } = require('../utils/fileTypeDetector');

// Pre-save hook to strictly enforce Chapter 1/2 = Free Demo, Chapter 3+ = Paid and sync file metadata
studyResourceSchema.pre('save', function (next) {
  const chNum = Number(this.chapterNumber) || 1;
  const isFormula = this.resourceType === 'FORMULA_SHEET';

  if (chNum <= 2) {
    this.isFreeDemo = true;
    this.isFree = true;
    this.accessType = 'FREE_DEMO';
  } else {
    this.isFreeDemo = false;
    this.isFree = false;
    this.accessType = 'PAID';
  }

  // Enforce standard pricing
  if (!this.originalPrice || this.originalPrice <= 0) {
    this.originalPrice = isFormula ? 49 : 79;
  }
  if (!this.salePrice || this.salePrice <= 0) {
    this.salePrice = isFormula ? 7 : 39;
  }
  this.downloadPrice = this.salePrice;

  // Priority resolution for real Cloudinary URL
  const refUrl = this.fileReference?.url || '';
  const directUrl = this.fileUrl || '';

  if (this.isModified('fileUrl') && directUrl.includes('res.cloudinary.com')) {
    this.fileReference = { ...(this.fileReference || {}), url: directUrl };
  } else if (this.isModified('fileReference') && refUrl.includes('res.cloudinary.com')) {
    this.fileUrl = refUrl;
  } else if (refUrl.includes('res.cloudinary.com') && (!directUrl || directUrl.includes('dummy.pdf') || directUrl.includes('w3.org'))) {
    this.fileUrl = refUrl;
  } else if (directUrl.includes('res.cloudinary.com') && (!refUrl || refUrl.includes('dummy.pdf') || refUrl.includes('w3.org'))) {
    this.fileReference = { ...(this.fileReference || {}), url: directUrl };
  } else if (refUrl && (!directUrl || directUrl.includes('dummy.pdf') || directUrl.includes('w3.org'))) {
    this.fileUrl = refUrl;
  } else if (directUrl && (!refUrl || refUrl.includes('dummy.pdf') || refUrl.includes('w3.org'))) {
    this.fileReference = { ...(this.fileReference || {}), url: directUrl };
  }

  // Sync fileName and fileReference.filename
  if (this.fileName && !this.fileReference?.filename) {
    this.fileReference = { ...(this.fileReference || {}), filename: this.fileName };
  } else if (this.fileReference?.filename && !this.fileName) {
    this.fileName = this.fileReference.filename;
  }

  // Auto-detect and sync fileType, mimeType, fileFormat
  const detected = detectFileType({
    fileName: this.fileName,
    fileUrl: this.fileUrl,
    fileType: this.fileType,
    mimeType: this.mimeType,
    fileReference: this.fileReference,
    resourceType: this.resourceType,
  });

  this.fileType = detected.fileType;
  this.mimeType = detected.mimeType;
  this.fileFormat = detected.format;

  if (this.fileReference) {
    this.fileReference.fileType = detected.fileType;
    this.fileReference.mimeType = detected.mimeType;
    if (this.cloudinaryPublicId && !this.fileReference.publicId) {
      this.fileReference.publicId = this.cloudinaryPublicId;
    }
  }

  next();
});

// Compound indexes for rapid catalog queries
studyResourceSchema.index({ classLevel: 1, subject: 1, published: 1, chapterNumber: 1 });
studyResourceSchema.index({ published: 1, resourceType: 1, isFreeDemo: 1 });
studyResourceSchema.index({
  title: 'text',
  subject: 'text',
  chapterTitle: 'text',
  description: 'text',
});

const StudyResource = mongoose.model('StudyResource', studyResourceSchema);

module.exports = StudyResource;
