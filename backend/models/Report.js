const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  reportedReview: {
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  },
  reportedProfile: {
    type: mongoose.Schema.ObjectId,
    ref: 'TutorProfile'
  },
  category: {
    type: String,
    enum: ['FAKE_PROFILE', 'SCAM', 'HARASSMENT', 'INAPPROPRIATE_BEHAVIOR', 'MISLEADING_INFO', 'SAFETY_CONCERN', 'OTHER'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED'],
    default: 'PENDING'
  },
  adminNotes: {
    type: String,
    select: false
  },
  resolvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
