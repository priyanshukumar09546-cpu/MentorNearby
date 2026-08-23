// ============================================================
// models/CourseProgress.js
// Student Course Watch & Paper Completion Progress Schema
// ============================================================

const mongoose = require('mongoose');

const CourseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    completedPapers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CoursePaper',
      },
    ],
    lastWatchedPaper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursePaper',
    },
    lastWatchedPositionSeconds: {
      type: Number,
      default: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);
