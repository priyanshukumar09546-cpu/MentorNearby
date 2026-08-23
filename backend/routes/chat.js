const express = require('express');
const {
  sendMessage,
  getMessages,
  getConversations
} = require('../controllers/chatController');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getConversations);

router.route('/:userId')
  .post(sendMessage)
  .get(getMessages);

module.exports = router;
