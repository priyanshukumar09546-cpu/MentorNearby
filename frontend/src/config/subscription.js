// ============================================================
// config/subscription.js
// MentorNearby All Access — Unified Plan Configuration
// Exactly ONE active subscription plan: ₹199/month recurring
// ============================================================

export const UNIFIED_PLAN = {
  id: 'all_access_monthly',
  name: 'MentorNearby All Access',
  tagline: 'Unlock All Tutors, Students & Study Resources',
  amount: 199,
  amountInPaise: 19900,
  currency: 'INR',
  interval: 'monthly',
  period: 'monthly',
  intervalCount: 1,
  billingCycleDays: 30,
  isActive: true,
  isRecurring: true,
  autoPayEnabled: true,

  // Tutor Benefits
  tutorBenefits: [
    'Tutor profile management & priority discovery',
    'Unlimited student enquiries & lead unlocks',
    'Priority tutor visibility in search results',
    'Featured listing badge & placement boost',
    'Demo class booking & schedule management',
    'Student direct messaging & live chat',
    'Direct contact details sharing with consent',
    'Profile analytics, search appearances & visitor stats',
    'Instant WhatsApp connect with prospective students',
    'Tutor dashboard premium controls',
    'Verification status & trust badge display',
    '100% Zero commission on student fees',
  ],

  // Student Benefits
  studentBenefits: [
    'Tutor discovery within 5km radius & verified filters',
    'Unlimited tutor contact unlocks (Phone & WhatsApp)',
    'Direct instant chat & calling with tutors',
    'Demo class requests & free trial bookings',
    'Full access to all chapter-wise study notes',
    'Full access to formula sheets & cheat sheets',
    'Download study materials without restrictions',
    'Student dashboard premium tracker & bookmarks',
    'Tutor comparison & personalized recommendations',
    'Priority student support team assistance',
    '100% Free student registration always preserved',
  ],

  autoPayDisclosure:
    'By proceeding, you agree to set up an automatic recurring payment of ₹199/month via Razorpay AutoPay. You can cancel anytime from your dashboard with zero penalty, and your benefits will continue until the end of your paid billing period.',
};

export default UNIFIED_PLAN;
