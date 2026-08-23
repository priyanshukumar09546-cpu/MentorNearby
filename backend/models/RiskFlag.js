const mongoose = require('mongoose');

const RiskFlagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  riskScore: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  flags: [{
    type: {
      type: String
    },
    description: String,
    detectedAt: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH']
    }
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  failedPayments: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  lastReviewed: Date,
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String,
    select: false
  },
  isManualReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RiskFlag', RiskFlagSchema);
