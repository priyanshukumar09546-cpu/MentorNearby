// ============================================================
// models/CmsPage.js
// Dynamic CMS Pages for Legal, Support & Educational Content
// ============================================================

const mongoose = require('mongoose');

const CmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['LEGAL', 'SUPPORT', 'COMPANY', 'HELP', 'OTHER'],
      default: 'LEGAL',
    },
    excerpt: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    metaTitle: {
      type: String,
      default: '',
    },
    metaDescription: {
      type: String,
      default: '',
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CmsPage', CmsPageSchema);
