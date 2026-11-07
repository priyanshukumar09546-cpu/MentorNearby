// ============================================================
// middleware/checkChatLimit.js
// Communication gate: Unlocks & messaging powered by MentorNearby All Access (₹199/month)
// ============================================================

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { UNIFIED_PLAN, hasActiveSubscription } = require('../config/subscription');

/**
 * Middleware factory — check chat / lead engagement permissions
 * @param {'chat'|'lead'} type
 */
const checkChatLimit = (type = 'chat') =>
  asyncHandler(async (req, res, next) => {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Active All Access subscribers always pass through
    if (hasActiveSubscription(user)) {
      return next();
    }

    const role = (user.role || '').toUpperCase(); // 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN'

    // ── ADMIN: always allowed ──────────────────────────────────
    if (role === 'ADMIN') return next();

    const Message = require('../models/Message');
    const TutorProfile = require('../models/TutorProfile');
    let rawReceiverId = req.params.userId || req.body.recipientId || req.body.receiverId || req.body.userId;

    let receiverUserObjId = null;
    if (rawReceiverId && mongoose.Types.ObjectId.isValid(rawReceiverId)) {
      const isUser = await User.exists({ _id: rawReceiverId });
      if (isUser) {
        receiverUserObjId = new mongoose.Types.ObjectId(String(rawReceiverId));
      } else {
        const tp = await TutorProfile.findById(rawReceiverId);
        if (tp && tp.user) {
          receiverUserObjId = new mongoose.Types.ObjectId(String(tp.user));
        }
      }
    }

    const senderUserObjId = new mongoose.Types.ObjectId(String(userId));

    // If conversation already exists between these 2 users, allow continuing
    if (receiverUserObjId) {
      const hasExistingHistory = await Message.exists({
        $or: [
          { sender: senderUserObjId, receiver: receiverUserObjId },
          { sender: receiverUserObjId, receiver: senderUserObjId },
        ],
      });
      if (hasExistingHistory) {
        return next();
      }
    }

    // ── STUDENT / PARENT: Limit reached prompt ─────────────────
    if (role === 'STUDENT' || role === 'PARENT') {
      const distinctPartners = await Message.distinct('receiver', { sender: senderUserObjId });
      if (distinctPartners.length >= 3) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: UNIFIED_PLAN.amount,
          planName: UNIFIED_PLAN.name,
          planType: UNIFIED_PLAN.id,
          message: 'Subscribe to MentorNearby All Access for ₹199/month for unlimited direct tutor conversations & contact reveals.',
          freeChatsUsed: distinctPartners.length,
          freeChatsLimit: 3,
        });
      }
      return next();
    }

    // ── TUTOR: Lead / messaging engagement ──────────────────────
    if (role === 'TUTOR') {
      if (type === 'lead') {
        if (user.freeLeadsUsed >= 5) {
          return res.status(403).json({
            success: false,
            paywall: true,
            plan: UNIFIED_PLAN.amount,
            planName: UNIFIED_PLAN.name,
            planType: UNIFIED_PLAN.id,
            message: 'Subscribe to MentorNearby All Access for ₹199/month for unlimited student leads and contact reveals.',
            freeLeadsUsed: user.freeLeadsUsed,
            freeLeadsLimit: 5,
          });
        }
        await User.findByIdAndUpdate(userId, { $inc: { freeLeadsUsed: 1 } });
        req.user.freeLeadsUsed = (user.freeLeadsUsed || 0) + 1;
        return next();
      }

      // Tutor sending chat message to a student
      const distinctPartners = await Message.distinct('receiver', { sender: senderUserObjId });
      if (distinctPartners.length >= 10) {
        return res.status(403).json({
          success: false,
          paywall: true,
          plan: UNIFIED_PLAN.amount,
          planName: UNIFIED_PLAN.name,
          planType: UNIFIED_PLAN.id,
          message: 'Subscribe to MentorNearby All Access for ₹199/month for unlimited direct student messaging & leads.',
          freeChatsUsed: distinctPartners.length,
          freeChatsLimit: 10,
        });
      }
      return next();
    }

    return next();
  });

module.exports = checkChatLimit;
