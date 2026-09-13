const mongoose = require('mongoose');

const ContactUnlockSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tutorProfile: {
    type: mongoose.Schema.ObjectId,
    ref: 'TutorProfile'
  },
  type: {
    type: String,
    enum: ['FREE', 'PAID', 'CREDIT', 'PRO_UNLIMITED'],
    default: 'PAID',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: {
    type: String,
    select: false // Store for audit, never return
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'NOT_APPLICABLE'],
    default: 'PENDING'
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'CONTACT_UNLOCKED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  targetId: {
    type: String,
    index: true
  },
  plan: {
    type: String,
    default: '₹99 Contact Unlock'
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  studentArea: String,
  tutorArea: String,
  requestDetails: String,
  unlockedAt: Date
}, {
  timestamps: true
});

// Indexes for fast, reliable entitlement queries
ContactUnlockSchema.index({ user: 1, tutor: 1 });
ContactUnlockSchema.index({ user: 1, targetId: 1 });

module.exports = mongoose.model('ContactUnlock', ContactUnlockSchema);
