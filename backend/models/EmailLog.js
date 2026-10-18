const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'TUTOR_APPROVAL',
        'TUTOR_UNAPPROVAL',
        'PASSWORD_RESET',
        'WELCOME',
        'EMAIL_VERIFICATION',
        'KYC_SUBMITTED',
        'KYC_APPROVED',
        'KYC_REJECTED',
        'CONTACT_UNLOCKED',
        'PAYMENT_CONFIRMATION',
        'OTHER',
      ],
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorProfile',
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'STUB', 'SUPPRESSED'],
      default: 'SENT',
      index: true,
    },
    provider: {
      type: String,
      enum: ['RESEND', 'SMTP', 'STUB'],
      default: 'SMTP',
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    error: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

EmailLogSchema.index({ createdAt: -1 });
EmailLogSchema.index({ recipient: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
