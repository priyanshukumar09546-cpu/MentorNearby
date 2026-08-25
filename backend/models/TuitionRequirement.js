const mongoose = require('mongoose');

const tuitionRequirementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: { type: String, required: true },
  class: { type: String, required: true },
  studentClass: { type: String },
  board: { type: String, default: 'CBSE' },
  medium: { type: String, default: 'English' },
  subjects: [{ type: String, required: true }],
  teachingMode: { 
    type: String, 
    enum: ['Home Tuition', 'Online', 'Both', 'Offline', 'Hybrid', 'ONLINE', 'OFFLINE', 'HYBRID'],
    default: 'Offline'
  },
  location: {
    city: { type: String, default: 'Not Set' },
    area: { type: String, default: 'Not Set' },
    pincode: { type: String, default: '000000' },
    address: { type: String }, // Exact address hidden publicly
  },
  preferences: {
    days: [{ type: String }],
    time: { type: String },
    tutorGender: { type: String, enum: ['Male', 'Female', 'Any'], default: 'Any' },
    maxDistanceKm: { type: Number, default: 5 },
    additionalRequirements: { type: String }
  },
  budget: {
    amount: { type: Number, default: 5000 },
    frequency: { 
      type: String, 
      enum: [
        'PER_HOUR', 'PER_DAY', 'PER_WEEK', 'PER_MONTH', 'PER_SESSION',
        'HOURLY', 'MONTHLY', 'DAILY', 'WEEKLY',
        'Hour', 'Day', 'Week', 'Month', 'Session',
        'hour', 'day', 'week', 'month', 'session',
        'HOUR', 'DAY', 'WEEK', 'MONTH', 'SESSION'
      ], 
      default: 'PER_MONTH' 
    }
  },
  status: {
    type: String,
    enum: ['OPEN', 'Open', 'TUTOR_REQUESTED', 'TUTOR_ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN'
  }
}, { timestamps: true });

// Geospatial index for location-based searching if coordinates added later
// tuitionRequirementSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.models.TuitionRequirement || mongoose.model('TuitionRequirement', tuitionRequirementSchema);
