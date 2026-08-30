// ============================================================
// controllers/chatController.js
// Chat with freemium limits + message filtering + robust ObjectIds
// ============================================================

const mongoose = require('mongoose');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const { filterMessage, hasContactInfo } = require('../utils/messageFilter');
const { sendLeadWhatsAppAlert } = require('../services/whatsappService');

// ── Helper: check if subscription is still active ─────────
const isActiveSubscriber = (user) => {
  if (!user.isSubscribed) return false;
  if (!user.subscriptionExpiry) return false;
  return new Date(user.subscriptionExpiry) > new Date();
};

// @desc    Send a message (filtered, with freemium gate & spam protection)
// @route   POST /api/chat/:userId
// @access  Private (limit enforced by checkChatLimit middleware in route)
exports.sendMessage = asyncHandler(async (req, res, next) => {
  let receiverId = req.params.userId;
  const senderId = req.user._id || req.user.id;
  const { content, text } = req.body;
  const rawContent = (content || text || '').trim();

  if (!rawContent) {
    return error(res, 'Please provide message content', 400);
  }

  let receiver = null;
  if (mongoose.Types.ObjectId.isValid(receiverId)) {
    receiver = await User.findById(receiverId);
    if (!receiver) {
      const tutorProfile = await TutorProfile.findById(receiverId);
      if (tutorProfile && tutorProfile.user) {
        receiver = await User.findById(tutorProfile.user);
      }
    }
  }

  if (!receiver) {
    const tutorProfile = await TutorProfile.findOne({
      $or: [{ slug: receiverId }, { user: receiverId }],
    });
    if (tutorProfile && tutorProfile.user) {
      receiver = await User.findById(tutorProfile.user);
    }
  }

  if (!receiver) {
    return error(res, 'Receiver not found', 404);
  }

  const actualSenderId = new mongoose.Types.ObjectId(String(senderId));
  const actualReceiverId = new mongoose.Types.ObjectId(String(receiver._id));

  if (String(actualSenderId) === String(actualReceiverId)) {
    return error(res, 'You cannot send a message to yourself', 400);
  }

  // ── Anti-Bypass Check: Reject phone numbers, emails, and word numbers ──
  if (hasContactInfo(rawContent)) {
    const { SECURITY_BLOCKED_MESSAGE } = require('../utils/messageFilter');
    return error(
      res,
      SECURITY_BLOCKED_MESSAGE || "🔒 For your safety, contact details and social-media information can't be shared in MentorNearby chat. Please keep communication within MentorNearby.",
      400,
      'CONTACT_SHARING_BLOCKED'
    );
  }

  // ── Spam Control 1: Rate limit 1 message per second ──────
  const oneSecondAgo = new Date(Date.now() - 1000);
  const lastMessage = await Message.findOne({
    sender: actualSenderId,
    createdAt: { $gte: oneSecondAgo },
  }).sort({ createdAt: -1 });

  if (lastMessage) {
    return error(res, 'Please wait a moment before sending another message.', 429, 'RATE_LIMITED');
  }

  // ── Spam Control 2: Prevent rapid identical duplicate spam within 3s ───
  const threeSecondsAgo = new Date(Date.now() - 3000);
  const recentDuplicate = await Message.findOne({
    sender: actualSenderId,
    receiver: actualReceiverId,
    content: rawContent,
    createdAt: { $gte: threeSecondsAgo },
  });

  if (recentDuplicate) {
    return error(res, 'Please do not repeat the exact same message so quickly.', 400, 'DUPLICATE_MESSAGE');
  }

  // Filter message content before saving
  const filteredContent = filterMessage(rawContent);

  const message = await Message.create({
    sender: actualSenderId,
    receiver: actualReceiverId,
    content: filteredContent,
    originalBlocked: filteredContent !== (content || '').trim(),
  });

  // ── Guaranteed In-App Notification Creation ──
  try {
    const convId = [String(actualSenderId), String(actualReceiverId)].sort().join('_');
    await Notification.create({
      user: actualReceiverId,
      recipient: actualReceiverId,
      sender: actualSenderId,
      title: `New message from ${req.user.name}`,
      message: filteredContent || 'Sent you a new message',
      conversationId: convId,
      type: 'MESSAGE',
      actionUrl: `/messages?user=${actualSenderId}&chat=${convId}&recipient=${actualSenderId}`,
      actionText: 'Reply in Chat',
      isRead: false,
      status: 'DELIVERED',
      sentAt: new Date(),
    });
  } catch (notifErr) {
    console.error('Error creating notification on chat:', notifErr);
  }

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
    data: message,
    wasFiltered: filteredContent !== (content || '').trim(),
    freeChatsUsed: req.user.freeChatsUsed,
    isSubscribed: isActiveSubscriber(req.user),
  }, 201);
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  let otherUserId = req.params.userId;
  const currentUserId = req.user._id || req.user.id;

  if (!otherUserId || otherUserId === 'undefined' || otherUserId === 'null') {
    return success(res, 'No user specified', { count: 0, data: [], messages: [] });
  }

  let otherUser = null;
  if (mongoose.Types.ObjectId.isValid(otherUserId)) {
    otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      const tutorProfile = await TutorProfile.findById(otherUserId);
      if (tutorProfile && tutorProfile.user) {
        otherUser = await User.findById(tutorProfile.user);
        if (otherUser) {
          otherUserId = otherUser._id;
        }
      }
    }
  }

  if (!otherUser) {
    const tutorProfile = await TutorProfile.findOne({
      $or: [{ slug: otherUserId }, { user: otherUserId }],
    });
    if (tutorProfile && tutorProfile.user) {
      otherUser = await User.findById(tutorProfile.user);
      if (otherUser) {
        otherUserId = otherUser._id;
      }
    }
  }

  const sId = new mongoose.Types.ObjectId(String(currentUserId));
  const oId = otherUser ? otherUser._id : (mongoose.Types.ObjectId.isValid(otherUserId) ? new mongoose.Types.ObjectId(String(otherUserId)) : null);

  if (!oId) {
    return success(res, 'Messages retrieved', { count: 0, data: [], messages: [] });
  }

  const messages = await Message.find({
    $or: [
      { sender: sId, receiver: oId },
      { sender: oId, receiver: sId },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  // Mark unread messages as read
  await Message.updateMany(
    { sender: oId, receiver: sId, read: false },
    { read: true }
  );

  return success(res, 'Messages retrieved successfully', {
    count: messages.length,
    data: messages,
    messages: messages,
    otherUser: otherUser ? {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar,
      role: otherUser.role,
      isOnline: otherUser.isOnline !== undefined ? otherUser.isOnline : true,
    } : null,
  });
});

// @desc    Get list of conversations (unique users this user has chatted with)
// @route   GET /api/chat
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id || req.user.id;
  const userObjectId = new mongoose.Types.ObjectId(String(currentUserId));

  // Aggregate to find all unique conversation partners
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: userObjectId },
          { receiver: userObjectId },
        ],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userObjectId] },
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
    select: 'name avatar role isOnline lastLogin',
  });

  const result = await Promise.all(
    populated
      .filter((conv) => conv._id)
      .map(async (conv) => {
        const other = conv._id;
        let tutorData = null;
        let studentData = null;

        if (other.role === 'TUTOR') {
          const tp = await TutorProfile.findOne({ user: other._id }).lean();
          if (tp) {
            tutorData = {
              _id: tp._id,
              subjects: tp.subjects,
              experience: tp.experience,
              pricing: tp.pricing,
              location: tp.location,
              averageRating: tp.averageRating || 4.9,
              totalReviews: tp.totalReviews || 0,
              isVerified: Boolean(tp.isVerified || tp.kycStatus === 'VERIFIED'),
              profilePhoto: tp.profilePhoto,
              bio: tp.bio || tp.about || '',
            };
          }
        } else {
          const sp = await StudentProfile.findOne({ user: other._id }).lean();
          if (sp) {
            studentData = {
              _id: sp._id,
              class: sp.studentDetails?.class || sp.grade || 'Class 10',
              board: sp.studentDetails?.board || 'CBSE',
              location: sp.location,
              profilePhoto: sp.profilePhoto,
              about: sp.about || '',
              budget: sp.budget,
              subjects: sp.subjects || [],
            };
          }
        }

        const unreadCount = await Message.countDocuments({
          sender: other._id,
          receiver: userObjectId,
          read: false,
        });

        return {
          otherUser: {
            _id: other._id,
            name: other.name || 'User',
            avatar: other.avatar || tutorData?.profilePhoto?.url || studentData?.profilePhoto?.url || '',
            role: other.role,
            isOnline: other.isOnline !== undefined ? other.isOnline : true,
            isVerified: Boolean(tutorData?.isVerified),
            tutorProfile: tutorData,
            studentProfile: studentData,
          },
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unreadCount,
        };
      })
  );

  return success(res, 'Conversations retrieved successfully', {
    count: result.length,
    data: result,
    conversations: result,
  });
});

// @desc    Get user's chat limit status
// @route   GET /api/chat/my-status
// @access  Private
exports.getMyChatStatus = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const userObjectId = new mongoose.Types.ObjectId(String(user._id));
  const distinctPartners = await Message.distinct('receiver', { sender: userObjectId });

  return success(res, 'Chat status retrieved', {
    freeChatsUsed: distinctPartners.length,
    freeChatsLimit: user.role === 'TUTOR' ? 10 : 3,
    isSubscribed: isActiveSubscriber(user),
    subscriptionExpiry: user.subscriptionExpiry,
  });
});

// @desc    Initiate conversation
// @route   POST /api/chat/initiate
// @access  Private
exports.initiateConversation = asyncHandler(async (req, res, next) => {
  const receiverId = req.params.userId || req.body.recipientId || req.body.receiverId;
  const senderId = req.user._id || req.user.id;

  let receiver = null;
  if (mongoose.Types.ObjectId.isValid(receiverId)) {
    receiver = await User.findById(receiverId);
    if (!receiver) {
      const tp = await TutorProfile.findById(receiverId);
      if (tp && tp.user) receiver = await User.findById(tp.user);
    }
  }

  if (!receiver) {
    return error(res, 'Receiver not found', 404);
  }

  return success(res, 'Conversation initiated successfully', {
    receiver: {
      _id: receiver._id,
      name: receiver.name,
      avatar: receiver.avatar,
      role: receiver.role,
    },
  });
});
