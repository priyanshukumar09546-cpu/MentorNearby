// ============================================================
// utils/messageFilter.js
// Anti-Bypass Contact Detection & Message Filtering
// ============================================================

/**
 * Checks if message contains direct or obfuscated contact information
 * @param {string} text - Message text
 * @returns {boolean} true if contact info detected
 */
const hasContactInfo = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // 1. Direct phone numbers: 10+ digits, +91 prefixed
  const cleanDigits = text.replace(/[\s\-\(\)\.]/g, '');
  if (/(\+91)?[6-9]\d{9}|\d{10,}/.test(cleanDigits)) return true;

  // 2. Email address
  if (/[\w.-]+@[\w.-]+\.\w+/.test(text)) return true;

  // 3. 7+ total digits in text (e.g. "9 8 7 6 5 4 3 2 1")
  const digits = text.match(/\d/g) || [];
  if (digits.length >= 7) return true;

  // 4. Word-spelled numbers in English or Hindi (e.g. "nine eight seven" / "ek do teen")
  const numberWords = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'ek', 'do', 'teen', 'tin', 'chaar', 'char', 'paanch', 'panch', 'cheh', 'chhah', 'saat', 'sath', 'aath', 'nau', 'dus', 'das',
  ];

  let count = 0;
  numberWords.forEach((w) => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    if (regex.test(lower)) count++;
  });
  if (count >= 3) return true;

  // 5. Spaced word pattern
  const spacedNumPattern = /(?:\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|tin|chaar|char|paanch|panch|cheh|chhah|saat|sath|aath|nau|dus|das)\b[\s,]+){3,}/i;
  if (spacedNumPattern.test(lower)) return true;

  // 6. Direct contact/social bypass keywords
  const contactKeywords = [
    'whatsapp', 'wa.me', 'instagram', 'insta id', 'telegram', 't.me', 'call me', 'contact me at', 'ph no', 'phone no', 'mob no', 'mobile no', 'dm me on',
  ];

  for (const kw of contactKeywords) {
    if (lower.includes(kw)) return true;
  }

  return false;
};

/**
 * Filters a message string to replace private/contact information with ***
 * @param {string} text - Raw message text
 * @returns {string} Filtered message text
 */
const filterMessage = (text) => {
  if (!text || typeof text !== 'string') return text;

  let filtered = text;

  // 1. Block phone numbers: 10-digit, +91 prefixed, or split 5+5
  filtered = filtered.replace(/\+91[\s\-]?\d{10}/g, '***');
  filtered = filtered.replace(/\b\d{5}\s\d{5}\b/g, '***');
  filtered = filtered.replace(/\b\d{10}\b/g, '***');

  // 2. Block email addresses
  filtered = filtered.replace(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    '***'
  );

  // 3. Block social media / location keywords (replace the full word match)
  const blockedKeywords = [
    'instagram',
    'insta',
    'facebook',
    '\\bfb\\b',
    'telegram',
    'whatsapp',
    'gmail',
    '\\bemail\\b',
    'house no',
    'house number',
    '\\bgali\\b',
    'mohalla',
    'colony',
    '\\bsector\\b',
    '\\bnear\\b',
    'pincode',
    'pin code',
    '\\baddress\\b',
    'ghar pe',
    '\\blocation\\b',
    'map link',
  ];

  blockedKeywords.forEach((keyword) => {
    const regex = new RegExp(keyword, 'gi');
    filtered = filtered.replace(regex, '***');
  });

  return filtered;
};

module.exports = { hasContactInfo, filterMessage };
