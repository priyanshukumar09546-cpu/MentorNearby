// ============================================================
// utils/chatFilter.js
// Anti-Bypass Filter: Blocks phone numbers, emails, words-as-numbers
// ============================================================

export const containsContactInfo = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // 1. Direct phone numbers: 10 digit, +91, with or without spaces/dashes
  const cleanDigits = text.replace(/[\s\-\(\)\.]/g, '');
  const phoneRegex = /(\+91)?[6-9]\d{9}|\d{10,}/;
  if (phoneRegex.test(cleanDigits)) return true;

  // 2. Email Address Detection
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  if (emailRegex.test(text)) return true;

  // 3. Spelled-out numbers (Hindi & English)
  const numberWords = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'ek', 'do', 'teen', 'tin', 'chaar', 'char', 'paanch', 'panch', 'cheh', 'chhah', 'saat', 'sath', 'aath', 'nau', 'dus', 'das',
    'shunya', 'first', 'second', 'third'
  ];

  let count = 0;
  numberWords.forEach((w) => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    if (regex.test(lower)) count++;
  });
  if (count >= 3) return true;

  // 4. Consecutive spaced number words like "nine eight seven six five..."
  const spacedNumPattern = /(?:\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|ek|do|teen|tin|chaar|char|paanch|panch|cheh|chhah|saat|sath|aath|nau|dus|das)\b[\s,]+){3,}/i;
  if (spacedNumPattern.test(lower)) return true;

  // 5. Total digit count >= 7 anywhere in string: e.g. "9 8 7 6 5 4 3 2 1 0"
  const digits = text.match(/\d/g) || [];
  if (digits.length >= 7) return true;

  // 6. Contact bypass keywords & Social Media Handles
  const contactKeywords = [
    'whatsapp',
    'wa.me',
    'instagram',
    'insta id',
    'telegram',
    't.me',
    'call me at',
    'contact me at',
    'ph no',
    'phone no',
    'mob no',
    'mobile no',
    'dm me on',
    'reach me at',
  ];

  for (const kw of contactKeywords) {
    if (lower.includes(kw)) return true;
  }

  return false;
};
