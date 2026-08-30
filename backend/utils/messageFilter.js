// ============================================================
// utils/messageFilter.js
// Context-Aware Anti-Bypass Contact Detection & Leak-Proof Filter
// Permits educational content (Maths, Chemistry, Class 10, ₹500/hr)
// Strictly blocks phone numbers, emails, WhatsApp IDs, and contact leaks
// ============================================================

/**
 * Normalizes text to catch leet-speak and symbol-injected bypasses
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[\$]/g, 's')
    .replace(/[!|]/g, 'i')
    .replace(/[()]/g, '')
    .trim();
};

/**
 * Extracts pure consecutive or spaced digit sequences from text
 */
const extractDigitSequences = (text) => {
  // Remove currency signs, class/grade indicators, percentages, and math expressions first
  let cleaned = text
    .replace(/₹\s*\d+/g, '')
    .replace(/rs\.?\s*\d+/gi, '')
    .replace(/inr\s*\d+/gi, '')
    .replace(/\bclass\s*\d+/gi, '')
    .replace(/\bgrade\s*\d+/gi, '')
    .replace(/\bchapter\s*\d+/gi, '')
    .replace(/\bpage\s*\d+/gi, '')
    .replace(/\bexercise\s*\d+(\.\d+)?/gi, '')
    .replace(/\bquestion\s*\d+/gi, '')
    .replace(/\d+\s*%/g, '')
    .replace(/\d+\s*\/\s*\d+/g, '') // e.g. 80/100
    .replace(/\b\d{1,2}(st|nd|rd|th)\b/gi, ''); // e.g. 15th

  // Find all sequences of digits that might be spaced/punct-separated
  // e.g. "98765 43210", "98765-43210", "9 8 7 6 5 4 3 2 1 0"
  const potentialNumberMatches = cleaned.match(/(?:\+?\d[\d\s\-_.,;]{6,}\d)/g);
  if (!potentialNumberMatches) return [];

  return potentialNumberMatches.map((m) => m.replace(/\D/g, '')).filter((digits) => digits.length >= 7);
};

/**
 * Checks for spelled out number sequences (e.g. "nine eight seven six five four...")
 */
const containsSpelledOutPhone = (text) => {
  const lower = text.toLowerCase();
  const enDigits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const hiDigits = ['shunya', 'ek', 'do', 'teen', 'tin', 'char', 'chaar', 'paanch', 'panch', 'cheh', 'chheh', 'saat', 'sath', 'aath', 'ath', 'nau'];

  const allDigitWords = new Set([...enDigits, ...hiDigits]);
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);

  let consecutiveDigitWords = 0;
  for (const w of words) {
    if (allDigitWords.has(w)) {
      consecutiveDigitWords++;
      if (consecutiveDigitWords >= 6) return true;
    } else {
      consecutiveDigitWords = 0;
    }
  }
  return false;
};

/**
 * Checks if message contains prohibited contact sharing
 * @param {string} text
 * @returns {boolean} true if contact sharing is detected
 */
const hasContactInfo = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) return false;
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const normalized = normalizeText(raw);

  // 1. Check for valid Email addresses (standard or obfuscated)
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const obfuscatedEmailRegex = /\b[A-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|at)\s*[A-Z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|dot)\s*(?:com|in|org|net|co|io|edu|gov)\b/i;
  if (emailRegex.test(raw) || obfuscatedEmailRegex.test(lower)) {
    return true;
  }

  // 2. Check for Phone numbers (Indian 10-digit / international 7-15 digits)
  const digitSequences = extractDigitSequences(raw);
  for (const seq of digitSequences) {
    // 10-digit Indian mobile format (starting with 6, 7, 8, 9)
    if (/^[6-9]\d{9}$/.test(seq)) return true;
    // 12-digit with country code +91
    if (/^91[6-9]\d{9}$/.test(seq)) return true;
    // 11-digit with leading 0
    if (/^0[6-9]\d{9}$/.test(seq)) return true;
    // Generic long digit sequence (>= 8 digits)
    if (seq.length >= 8) return true;
  }

  // 3. Spelled out phone numbers
  if (containsSpelledOutPhone(raw)) {
    return true;
  }

  // 4. Social media bypass handles & direct contact requests
  const contactKeywords = [
    'whatsapp', 'watsapp', 'whatsap', 'whatapp',
    'telegram', 'telegrame',
    'instagram', 'insta id', 'snapchat', 'snap id',
    'call me at', 'contact me at', 'my phone is', 'my number is',
    'my mobile is', 'ping me on wa', 'msg on whatsapp', 'dm on insta',
    'connect on telegram', 'share your number', 'send your number',
    'give me your number', 'call on this no', 'whats app me'
  ];

  for (const kw of contactKeywords) {
    if (lower.includes(kw) || normalized.includes(kw)) {
      // Check if it's accompanied by any numbers or handles
      const hasFollowUp = /\d/.test(raw) || /@\w+/.test(raw) || containsSpelledOutPhone(raw) || /(num|no|mob|wa|tg)/i.test(lower);
      if (hasFollowUp || kw.includes('at') || kw.includes('is') || kw.includes('on')) {
        return true;
      }
    }
  }

  // 5. External URLs sharing contact links (wa.me, t.me, etc.)
  const externalLinkRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:wa\.me|t\.me|chat\.whatsapp\.com|instagram\.com|facebook\.com)\/[A-Za-z0-9_.-]+/i;
  if (externalLinkRegex.test(raw)) {
    return true;
  }

  return false;
};

/**
 * Sanitizes prohibited text for safe preview
 */
const filterMessage = (text) => {
  if (!hasContactInfo(text)) return text;
  return '[Contact details hidden for security. Please use Contact Unlock to get direct contact info.]';
};

module.exports = {
  hasContactInfo,
  filterMessage,
};
