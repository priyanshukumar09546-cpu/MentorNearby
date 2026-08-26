const mongoose = require('mongoose');

const TutorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true
  },
  professionalHeadline: {
    type: String,
    maxlength: 150
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  teachingPhilosophy: {
    type: String,
    maxlength: 500
  },
  profilePhoto: {
    url: String,
    publicId: String
  },
  introVideo: {
    url: String,
    publicId: String
  },
  certificates: [{
    name: String,
    url: String,
    publicId: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  subjects: [{
    type: String
  }],
  grades: [{
    type: String
  }],
  languages: [{
    type: String
  }],
  teachingModes: [{
    type: String,
    enum: ['Online', 'Offline', 'Hybrid']
  }],
  experience: {
    years: Number,
    description: String
  },
  fees: {
    amount: {
      type: Number,
      default: 500
    },
    frequency: {
      type: String,
      enum: [
        'PER_HOUR', 'PER_DAY', 'PER_WEEK', 'PER_MONTH', 'PER_SESSION',
        'HOURLY', 'MONTHLY', 'DAILY', 'WEEKLY',
        'Hour', 'Day', 'Week', 'Month', 'Session',
        'hour', 'day', 'week', 'month', 'session',
        'HOUR', 'DAY', 'WEEK', 'MONTH', 'SESSION'
      ],
      default: 'PER_MONTH',
      set: function(val) {
        if (!val) return 'PER_MONTH';
        const str = String(val).trim().toUpperCase();
        if (str === 'HOUR' || str === 'HOURLY' || str === 'PER_HOUR') return 'PER_HOUR';
        if (str === 'MONTH' || str === 'MONTHLY' || str === 'PER_MONTH') return 'PER_MONTH';
        if (str === 'DAY' || str === 'DAILY' || str === 'PER_DAY') return 'PER_DAY';
        if (str === 'WEEK' || str === 'WEEKLY' || str === 'PER_WEEK') return 'PER_WEEK';
        if (str === 'SESSION' || str === 'PER_SESSION') return 'PER_SESSION';
        return str;
      }
    },
    currency: {
      type: String,
      default: 'INR'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  availability: {
    monday: { available: Boolean, slots: [String] },
    tuesday: { available: Boolean, slots: [String] },
    wednesday: { available: Boolean, slots: [String] },
    thursday: { available: Boolean, slots: [String] },
    friday: { available: Boolean, slots: [String] },
    saturday: { available: Boolean, slots: [String] },
    sunday: { available: Boolean, slots: [String] }
  },
  location: {
    area: String,
    locality: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order
        default: undefined,
      },
    }
  },
  serviceAreas: [String],
  safetyPreferences: {
    femaleStudentsOnly: { type: Boolean, default: false },
    parentPresenceRequired: { type: Boolean, default: false },
    onlineOnly: { type: Boolean, default: false }
  },
  verificationStatus: {
    type: String,
    default: 'pending',
    set: function(val) {
      if (typeof val === 'object' && val !== null) return 'pending';
      return String(val).toLowerCase();
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profileStatus: {
    type: String,
    default: 'pending'
  },
  kycStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'PENDING_ADMIN_REVIEW', 'APPROVED_BY_ADMIN'],
    default: 'NOT_SUBMITTED'
  },
  aadhaarLast4: {
    type: String,
    maxlength: 4
  },
  aadhaarVerhoeffPass: {
    type: Boolean,
    default: false
  },
  idPhotoPath: {
    type: String
  },
  profileVisibility: {
    type: Boolean,
    default: true
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0
  },
  profileViews: {
    type: Number,
    default: 0
  },
  searchAppearances: {
    type: Number,
    default: 0
  },
  savedCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  studentRequests: {
    type: Number,
    default: 0
  },
  contactUnlocks: {
    type: Number,
    default: 0
  },
  gender: {
    type: String
  },
  age: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes
TutorProfileSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index
TutorProfileSchema.index({ subjects: 'text', grades: 'text', bio: 'text' });
// Separate indexes for arrays to avoid parallel array index errors
TutorProfileSchema.index({ kycStatus: 1, teachingModes: 1 });
TutorProfileSchema.index({ kycStatus: 1, subjects: 1 });
TutorProfileSchema.index({ kycStatus: 1, grades: 1 });
TutorProfileSchema.index({ 'location.pincode': 1, 'location.city': 1 });
TutorProfileSchema.index({ profileVisibility: 1, kycStatus: 1 });

// Calculate profile completion percentage
TutorProfileSchema.methods.calculateProfileCompletion = function() {
  let filledFields = 0;
  const totalFields = 10; // Adjust based on required fields for 100%

  if (this.bio) filledFields++;
  if (this.teachingPhilosophy) filledFields++;
  if (this.profilePhoto && this.profilePhoto.url) filledFields++;
  if (this.education && this.education.length > 0) filledFields++;
  if (this.subjects && this.subjects.length > 0) filledFields++;
  if (this.grades && this.grades.length > 0) filledFields++;
  if (this.experience && this.experience.years !== undefined) filledFields++;
  if (this.fees && this.fees.amount !== undefined) filledFields++;
  if (this.location && this.location.city) filledFields++;
  if (this.teachingModes && this.teachingModes.length > 0) filledFields++;

  this.profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);
  this.isProfileComplete = this.profileCompletionPercentage >= 80; // Consider complete if >= 80%

  return this.profileCompletionPercentage;
};

// Pre-save hook to calculate completion and generate slug
TutorProfileSchema.pre('save', async function(next) {
  if (this.isModified('bio') || this.isModified('teachingPhilosophy') || this.isModified('profilePhoto') || 
      this.isModified('education') || this.isModified('subjects') || this.isModified('grades') || 
      this.isModified('experience') || this.isModified('fees') || this.isModified('location') || 
      this.isModified('teachingModes')) {
    this.calculateProfileCompletion();
  }
  
  if (this.isNew && !this.slug) {
    // Note: User population logic for slug generation should be handled in the controller or service
    // since we don't have access to the User model populated here by default easily without an extra query.
    // For a robust system, you might generate the slug in the service layer before saving.
  }

  next();
});

module.exports = mongoose.model('TutorProfile', TutorProfileSchema);
