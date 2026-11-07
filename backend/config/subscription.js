// ============================================================
// config/subscription.js
// MentorNearby All Access — Single Source of Truth
// Exactly ONE active subscription plan: ₹199/month recurring AutoPay
// ============================================================

const UNIFIED_PLAN = {
  id: 'all_access_monthly',
  name: 'MentorNearby All Access',
  tagline: 'Unlock All Tutors, Students & Study Resources',
  amount: 199, // in INR
  amountInPaise: 19900, // in paise (₹199 × 100)
  currency: 'INR',
  interval: 'monthly', // Razorpay recurring interval
  period: 'monthly',
  billingCycle: 'monthly',
  intervalCount: 1, // Every 1 month
  billingCycleDays: 30,
  isActive: true,
  isRecurring: true,
  autoPayEnabled: true,

  // Tutor Benefits
  tutorBenefits: [
    'Tutor profile management',
    'Student enquiries & lead management',
    'Priority tutor visibility in search',
    'Featured listing placement',
    'Demo class booking',
    'Student direct messaging',
    'Contact sharing with consent',
    'Profile analytics & views',
    'Booking management',
    'Tutor dashboard premium features',
    'Verification status display',
    'Unlimited contact unlocks',
  ],

  // Student Benefits
  studentBenefits: [
    'Tutor discovery within 5km',
    'Unlimited tutor enquiries',
    'Demo class requests',
    'Direct messaging with tutors',
    'Contact sharing with consent',
    'Tutor booking management',
    'Student dashboard premium features',
    'Access to available study resources',
    'Notes library access',
    'Formula sheets library access',
    'Study material downloads',
    'Unlimited tutor contact unlocks',
  ],

  autoPayDisclosure:
    'By proceeding, you authorize an automatic recurring monthly payment of ₹199 via Razorpay AutoPay. You can cancel AutoPay anytime with 1 click from your dashboard, retaining full All Access benefits until your current billing cycle ends.',
};

/**
 * Standard phone number masking for privacy.
 * Mask format: +91 XXXXXXX123 (preserves country code prefix and last 3 digits)
 * @param {string} phone
 * @returns {string}
 */
const maskPhoneNumber = (phone) => {
  if (!phone) return '+91 XXXXXXX123';
  const cleanDigits = String(phone).replace(/\D/g, '');
  if (cleanDigits.length >= 3) {
    const last3 = cleanDigits.slice(-3);
    return `+91 XXXXXXX${last3}`;
  }
  return '+91 XXXXXXX123';
};

/**
 * Check whether a user or document has an active, unexpired MentorNearby All Access subscription.
 * Admins always have access.
 * @param {Object} userDoc
 * @returns {boolean}
 */
const hasActiveSubscription = (userDoc) => {
  if (!userDoc) return false;
  const role = (userDoc.role || '').toString().trim().toUpperCase();
  if (role === 'ADMIN') return true;

  const now = new Date();
  if (userDoc.isSubscribed && userDoc.subscriptionExpiry && new Date(userDoc.subscriptionExpiry) > now) {
    return true;
  }

  // Handle nested subscription object if present
  if (
    userDoc.subscription?.isActive &&
    userDoc.subscription?.expiry &&
    new Date(userDoc.subscription.expiry) > now
  ) {
    return true;
  }

  return false;
};

module.exports = {
  UNIFIED_PLAN,
  getPlan: () => UNIFIED_PLAN,
  maskPhoneNumber,
  hasActiveSubscription,
};
