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
  studentArea: String,
  tutorArea: String,
  requestDetails: String,
  unlockedAt: Date
}, {
  timestamps: true
});

// One unlock per user-tutor pair
ContactUnlockSchema.index({ user: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('ContactUnlock', ContactUnlockSchema);
