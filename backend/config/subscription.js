// ============================================================
// config/subscription.js
// MentorNearby All Access — Single Source of Truth
// Exactly ONE active subscription plan: ₹199/month recurring
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
};

module.exports = {
  UNIFIED_PLAN,
  // Helper to ensure backward compatibility while enforcing ₹199 plan
  getPlan: () => UNIFIED_PLAN,
};
