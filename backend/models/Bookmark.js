// ============================================================
// models/Bookmark.js
// Saved study materials, books, chapters, and solutions
// ============================================================

const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EducationalResource',
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['BOOK', 'CHAPTER', 'SOLUTION', 'NOTES', 'QUESTION_PAPER'],
      default: 'BOOK',
    },
    chapterIndex: {
      type: Number,
      default: -1, // -1 means whole book/resource, >= 0 means specific chapter
    },
    chapterTitle: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      maxLength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bookmarks for the same user + resource + chapter
bookmarkSchema.index({ user: 1, resource: 1, chapterIndex: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
