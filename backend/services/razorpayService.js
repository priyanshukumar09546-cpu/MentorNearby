// ============================================================
// services/razorpayService.js
// Razorpay integration — server-side order creation & verification
// SECURITY: Never trust amount/status from frontend.
//           Always verify signature server-side.
// ============================================================

const crypto = require('crypto');

// Only initialize Razorpay if credentials are available
let razorpay = null;
const RAZORPAY_CONFIGURED =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes('your_');

if (RAZORPAY_CONFIGURED) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay configured (mode:', process.env.RAZORPAY_KEY_ID.startsWith('rzp_live_') ? 'LIVE' : 'TEST', ')');
} else {
  console.warn('⚠️  [DEV STUB] Razorpay not configured. Payment flow will use stub mode.');
}

/**
 * Create a Razorpay order server-side
 * Amount is in paise (INR × 100) and ALWAYS determined by server
 * @param {number} amountInRupees - Amount in INR (server-determined)
 * @param {string} currency - Currency code (default: INR)
 * @param {Object} notes - Additional metadata (non-sensitive only)
 * @returns {Object} Razorpay order object
 */
const createOrder = async (amountInRupees, currency = 'INR', notes = {}) => {
  // Amount is ALWAYS determined server-side — never trust frontend amount
  const amountInPaise = Math.round(amountInRupees * 100);

  if (!RAZORPAY_CONFIGURED) {
    // Dev stub mode — return a mock order
    console.log(`\n💳 [RAZORPAY STUB] Would create order: ₹${amountInRupees}`);
    return {
      id: `stub_order_${Date.now()}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt: `stub_receipt_${Date.now()}`,
      status: 'created',
      notes,
      created_at: Math.floor(Date.now() / 1000),
      _stub: true,
    };
  }

  const orderData = {
    amount: amountInPaise,
    currency,
    receipt: `tnearby_${Date.now()}`,
    notes: {
      ...notes,
      platform: 'TutorNearby',
    },
    payment_capture: 1, // Auto-capture
  };

  return await razorpay.orders.create(orderData);
};

/**
 * Verify Razorpay payment signature
 * MUST be called server-side before crediting any unlock/service
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID (from client callback)
 * @param {string} signature - Razorpay signature (from client callback)
 * @returns {boolean} true if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!RAZORPAY_CONFIGURED) {
    // In stub mode — accept stub payment IDs only in development
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY: Razorpay not configured in production. Rejecting payment.');
      return false;
    }
    // Only allow stubs in development with explicit stub flag
    if (orderId.startsWith('stub_order_') && paymentId.startsWith('stub_payment_')) {
      console.warn('⚠️  [DEV STUB] Accepting stub payment. DO NOT USE IN PRODUCTION.');
      return true;
    }
    return false;
  }

  // Verify signature using HMAC-SHA256
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * Fetch payment details from Razorpay to verify status
 * Additional server-side verification step
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Object} Payment details
 */
const fetchPayment = async (paymentId) => {
  if (!RAZORPAY_CONFIGURED) {
    if (paymentId.startsWith('stub_payment_')) {
      return {
        id: paymentId,
        status: 'captured',
        amount: 4900, // ₹49 in paise
        currency: 'INR',
        _stub: true,
      };
    }
    throw new Error('Razorpay not configured');
  }

  return await razorpay.payments.fetch(paymentId);
};

/**
 * Fetch order details from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Object} Order details
 */
const fetchOrder = async (orderId) => {
  if (!RAZORPAY_CONFIGURED) {
    if (orderId.startsWith('stub_order_')) {
      return {
        id: orderId,
        status: 'paid',
        _stub: true,
      };
    }
    throw new Error('Razorpay not configured');
  }

  return await razorpay.orders.fetch(orderId);
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrder,
  isConfigured: RAZORPAY_CONFIGURED,
};
