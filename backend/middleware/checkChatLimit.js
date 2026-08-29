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

    // ── STUDENT / PARENT: 3 free chats ────────────────────────
    if (role === 'STUDENT' || role === 'PARENT') {
      if (user.freeChatsUsed >= 3) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: 99,
          planType: 'student',
          message: '3 free chats khatam! ₹99/month subscription lo unlimited chats ke liye.',
          freeChatsUsed: user.freeChatsUsed,
          freeChatsLimit: 3,
        });
      }
      // Increment counter
      await User.findByIdAndUpdate(userId, { $inc: { freeChatsUsed: 1 } });
      req.user.freeChatsUsed = user.freeChatsUsed + 1;
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
            message: '5 free leads khatam! ₹149/month subscription lo unlimited leads ke liye.',
            freeLeadsUsed: user.freeLeadsUsed,
            freeLeadsLimit: 5,
          });
        }
        await User.findByIdAndUpdate(userId, { $inc: { freeLeadsUsed: 1 } });
        req.user.freeLeadsUsed = user.freeLeadsUsed + 1;
        return next();
      }
      // Tutor sending a chat message — use chat counter too
      if (user.freeChatsUsed >= 5) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: 149,
          planType: 'teacher',
          message: '5 free chats khatam! ₹149/month subscription lo unlimited access ke liye.',
          freeChatsUsed: user.freeChatsUsed,
          freeChatsLimit: 5,
        });
      }
      await User.findByIdAndUpdate(userId, { $inc: { freeChatsUsed: 1 } });
      req.user.freeChatsUsed = user.freeChatsUsed + 1;
      return next();
    }

    // Fallback: allow
    return next();
  });

module.exports = checkChatLimit;
