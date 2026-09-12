// ============================================================
// models/DiscoveryCity.js
// MentorNearby India-Wide City Discovery Target Management
// Scalable for any Indian City • Dynamic Admin Control
// ============================================================

const mongoose = require('mongoose');

const DiscoveryCitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    targetLeadCount: {
      type: Number,
      default: 50,
      min: [1, 'Target must be at least 1 lead'],
      max: [5000, 'Target maximum exceeded'],
    },
    discoveredCount: {
      type: Number,
      default: 0,
    },
    claimedCount: {
      type: Number,
      default: 0,
    },
    verifiedCount: {
      type: Number,
      default: 0,
    },
    liveCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['IDLE', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'],
      default: 'IDLE',
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    activeProvider: {
      type: String,
      default: '',
    },
    lastRunAt: {
      type: Date,
    },
    lastCompletedAt: {
      type: Date,
    },
    lastError: {
      type: String,
      default: '',
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DiscoveryCity', DiscoveryCitySchema);
