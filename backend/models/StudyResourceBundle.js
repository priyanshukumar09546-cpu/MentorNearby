// ============================================================
// models/StudyResourceBundle.js
// Database model for Formula Combos & Important Q&A Combos
// Separate combo products for Class + Subject + ComboType
// ============================================================

const mongoose = require('mongoose');

const studyResourceBundleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Bundle title is required'],
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
      index: true, // e.g. "Mathematics", "Science", "Physics", "Chemistry", "Biology"
    },
    comboType: {
      type: String,
      enum: ['FORMULA_COMBO', 'QA_COMBO'],
      required: true,
      default: 'FORMULA_COMBO',
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['FORMULA_SHEET', 'IMPORTANT_QUESTIONS_ANSWERS'],
      default: function () {
        return this.comboType === 'FORMULA_COMBO' ? 'FORMULA_SHEET' : 'IMPORTANT_QUESTIONS_ANSWERS';
      },
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    // Uploaded Master Combo File Metadata
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
      enum: ['pdf', 'image'],
      default: 'pdf',
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    fileFormat: {
      type: String,
      default: 'pdf',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    cloudinaryResourceType: {
      type: String,
      default: 'raw',
    },
    fileReference: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      filename: { type: String, trim: true },
      mimeType: { type: String, default: 'application/pdf' },
      fileType: { type: String, default: 'pdf' },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on classLevel + subject + comboType
studyResourceBundleSchema.index({ classLevel: 1, subject: 1, comboType: 1 }, { unique: true });

const StudyResourceBundle = mongoose.model('StudyResourceBundle', studyResourceBundleSchema);

module.exports = StudyResourceBundle;
