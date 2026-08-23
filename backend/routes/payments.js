// ============================================================
// routes/payments.js
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Payment routes are handled through contact-unlocks
// This router handles admin payment reporting

router.use(protect);

// Admin: payment history and revenue
router.get('/admin/transactions', authorize('ADMIN'), async (req, res, next) => {
  try {
    const ContactUnlock = require('../models/ContactUnlock');
    const { page = 1, limit = 20, status, type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const [transactions, total, revenue] = await Promise.all([
      ContactUnlock.find(query)
        .populate('user', 'name email')
        .populate('tutorProfile', 'user')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ContactUnlock.countDocuments(query),
      ContactUnlock.aggregate([
        { $match: { status: 'COMPLETED', type: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const { success } = require('../utils/apiResponse');
    success(res, 'Transactions retrieved', {
      transactions: transactions.map(t => ({
        id: t._id,
        user: t.user,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        razorpayOrderId: t.razorpayOrderId,
        razorpayPaymentId: t.razorpayPaymentId,
        // Never return razorpaySignature
        unlockedAt: t.unlockedAt,
        createdAt: t.createdAt,
      })),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
