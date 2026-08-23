// ============================================================
// models/CoursePaper.js
// Individual Year Board Paper & Video Solution Schema
// ============================================================

const mongoose = require('mongoose');

const CoursePaperSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required (e.g. 2025)'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Paper title is required'],
      trim: true,
    },
    paperCode: {
      type: String,
      default: 'Set 1 / Official Board Paper',
      trim: true,
    },
    isFreeSample: {
      type: Boolean,
      default: false,
      index: true,
    },
    chapter: {
      type: String,
      default: '',
      trim: true,
    },
    pyqYears: {
      type: String,
      default: '',
      trim: true,
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
    durationMinutes: {
      type: Number,
      default: 45,
    },
    video: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      title: { type: String, default: '' },
      durationSeconds: { type: Number, default: 2700 },
      thumbnail: { type: String, default: '' },
    },
    ppt: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      filename: { type: String, default: 'Board_Paper_Solution_Notes.pdf' },
      pagesCount: { type: Number, default: 18 },
      downloadPrice: { type: Number, default: 19 },
    },
    downloadPrice: {
      type: Number,
      default: 19,
    },
    solutionNotes: {
      summary: { type: String, default: 'Complete step-by-step model answers with marking scheme breakdown.' },
      keyFormulas: [{ type: String }],
      stepByStepHints: [{ type: String }],
    },
    questionsCount: {
      type: Number,
      default: 38,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CoursePaperSchema.index({ course: 1, year: -1 });

module.exports = mongoose.model('CoursePaper', CoursePaperSchema);
