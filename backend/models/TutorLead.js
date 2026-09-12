// ============================================================
// models/TutorLead.js
// MentorNearby Real Discovered Tutor Lead Collection
// Multi-Stage Verification Pipeline:
// DISCOVERED -> LEAD -> INVITED -> CLAIMED -> PROFILE_COMPLETED ->
// VERIFICATION_PENDING -> VERIFIED -> LIVE
// ZERO Fake / Synthetic Data • Strict Provenance
// ============================================================

const mongoose = require('mongoose');

const TutorLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tutor name is required'],
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    locality: {
      type: String,
      trim: true,
      default: '',
    },
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    classes: [
      {
        type: String,
        trim: true,
      },
    ],
    qualification: {
      type: String,
      trim: true,
      default: '',
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    teachingMode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid', 'Both', 'Not Specified'],
      default: 'Not Specified',
    },
    fee: {
      amount: {
        type: Number,
        default: null,
      },
      frequency: {
        type: String,
        default: 'PER_MONTH',
      },
      rawText: {
        type: String,
        default: '',
      },
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required for attribution & provenance'],
      trim: true,
    },
    sourceProvider: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        'DISCOVERED',
        'CONTACTED',
        'REGISTERED',
        'PENDING APPROVAL',
        'APPROVED',
        'LIVE',
        'REJECTED',
        'SUSPENDED',
        // Backwards compatibility
        'LEAD',
        'INVITED',
        'CLAIMED',
        'PROFILE_COMPLETED',
        'VERIFICATION_PENDING',
        'VERIFIED',
      ],
      default: 'DISCOVERED',
      index: true,
    },
    contactedAt: {
      type: Date,
    },
    registrationToken: {
      type: String,
      sparse: true,
      index: true,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: '',
    },
    rawSourceData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sourceReferences: [
      {
        provider: String,
        url: String,
        discoveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    claimToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    claimTokenExpires: {
      type: Date,
    },
    inviteSentAt: {
      type: Date,
    },
    claimedAt: {
      type: Date,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorProfile',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

TutorLeadSchema.pre('validate', function (next) {
  if (!this.normalizedName && this.name) {
    this.normalizedName = this.name
      .toLowerCase()
      .replace(/^(dr|er|mr|mrs|ms|prof)\.?\s+/i, '')
      .replace(/[^a-z0-9]/g, '');
  }
  if (!this.sourceProvider) {
    this.sourceProvider = this.providerName || 'DirectoryIndexProvider';
  }
  if (!this.source) {
    this.source = this.sourceName || 'Educational Public Index';
  }
  next();
});

// Compound deduplication indexes
TutorLeadSchema.index({ normalizedName: 1, city: 1 });
TutorLeadSchema.index({ sourceUrl: 1 });
TutorLeadSchema.index({ status: 1, city: 1 });
TutorLeadSchema.index({ phone: 1 }, { sparse: true });
TutorLeadSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model('TutorLead', TutorLeadSchema);
