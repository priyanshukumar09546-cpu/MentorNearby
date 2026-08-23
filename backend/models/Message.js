const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  connection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactUnlock' // Or whatever model links the two users
  }
}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
