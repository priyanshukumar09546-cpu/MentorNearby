// ============================================================
// utils/messageFilter.js
// Filters chat messages to block phones, emails, and address keywords
// ============================================================

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

module.exports = { filterMessage };
