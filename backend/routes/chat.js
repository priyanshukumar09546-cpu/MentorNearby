// ============================================================
// routes/chat.js
// Chat routes with freemium checkChatLimit middleware on sendMessage
// ============================================================

const express = require('express');
const {
  sendMessage,
  getMessages,
  getConversations,
  getMyChatStatus,
} = require('../controllers/chatController');

const router = express.Router();
const { protect } = require('../middleware/auth');
const checkChatLimit = require('../middleware/checkChatLimit');

router.use(protect);

// Get all conversations + subscription status
router.get('/', getConversations);

// Get current user's chat limit status
router.get('/my-status', getMyChatStatus);

// Get messages with a specific user (no limit needed for reading)
router.get('/:userId', getMessages);

// Send a message (freemium gate applied here)
router.post('/:userId', checkChatLimit('chat'), sendMessage);

module.exports = router;
