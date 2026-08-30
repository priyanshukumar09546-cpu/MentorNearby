// ============================================================
// middleware/checkChatLimit.js
// Freemium gate: 3 free chats for students, 5 free leads for tutors
// ============================================================

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: check if subscription is still active
 */
const isActiveSubscriber = (user) => {
  if (!user.isSubscribed) return false;
  if (!user.subscriptionExpiry) return false;
  return new Date(user.subscriptionExpiry) > new Date();
};

/**
 * Middleware factory — call as checkChatLimit('chat') or checkChatLimit('lead')
 * @param {'chat'|'lead'} type
 */
const checkChatLimit = (type = 'chat') =>
  asyncHandler(async (req, res, next) => {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Subscribers always pass through
    if (isActiveSubscriber(user)) {
      return next();
    }

    const role = user.role; // 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN'

    // ── ADMIN: always allowed ──────────────────────────────────
    if (role === 'ADMIN') return next();

    const Message = require('../models/Message');
    const receiverId = req.params.userId || req.body.recipientId || req.body.receiverId || req.body.userId;

    // If already in conversation with this person, allow communication
    if (receiverId) {
      const hasExistingHistory = await Message.exists({
        $or: [
          { sender: userId, receiver: receiverId },
          { sender: receiverId, receiver: userId },
        ],
      });
      if (hasExistingHistory) {
        return next();
      }
    }

    // ── STUDENT / PARENT: 3 free conversations ────────────────────────
    if (role === 'STUDENT' || role === 'PARENT') {
      const distinctPartners = await Message.distinct('receiver', { sender: userId });
      if (distinctPartners.length >= 3) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: 99,
          planType: 'student',
          message: 'You have reached your 3 free tutor conversations limit. Upgrade your plan for unlimited chats.',
          freeChatsUsed: distinctPartners.length,
          freeChatsLimit: 3,
        });
      }
      return next();
    }

    // ── TUTOR: 5 free leads ────────────────────────────────────
    if (role === 'TUTOR') {
      if (type === 'lead') {
        if (user.freeLeadsUsed >= 5) {
          return res.status(403).json({
            success: false,
            paywall: true,
            plan: 149,
            planType: 'teacher',
            message: '5 free leads limit reached. Upgrade to Pro for unlimited student leads.',
            freeLeadsUsed: user.freeLeadsUsed,
            freeLeadsLimit: 5,
          });
        }
        await User.findByIdAndUpdate(userId, { $inc: { freeLeadsUsed: 1 } });
        req.user.freeLeadsUsed = (user.freeLeadsUsed || 0) + 1;
        return next();
      }

      // Tutor sending chat message to a student
      const distinctPartners = await Message.distinct('receiver', { sender: userId });
      if (distinctPartners.length >= 10) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: 149,
          planType: 'teacher',
          message: 'Free chat limit reached. Upgrade to Pro for unlimited student connections.',
          freeChatsUsed: distinctPartners.length,
          freeChatsLimit: 10,
        });
      }
      return next();
    }

    // Fallback: allow
    return next();
  });

module.exports = checkChatLimit;
