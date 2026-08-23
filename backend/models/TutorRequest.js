const mongoose = require('mongoose');

const tutorRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TuitionRequirement'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
    default: 'PENDING'
  },
  message: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.models.TutorRequest || mongoose.model('TutorRequest', tutorRequestSchema);
