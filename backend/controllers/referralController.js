// ============================================================
// controllers/referralController.js
// MentorNearby Refer & Earn Coins Engine
// Real Database Tracking • Idempotent 100-Coin Rewarding
// ============================================================

const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const Referral = require('../models/Referral');

/**
 * Generates a clean, unique MentorNearby referral code (e.g. MN-7X9K2A)
 */
const generateUniqueReferralCode = async (userName = '') => {
  const prefix = 'MN-';
  let cleanName = (userName || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  if (cleanName.length < 2) cleanName = 'REF';

  let code;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `${prefix}${cleanName}${randomHex.slice(0, 4)}`;
    const existing = await User.findOne({ referralCode: code });
    if (!existing) isUnique = true;
    attempts++;
  }

  return code || `${prefix}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// @desc    Get authenticated user's real referral stats, link, code & earnings
// @route   GET /api/referrals/my-stats
// @access  Private
exports.getMyReferralStats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  let user = await User.findById(userId);

  if (!user) {
    return error(res, 'User not found', 404);
  }

  // Ensure user has a persistent unique referral code
  if (!user.referralCode) {
    user.referralCode = await generateUniqueReferralCode(user.name);
    await user.save();
  }

  // Fetch real referrals from MongoDB
  const rawReferrals = await Referral.find({ referrer: user._id })
    .populate('referredUser', 'name avatar email role isVerified createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Dynamically sync status with live tutor verification state
  const enrichedReferrals = await Promise.all(
    rawReferrals
      .filter((r) => r.referredUser) // Filter out deleted accounts
      .map(async (ref) => {
        const refUser = ref.referredUser;
        let isTutorVerified = Boolean(refUser.isVerified);

        if (refUser.role === 'TUTOR') {
          const tp = await TutorProfile.findOne({ user: refUser._id }).select('isVerified kycStatus').lean();
          if (tp && (tp.isVerified || tp.kycStatus === 'VERIFIED')) {
            isTutorVerified = true;
          }
        }

        // Determine human-readable status & step progression
        let displayStatus = 'Joined';
        let step = 1; // 1: Joined, 2: Verified, 3: Premium Purchased, 4: Rewarded

        if (ref.status === 'REWARDED') {
          displayStatus = '100 Coins Credited';
          step = 4;
        } else if (ref.status === 'PREMIUM_PURCHASED') {
          displayStatus = 'Premium Purchased';
          step = 3;
        } else if (isTutorVerified || ref.status === 'VERIFIED') {
          displayStatus = 'Verified';
          step = 2;
        }

        return {
          _id: ref._id,
          user: {
            _id: refUser._id,
            name: refUser.name || 'Tutor Member',
            avatar: refUser.avatar || '',
            role: refUser.role || 'TUTOR',
            isVerified: isTutorVerified,
          },
          status: ref.status,
          displayStatus,
          step,
          coinsRewarded: ref.coinsRewarded || (ref.status === 'REWARDED' ? 100 : 0),
          planPurchased: ref.planPurchased || '',
          rewardedAt: ref.rewardedAt,
          createdAt: ref.createdAt,
        };
      })
  );

  const totalReferrals = enrichedReferrals.length;
  const verifiedReferrals = enrichedReferrals.filter((r) => r.step >= 2).length;
  const premiumPurchased = enrichedReferrals.filter((r) => r.step >= 3).length;
  const rewardedCount = enrichedReferrals.filter((r) => r.step === 4).length;

  // Real Coin Totals
  const totalCoinsEarned = rewardedCount * 100;
  const availableCoins = user.coins || totalCoinsEarned;
  // Pending coins = 100 coins for every joined/verified tutor who hasn't completed premium purchase yet
  const pendingCoins = (totalReferrals - rewardedCount) * 100;

  const referralCode = user.referralCode;
  const baseUrl = process.env.CLIENT_URL || 'https://mentornearby.com';
  const referralLink = `${baseUrl}/register?role=TUTOR&ref=${referralCode}`;

  return success(res, 'Referral stats retrieved successfully', {
    referralCode,
    referralLink,
    wallet: {
      totalCoinsEarned,
      pendingCoins,
      availableCoins,
    },
    statistics: {
      totalReferrals,
      verifiedReferrals,
      premiumPurchased,
      coinsEarned: totalCoinsEarned,
    },
    referrals: enrichedReferrals,
  });
});

/**
 * Helper: Processes and credits 100 Coins when a referred user buys a qualifying Premium plan
 * Idempotent: Can safely be called on subscription purchase/webhook
 */
exports.processReferralReward = async (purchaserUserId, planDetails = {}, paymentDetails = {}) => {
  try {
    const purchaser = await User.findById(purchaserUserId);
    if (!purchaser || !purchaser.referredBy) return null;

    const referrerId = purchaser.referredBy;

    // Prevent self-referral
    if (String(referrerId) === String(purchaser._id)) return null;

    // Find referral record
    const referral = await Referral.findOne({
      referrer: referrerId,
      referredUser: purchaser._id,
    });

    if (!referral) return null;

    // If already rewarded, return to maintain idempotency
    if (referral.status === 'REWARDED' || referral.coinsRewarded >= 100) {
      return referral;
    }

    // Credit 100 Coins to Referrer's Wallet
    const referrer = await User.findById(referrerId);
    if (referrer) {
      referrer.coins = (referrer.coins || 0) + 100;
      referrer.totalCoinsEarned = (referrer.totalCoinsEarned || 0) + 100;
      await referrer.save();

      // Update Referral record
      referral.status = 'REWARDED';
      referral.coinsRewarded = 100;
      referral.rewardedAt = new Date();
      referral.planPurchased = planDetails.label || planDetails.planType || 'Premium Plan';
      referral.orderId = paymentDetails.orderId || '';
      referral.paymentId = paymentDetails.paymentId || '';
      await referral.save();

      // Create in-app notification for referrer
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          user: referrer._id,
          title: '🪙 100 Coins Credited to your Wallet!',
          message: `Congratulations! Your referred tutor ${purchaser.name} purchased a Premium plan. 100 MentorNearby Coins have been added to your wallet.`,
          type: 'REWARD',
          link: '/refer-and-earn',
        });
      } catch (_) {}

      return referral;
    }
  } catch (err) {
    console.error('[REFERRAL REWARD PROCESS ERROR]:', err);
    return null;
  }
};
