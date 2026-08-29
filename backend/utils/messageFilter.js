// ============================================================
// utils/messageFilter.js
// Anti-Bypass Contact Detection & Leak-Proof Message Filter
// ============================================================

/**
 * Checks if message contains direct or obfuscated contact information
 * @param {string} text - Message text
 * @returns {boolean} true if contact info / restricted content is detected
 */
const hasContactInfo = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) return false;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 0. Leet normalization
  const normalized = lower
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[\s\-_.,;:\/\\+]+/g, ' ');

  // 1. Any digits 0-9
  if (/\d/.test(raw)) return true;

  // 2. English number words
  const enNumberWords = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
    'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
    'hundred', 'thousand',
  ];
  for (const w of enNumberWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower) || new RegExp(`\\b${w}\\b`, 'i').test(normalized)) {
      return true;
    }
  }

  // 3. Hindi number words
  const hiNumberWords = [
    'shunya', 'ek', 'ekk', '1k', 'do', 'doo', 'teen', 'teenn', 'tin', 'char', 'chaar',
    'paanch', 'panch', 'cheh', 'chheh', 'chhah', 'saat', 'sath', 'aath', 'ath', 'nau',
    'dus', 'das', 'gyarah', 'barah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah',
    'atharah', 'unnis', 'bees', 'tees', 'chalis', 'pachas', 'saath', 'sattar', 'assi',
    'nabbe', 'sau', 'hazaar',
  ];
  for (const w of hiNumberWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower) || new RegExp(`\\b${w}\\b`, 'i').test(normalized)) {
      return true;
    }
  }

  // 4. Roman numerals
  if (/\b(i{1,4}|v|vi{0,3}|ix|x{1,3}|xi{0,3}|xiv|xv|xvi{0,3}|xix|xx|l|c|d|m)\b/i.test(lower)) {
    return true;
  }

  // 5. Contact keywords
  const contactPatterns = [
    'phone', 'mobile', 'mob', 'cell', 'number', 'no', 'num', 'whatsapp', 'wa', 'watsapp',
    'call', 'contact', 'email', 'gmail', 'mail', 'yahoo', 'outlook', 'hotmail',
    'insta', 'instagram', 'telegram', 'tg', 'fb', 'facebook', 'twitter', 'snapchat', 'snap',
    'address', 'ghar', 'house', 'flat', 'colony', 'nagar', 'street', 'road', 'location',
    'near', 'paas', 'pin', 'pincode', 'code', '@', '.com', '.in', '.org', '.net', '.co',
    '.io', '+91', '91', 'dm', 'd-m',
  ];
  for (const p of contactPatterns) {
    if (p.startsWith('.') || p.startsWith('+') || p.startsWith('@')) {
      if (lower.includes(p) || normalized.includes(p)) return true;
    } else {
      if (new RegExp(`\\b${p}\\b`, 'i').test(lower) || new RegExp(`\\b${p}\\b`, 'i').test(normalized)) {
        return true;
      }
    }
  }

  // 6. Excessive punctuation
  if (/[-_\.\+\/\\:;]{3,}/.test(raw)) return true;

  // 7. Address words
  const addressWords = ['sector', 'house', 'flat', 'plot', 'block', 'lane', 'gali', 'ward', 'phase', 'floor', 'building'];
  for (const aw of addressWords) {
    if (new RegExp(`\\b${aw}\\b`, 'i').test(lower) || new RegExp(`\\b${aw}\\b`, 'i').test(normalized)) {
      return true;
    }
  }

  return false;
};

/**
 * Filters message text replacing any sensitive substrings
 */
const filterMessage = (text) => {
  if (!text || typeof text !== 'string') return text;
  let filtered = text;

  // Phone numbers
  filtered = filtered.replace(/\+91[\s\-]?\d{10}/g, '***');
  filtered = filtered.replace(/\b\d{5}\s\d{5}\b/g, '***');
  filtered = filtered.replace(/\b\d{10}\b/g, '***');
  filtered = filtered.replace(/\d+/g, '***');

  // Emails
  filtered = filtered.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '***');

  // Keywords
  const blockedKeywords = [
    'instagram', 'insta', 'facebook', '\\bfb\\b', 'telegram', 'whatsapp', 'gmail',
    '\\bemail\\b', 'house no', 'house number', '\\bgali\\b', 'mohalla', 'colony',
    '\\bsector\\b', '\\bnear\\b', 'pincode', 'pin code', '\\baddress\\b', 'ghar pe',
    '\\blocation\\b', 'map link', 'call me',
  ];

  blockedKeywords.forEach((keyword) => {
    filtered = filtered.replace(new RegExp(keyword, 'gi'), '***');
  });

  return filtered;
};

module.exports = { hasContactInfo, filterMessage };
