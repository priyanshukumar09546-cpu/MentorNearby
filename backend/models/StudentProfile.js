const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profilePhoto: {
    url: String,
    publicId: String
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  aboutMe: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  whatsappNumber: {
    type: String,
    trim: true
  },
  location: {
    city: String,
    area: String,
    pincode: String,
    state: String,
    address: {
      type: String,
      select: false // Private by default, only selected when explicitly authorized
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    }
  },
  studentDetails: {
    name: String,
    class: String,
    board: String,
    medium: {
      type: String,
      enum: ['English', 'Hindi', 'Both', 'Other']
    }
  },
  academicDetails: {
    degree: String, // e.g. "B.Tech in Computer Science Engineering"
    college: String, // e.g. "ABES Engineering College, Ghaziabad"
    university: String, // e.g. "AKTU"
    yearOfStudy: String, // e.g. "2nd Year"
    cgpa: String, // e.g. "8.12"
    expectedGraduation: String, // e.g. "2026"
    twelfth: {
      board: String, // e.g. "Uttar Pradesh Board"
      percentage: String // e.g. "78.4%"
    },
    tenth: {
      board: String, // e.g. "Uttar Pradesh Board"
      percentage: String // e.g. "85.2%"
    },
    subjectsRequired: [String],
    weakSubjects: [String],
    interests: [String],
    learningGoals: [String],
    preferredSubjects: [String]
  },
  schoolDetails: {
    schoolName: String,
    grade: String,
    board: String,
    location: String,
    session: String,
    stream: String,
    medium: String
  },
  learningGoals: [String],
  preferredSubjects: [String],
  preferredModes: [String],
  tuitionRequirements: {
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid']
    },
    preferredDays: [String],
    preferredTime: String,
    budget: String,
    preferredGender: String
  },
  parentDetails: {
    name: String,
    phone: String,
    relationship: String
  },
  badges: [{
    name: String,
    category: String,
    icon: String,
    color: String,
    earnedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
