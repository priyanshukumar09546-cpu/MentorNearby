// ============================================================
// models/FaqItem.js
// Dynamic FAQ Items for Student, Tutor, Payment & Platform Questions
// ============================================================

const mongoose = require('mongoose');

const FaqItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['GENERAL', 'STUDENTS', 'TUTORS', 'PAYMENTS', 'STUDY_RESOURCES', 'COURSES', 'SAFETY'],
      default: 'GENERAL',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FaqItem', FaqItemSchema);
