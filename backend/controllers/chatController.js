const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const ContactUnlock = require('../models/ContactUnlock');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Helper to check if users can chat
const canChat = async (user1Id, user2Id) => {
  const contactUnlock = await ContactUnlock.findOne({
    $or: [
      { user: user1Id, tutor: user2Id },
      { user: user2Id, tutor: user1Id }
    ],
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED', 'COMPLETED'] }
  });

  return !!contactUnlock;
};

// @desc    Send a message
// @route   POST /api/v1/chat/:userId
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const receiverId = req.params.userId;
  const senderId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return error(res, 'Please provide message content', 400);
  }

  if (senderId === receiverId) {
    return error(res, 'You cannot send a message to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return error(res, 'Receiver not found', 404);
  }

  const allowed = await canChat(senderId, receiverId);
  if (!allowed) {
    return error(res, 'You must unlock contact with this user before messaging', 403);
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content
  });

  // Notify receiver
  await createNotification(
    receiverId,
    'New Message',
    `You have received a new message from ${req.user.name}.`,
    'CONTACT',
    `/chat/${senderId}`
  );

  return success(res, 'Message sent successfully', message, 201);
});

// @desc    Get messages for a conversation
// @route   GET /api/v1/chat/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user.id;

  const allowed = await canChat(currentUserId, otherUserId);
  if (!allowed) {
    return error(res, 'You do not have access to this conversation', 403);
  }

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId }
    ]
  }).sort({ createdAt: 1 });

  // Mark unread messages as read
  await Message.updateMany(
    { sender: otherUserId, receiver: currentUserId, read: false },
    { read: true }
  );

  return success(res, 'Messages retrieved successfully', { count: messages.length, data: messages });
});

// @desc    Get list of conversations
// @route   GET /api/v1/chat
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user.id;

  // Find all contact unlocks where current user is involved and status is allowed
  const unlocks = await ContactUnlock.find({
    $or: [
      { user: currentUserId },
      { tutor: currentUserId }
    ],
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED', 'COMPLETED'] }
  }).populate('user', 'name avatar').populate('tutor', 'name avatar');

  const conversations = unlocks.map(unlock => {
    // If current user is 'user', the other is 'tutor', else the other is 'user'
    const isUser = unlock.user._id.toString() === currentUserId;
    return {
      otherUser: isUser ? unlock.tutor : unlock.user,
      contactUnlockId: unlock._id,
      status: unlock.status,
      unlockedAt: unlock.unlockedAt || unlock.updatedAt
    };
  });

  return success(res, 'Conversations retrieved successfully', { count: conversations.length, data: conversations });
});
