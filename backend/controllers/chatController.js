// ============================================================
// controllers/chatController.js
// Chat with freemium limits + message filtering
// ============================================================

const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const { filterMessage, hasContactInfo } = require('../utils/messageFilter');
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
  const { content, text } = req.body;
  const rawContent = (content || text || '').trim();

  if (!rawContent) {
    return error(res, 'Please provide message content', 400);
  }

  if (String(senderId) === String(receiverId)) {
    return error(res, 'You cannot send a message to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return error(res, 'Receiver not found', 404);
  }

  // ── Anti-Bypass Check: Reject phone numbers, emails, and word numbers ──
  if (hasContactInfo(rawContent)) {
    return error(
      res,
      'Contact sharing is blocked in chat. Please use the Contact Unlock / Subscription feature to get direct phone numbers.',
      400,
      'CONTACT_SHARING_BLOCKED'
    );
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
    previousMessage.content.trim().toLowerCase() === rawContent.toLowerCase()
  ) {
    return error(res, 'Please do not repeat the exact same message.', 400, 'DUPLICATE_MESSAGE');
  }

  // Filter message content before saving
  const filteredContent = filterMessage(rawContent);

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: filteredContent,
    originalBlocked: filteredContent !== content.trim(),
  });

  // Notify receiver in-app
  await createNotification(
    receiverId,
    `New Message from ${req.user.name}`,
    filteredContent || 'Sent you a new message',
    'MESSAGE',
    `/messages?user=${senderId}&chat=${[senderId, receiverId].sort().join('_')}&recipient=${senderId}`,
    {
      senderId: senderId,
      conversationId: [senderId, receiverId].sort().join('_'),
      actionText: 'Reply in Chat',
    }
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

// @desc    Initiate conversation with teacher/student & verify eligibility
// @route   POST /api/chat/initiate
// @access  Private
exports.initiateConversation = asyncHandler(async (req, res, next) => {
  const senderId = req.user._id || req.user.id;
  const recipientId = req.body.recipientId || req.params.userId || req.body.userId || req.body.teacherId;

  if (!recipientId) {
    return error(res, 'Please provide recipient ID', 400);
  }

  if (String(senderId) === String(recipientId)) {
    return error(res, 'You cannot initiate a chat with yourself', 400);
  }

  // Find target recipient (could be teacher user ID or tutor profile ID)
  let recipient = await User.findById(recipientId);
  if (!recipient) {
    // Check if recipientId was a TutorProfile ID
    try {
      const Tutor = require('../models/Tutor');
      const tutorProfile = await Tutor.findById(recipientId);
      if (tutorProfile && tutorProfile.user) {
        recipient = await User.findById(tutorProfile.user);
      }
    } catch (_) {}
  }

  if (!recipient) {
    return error(res, 'Teacher / Recipient not found', 404);
  }

  const actualRecipientId = recipient._id;

  // Check if they already have an existing conversation / messages
  const existingMessage = await Message.findOne({
    $or: [
      { sender: senderId, receiver: actualRecipientId },
      { sender: actualRecipientId, receiver: senderId },
    ],
  });

  const currentUser = await User.findById(senderId);

  // If new conversation between student and teacher, check subscription & unlock limits
  if (!existingMessage) {
    const isSubscribed = Boolean(
      (currentUser.isSubscribed && currentUser.subscriptionExpiry && new Date(currentUser.subscriptionExpiry) > new Date()) ||
      (currentUser.subscription?.isActive && (!currentUser.subscription?.expiry || new Date(currentUser.subscription?.expiry) > new Date()))
    );

    const hasFreeChats = (currentUser.freeChatsUsed || 0) < 3;
    const hasUnlocks = (currentUser.contactUnlocks || 0) > 0 || (currentUser.subscription?.contactUnlocks || 0) > 0;

    if (!isSubscribed && !hasFreeChats && !hasUnlocks) {
      return res.status(403).json({
        success: false,
        message: 'Subscription required to unlock and chat with new teachers. Plan starting at Rs 99/month.',
        needSubscription: true,
        code: 'SUBSCRIPTION_REQUIRED',
        freeChatsUsed: currentUser.freeChatsUsed || 0,
        contactUnlocks: currentUser.contactUnlocks || 0,
      });
    }

    // Decrement unlock if using unlock credits on non-subscribed plan
    if (!isSubscribed && !hasFreeChats && hasUnlocks) {
      if (currentUser.contactUnlocks > 0) currentUser.contactUnlocks -= 1;
      if (currentUser.subscription?.contactUnlocks > 0) currentUser.subscription.contactUnlocks -= 1;
      currentUser.unlocksUsed = (currentUser.unlocksUsed || 0) + 1;
      await currentUser.save();
    }
  }

  const conversationId = `${[senderId, actualRecipientId].sort().join('_')}`;

  return res.status(200).json({
    success: true,
    message: 'Conversation initiated successfully',
    data: {
      conversationId,
      recipientId: actualRecipientId,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      recipientAvatar: recipient.avatar,
    },
    conversationId,
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
  const usedCount = currentUser.freeChatsUsed || 0;
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
