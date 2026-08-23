const mongoose = require('mongoose');

const KYCSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tutorProfile: {
    type: mongoose.Schema.ObjectId,
    ref: 'TutorProfile'
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED'],
    default: 'PENDING'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String,
    select: false // Internal only
  },
  rejectionReason: String,
  documents: [{
    type: {
      type: String,
      enum: ['PHONE', 'GOVT_ID', 'COLLEGE_ID', 'SELFIE', 'ADDRESS_PROOF']
    },
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  phoneNumber: {
    type: String,
    select: false // Encrypted/mask at application level
  },
  govtIdType: {
    type: String,
    enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID']
  },
  govtIdLast4: {
    type: String,
    maxlength: 4
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KYC', KYCSchema);
