// ============================================================
// utils/chatFilter.js
// Frontend Context-Aware Contact Detection & Message Filter
// Allows educational content (Maths, Physics, Class 10, ₹500/hr)
// Detects phone numbers, emails, WhatsApp handles, and bypasses
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
    .replace(/\d+\s*\/\s*\d+/g, '')
    .replace(/\b\d{1,2}(st|nd|rd|th)\b/gi, '');

  const potentialNumberMatches = cleaned.match(/(?:\+?\d[\d\s\-_.,;]{6,}\d)/g);
  if (!potentialNumberMatches) return [];

  return potentialNumberMatches.map((m) => m.replace(/\D/g, '')).filter((digits) => digits.length >= 7);
};

/**
 * Checks for spelled out number sequences
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
 * Checks if message is allowed to be sent
 * @param {string} text
 * @returns {{ allowed: boolean, reason: string }}
 */
export const canSendMessage = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { allowed: false, reason: 'Message cannot be empty.' };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();
  const normalized = normalizeText(raw);

  // 1. Check for valid Email addresses
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const obfuscatedEmailRegex = /\b[A-Z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|at)\s*[A-Z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|dot)\s*(?:com|in|org|net|co|io|edu|gov)\b/i;
  if (emailRegex.test(raw) || obfuscatedEmailRegex.test(lower)) {
    return {
      allowed: false,
      reason: 'Sharing email addresses is not permitted in MentorNearby chat.',
    };
  }

  // 2. Check for Phone numbers
  const digitSequences = extractDigitSequences(raw);
  for (const seq of digitSequences) {
    if (/^[6-9]\d{9}$/.test(seq) || /^91[6-9]\d{9}$/.test(seq) || /^0[6-9]\d{9}$/.test(seq) || seq.length >= 8) {
      return {
        allowed: false,
        reason: 'Sharing phone numbers is not permitted in MentorNearby chat.',
      };
    }
  }

  // 3. Spelled out phone numbers
  if (containsSpelledOutPhone(raw)) {
    return {
      allowed: false,
      reason: 'Sharing contact numbers using spelled-out words is not allowed in chat.',
    };
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
      const hasFollowUp = /\d/.test(raw) || /@\w+/.test(raw) || containsSpelledOutPhone(raw) || /(num|no|mob|wa|tg)/i.test(lower);
      if (hasFollowUp || kw.includes('at') || kw.includes('is') || kw.includes('on')) {
        return {
          allowed: false,
          reason: 'External contact channels (WhatsApp/Telegram/Instagram) are not permitted in chat.',
        };
      }
    }
  }

  // 5. External URLs sharing contact links
  const externalLinkRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:wa\.me|t\.me|chat\.whatsapp\.com|instagram\.com|facebook\.com)\/[A-Za-z0-9_.-]+/i;
  if (externalLinkRegex.test(raw)) {
    return {
      allowed: false,
      reason: 'External contact links are not allowed in chat.',
    };
  }

  return { allowed: true, reason: '' };
};

export const hasContactInfo = (text) => !canSendMessage(text).allowed;
