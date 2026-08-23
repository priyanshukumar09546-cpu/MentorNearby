const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['USER', 'TUTOR_PROFILE', 'KYC', 'REPORT', 'CONFIG', 'PAYMENT', 'REQUIREMENT', 'SYSTEM'],
    default: 'SYSTEM'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
