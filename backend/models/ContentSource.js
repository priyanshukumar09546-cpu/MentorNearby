// ============================================================
// models/ContentSource.js
// Synchronization status & configuration for NCERT & content portals
// ============================================================

const mongoose = require('mongoose');

const contentSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      default: 'NCERT',
    },
    baseUrl: {
      type: String,
      default: 'https://ncert.nic.in',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },
    lastSyncStatus: {
      type: String,
      enum: ['IDLE', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'IDLE',
    },
    lastSyncSummary: {
      newResources: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      unavailable: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      message: { type: String, default: '' },
    },
    syncIntervalDays: {
      type: Number,
      default: 7,
    },
    syncLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        status: String,
        details: String,
        stats: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ContentSource = mongoose.model('ContentSource', contentSourceSchema);

module.exports = ContentSource;
