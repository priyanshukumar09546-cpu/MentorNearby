// ============================================================
// models/DiscoveryLog.js
// Structured Real-Time Discovery Worker Logs & Audit Trail
// ============================================================

const mongoose = require('mongoose');

const DiscoveryLogSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
      default: 'INFO',
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    resultsFound: {
      type: Number,
      default: 0,
    },
    duplicatesSkipped: {
      type: Number,
      default: 0,
    },
    newLeadsAdded: {
      type: Number,
      default: 0,
    },
    errorDetail: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically keep logs for 30 days
DiscoveryLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('DiscoveryLog', DiscoveryLogSchema);
