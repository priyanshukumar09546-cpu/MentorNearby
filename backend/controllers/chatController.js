// ============================================================
// controllers/chatController.js
// Chat with freemium limits + message filtering
// ============================================================

const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const { filterMessage } = require('../utils/messageFilter');
const { createNotification } = require('./notificationController');

// ── Helper: check if subscription is still active ─────────
const isActiveSubscriber = (user) => {
  if (!user.isSubscribed) return false;
  if (!user.subscriptionExpiry) return false;
  return new Date(user.subscriptionExpiry) > new Date();
};

const { sendLeadWhatsAppAlert } = require('../services/whatsappService');

// @desc    Send a message (filtered, with freemium gate & spam protection)
// @route   POST /api/chat/:userId
// @access  Private (limit enforced by checkChatLimit middleware in route)
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const receiverId = req.params.userId;
  const senderId = req.user._id || req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return error(res, 'Please provide message content', 400);
  }

  if (String(senderId) === String(receiverId)) {
    return error(res, 'You cannot send a message to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return error(res, 'Receiver not found', 404);
  }

  // ── Spam Control 1: Rate limit 1 message per 10 seconds ──────
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const lastMessage = await Message.findOne({
    sender: senderId,
    createdAt: { $gte: tenSecondsAgo },
  }).sort({ createdAt: -1 });

  if (lastMessage) {
    const elapsedMs = Date.now() - new Date(lastMessage.createdAt).getTime();
    const waitSec = Math.max(1, Math.ceil((10000 - elapsedMs) / 1000));
    return error(res, `Please wait ${waitSec}s before sending another message.`, 429, 'RATE_LIMITED');
  }

  // ── Spam Control 2: Prevent consecutive duplicate messages ───
  const previousMessage = await Message.findOne({
    sender: senderId,
    receiver: receiverId,
  }).sort({ createdAt: -1 });

  if (
    previousMessage &&
    previousMessage.content.trim().toLowerCase() === content.trim().toLowerCase()
  ) {
    return error(res, 'Please do not repeat the exact same message.', 400, 'DUPLICATE_MESSAGE');
  }

  // Filter message content before saving
  const filteredContent = filterMessage(content.trim());

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: filteredContent,
    originalBlocked: filteredContent !== content.trim(),
  });

  // Notify receiver in-app
  await createNotification(
    receiverId,
    'New Message',
    `You have received a new message from ${req.user.name}.`,
    'CONTACT',
    `/chat/${senderId}`
  );

  // Send WhatsApp Lead Alert if receiver is a tutor
  if (receiver.role === 'TUTOR') {
    sendLeadWhatsAppAlert({
      teacherPhone: receiver.phone,
      studentName: req.user.name,
      subject: 'Tuition Lead',
      location: req.user.city || req.user.area || 'Nearby',
    }).catch(() => {});
  }

  return success(res, 'Message sent successfully', {
    message,
    wasFiltered: filteredContent !== content.trim(),
    freeChatsUsed: req.user.freeChatsUsed,
    isSubscribed: isActiveSubscriber(req.user),
  }, 201);
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user._id || req.user.id;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  // Mark unread messages as read
  await Message.updateMany(
    { sender: otherUserId, receiver: currentUserId, read: false },
    { read: true }
  );

  return success(res, 'Messages retrieved successfully', {
    count: messages.length,
    data: messages,
  });
});

// @desc    Get list of conversations (unique users this user has chatted with)
// @route   GET /api/chat
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id || req.user.id;

  // Aggregate to find all unique conversation partners
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', currentUserId] },
            '$receiver',
            '$sender',
          ],
        },
        lastMessage: { $last: '$$ROOT' },
        updatedAt: { $max: '$createdAt' },
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  // Populate the other user's info
  const populated = await User.populate(conversations, {
    path: '_id',
    select: 'name avatar role',
  });

  const result = populated.map((conv) => ({
    otherUser: conv._id,
    lastMessage: conv.lastMessage,
    updatedAt: conv.updatedAt,
  }));

  // Fetch current user subscription status for counter display
  const currentUser = await User.findById(currentUserId).select(
    'freeChatsUsed freeLeadsUsed isSubscribed subscriptionType subscriptionExpiry role'
  );

  const FREE_LIMIT = currentUser.role === 'TUTOR' ? 5 : 3;
  const usedCount = currentUser.role === 'TUTOR'
    ? currentUser.freeChatsUsed
    : currentUser.freeChatsUsed;

  return success(res, 'Conversations retrieved successfully', {
    count: result.length,
    data: result,
    subscription: {
      isSubscribed: isActiveSubscriber(currentUser),
      subscriptionType: currentUser.subscriptionType,
      subscriptionExpiry: currentUser.subscriptionExpiry,
      freeChatsUsed: usedCount,
      freeChatsLimit: FREE_LIMIT,
      chatsRemaining: Math.max(0, FREE_LIMIT - usedCount),
    },
  });
});

// @desc    Get subscription & chat limit status for current user
// @route   GET /api/chat/my-status
// @access  Private
exports.getMyChatStatus = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id || req.user.id;
  const currentUser = await User.findById(currentUserId).select(
    'freeChatsUsed freeLeadsUsed isSubscribed subscriptionType subscriptionExpiry role'
  );

  const FREE_LIMIT = currentUser.role === 'TUTOR' ? 5 : 3;
  const usedCount = currentUser.freeChatsUsed;
  const active = isActiveSubscriber(currentUser);

  return success(res, 'Chat status retrieved', {
    isSubscribed: active,
    subscriptionType: currentUser.subscriptionType,
    subscriptionExpiry: currentUser.subscriptionExpiry,
    freeChatsUsed: usedCount,
    freeChatsLimit: FREE_LIMIT,
    chatsRemaining: active ? Infinity : Math.max(0, FREE_LIMIT - usedCount),
    paywallPlan: currentUser.role === 'TUTOR' ? 149 : 99,
    paywallPlanType: currentUser.role === 'TUTOR' ? 'teacher' : 'student',
  });
});
