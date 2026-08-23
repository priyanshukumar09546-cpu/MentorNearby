const mongoose = require('mongoose');

const SavedTutorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tutorProfile: {
    type: mongoose.Schema.ObjectId,
    ref: 'TutorProfile'
  }
}, {
  timestamps: true
});

// Prevent duplicate saves
SavedTutorSchema.index({ user: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('SavedTutor', SavedTutorSchema);
