// ============================================================
// models/Notification.js
// MentorNearby Production User Notification Model
// ============================================================

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      index: true,
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      index: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    conversationId: {
      type: String,
      default: null,
    },
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
        'INFO',
        'SUCCESS',
        'WARNING',
        'KYC',
        'CONTACT',
        'REVIEW',
        'SYSTEM',
      ],
      default: 'ANNOUNCEMENT',
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
    },
    classLevel: {
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
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
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
    adminNotificationId: {
      type: mongoose.Schema.ObjectId,
      ref: 'AdminNotification',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for ultra-fast inbox querying
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
