// ============================================================
// models/AdminNotification.js
// MentorNearby Admin Broadcast & Campaign Notification Model
// Tracks Admin-created notifications, audience targeting & delivery stats
// ============================================================

const mongoose = require('mongoose');

const AdminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    type: {
      type: String,
      enum: [
        'STUDY_RESOURCE',
        'TUTOR_REQUEST',
        'MESSAGE',
        'PAYMENT',
        'ANNOUNCEMENT',
        'KYC_VERIFICATION',
        'SECURITY',
        'SYSTEM_UPDATE',
      ],
      default: 'ANNOUNCEMENT',
      required: true,
      index: true,
    },
    targetAudience: {
      type: String,
      enum: [
        'ALL',
        'STUDENTS',
        'TUTORS',
        'SPECIFIC_USER',
        'CLASS_9',
        'CLASS_10',
        'CLASS_11',
        'CLASS_12',
      ],
      default: 'ALL',
      required: true,
      index: true,
    },
    classLevel: {
      type: String,
      default: 'All Classes',
    },
    targetUserId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUserEmail: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    actionText: {
      type: String,
      default: 'View Now',
      maxLength: 50,
    },
    actionUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DELIVERED', 'SCHEDULED', 'SENDING', 'FAILED', 'delivered', 'scheduled', 'sending', 'failed'],
      default: 'DELIVERED',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    recipientsCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AdminNotificationSchema.index({ createdAt: -1, status: 1, type: 1 });

module.exports = mongoose.model('AdminNotification', AdminNotificationSchema);
