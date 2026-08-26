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
  kycMode: {
    type: String,
    enum: ['DIGILOCKER', 'MANUAL'],
    default: 'MANUAL'
  },
  digilockerVerified: {
    type: Boolean,
    default: false
  },
  digilockerData: {
    name: String,
    last4: String,
    verifiedAt: Date,
    source: {
      type: String,
      default: 'DIGILOCKER_UIDAI'
    }
  },
  selfieUrl: String,
  status: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'PENDING_MANUAL_REVIEW', 'PENDING_ADMIN_REVIEW', 'APPROVED_BY_ADMIN'],
    default: 'PENDING'
  },
  aadhaarVerhoeffPass: {
    type: Boolean,
    default: false
  },
  idPhotoPath: String,
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
    enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID', 'Aadhaar', 'Pan'],
    set: function(val) {
      if (!val) return 'AADHAAR';
      const s = String(val).trim().toUpperCase();
      if (s.includes('AADHAAR') || s.includes('ADHAAR')) return 'AADHAAR';
      if (s.includes('PAN')) return 'PAN';
      if (s.includes('VOTER')) return 'VOTER_ID';
      if (s.includes('DRIVING') || s.includes('LICENSE')) return 'DRIVING_LICENSE';
      if (s.includes('PASSPORT')) return 'PASSPORT';
      return 'AADHAAR';
    },
    default: 'AADHAAR'
  },
  govtIdLast4: {
    type: String,
    maxlength: 4
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('KYC', KYCSchema);
