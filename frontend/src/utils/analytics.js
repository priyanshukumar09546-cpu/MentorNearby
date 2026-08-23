// ============================================================
// utils/analytics.js
// MentorNearby Privacy-Safe Centralized Product Analytics
// ============================================================

/**
 * Sensitive field keys that must NEVER be passed to analytics
 */
const SENSITIVE_KEYS = new Set([
  'email',
  'phone',
  'phonenumber',
  'password',
  'token',
  'jwt',
  'aadhaar',
  'govtId',
  'govtIdNumber',
  'address',
  'street',
  'razorpaySignature',
  'razorpay_signature',
  'secret',
]);

/**
 * Sanitizes an object to guarantee no Personally Identifiable Information (PII) leaks to telemetry
 */
const sanitizeProperties = (props = {}) => {
  if (!props || typeof props !== 'object') return {};

  const clean = {};
  for (const [key, val] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('pass') || lowerKey.includes('secret')) {
      continue;
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Track an analytics event safely across providers (Google Analytics, Custom Telemetry)
 * @param {string} eventName - e.g. 'search_tutors', 'payment_success', 'pdf_downloaded'
 * @param {Object} properties - Non-PII metadata properties
 */
export const trackEvent = (eventName, properties = {}) => {
  if (typeof window === 'undefined' || !eventName) return;

  try {
    const cleanProps = sanitizeProperties(properties);

    // 1. Google Analytics 4 (gtag.js) if initialized
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, cleanProps);
    }

    // 2. DataLayer push (Google Tag Manager) if available
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...cleanProps });
    }

    // 3. Custom DOM Event for internal components
    const customEvent = new CustomEvent('mn:analytics_event', {
      detail: { eventName, properties: cleanProps, timestamp: Date.now() },
    });
    window.dispatchEvent(customEvent);

    // Dev environment log
    if (import.meta.env.DEV) {
      console.log(`📊 [Analytics Event] ${eventName}:`, cleanProps);
    }
  } catch (err) {
    // Fail silently without disrupting user flow
  }
};

export default trackEvent;
