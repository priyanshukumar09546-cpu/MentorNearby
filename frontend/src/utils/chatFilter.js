// ============================================================
// utils/chatFilter.js
// Leak-Proof Anti-Bypass Filter: Blocks digits, number words, roman numerals,
// contact handles, emails, social media, addresses & obfuscated patterns
// ============================================================

/**
 * Strict check if a message is allowed to be sent in Introduction Chat
 * @param {string} text
 * @returns {{ allowed: boolean, reason: string }}
 */
export const canSendMessage = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { allowed: false, reason: 'Message cannot be empty.' };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // ── 0. Leet normalization before checking ───────────────────
  let normalized = lower
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[\s\-_.,;:\/\\+]+/g, ' '); // collapse repeated symbols into spaces

  // ── 1. Digits: Strict check - ANY digit 0-9 ─────────────────
  if (/\d/.test(raw)) {
    return {
      allowed: false,
      reason: 'Phone numbers and digits are strictly blocked in introduction chat. Please keep conversation about subjects and timing.',
    };
  }

  // ── 2. Number words in English ──────────────────────────────
  const enNumberWords = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
    'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
    'hundred', 'thousand', 'million',
  ];
  for (const w of enNumberWords) {
    const reg = new RegExp(`\\b${w}\\b`, 'i');
    if (reg.test(lower) || reg.test(normalized)) {
      return {
        allowed: false,
        reason: 'Number words are not allowed in introduction chat to prevent contact leaks.',
      };
    }
  }

  // ── 3. Number words in Hindi & variations ───────────────────
  const hiNumberWords = [
    'shunya', 'ek', 'ekk', '1k', 'do', 'doo', 'teen', 'teenn', 'tin', 'char', 'chaar',
    'paanch', 'panch', 'cheh', 'chheh', 'chhah', 'saat', 'sath', 'aath', 'ath', 'nau',
    'dus', 'das', 'gyarah', 'barah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah',
    'atharah', 'unnis', 'bees', 'tees', 'chalis', 'pachas', 'saath', 'sattar', 'assi',
    'nabbe', 'sau', 'hazaar',
  ];
  for (const w of hiNumberWords) {
    const reg = new RegExp(`\\b${w}\\b`, 'i');
    if (reg.test(lower) || reg.test(normalized)) {
      return {
        allowed: false,
        reason: 'Spelled-out numbers are not allowed in introduction chat.',
      };
    }
  }

  // ── 4. Roman numerals ───────────────────────────────────────
  const romanPattern = /\b(i{1,4}|v|vi{0,3}|ix|x{1,3}|xi{0,3}|xiv|xv|xvi{0,3}|xix|xx|l|c|d|m)\b/i;
  if (romanPattern.test(lower)) {
    return {
      allowed: false,
      reason: 'Roman numerals are restricted to prevent sharing phone numbers.',
    };
  }

  // ── 5. Phone / Email / Social / Contact bypass keywords ─────
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
      if (lower.includes(p) || normalized.includes(p)) {
        return {
          allowed: false,
          reason: `Sharing contact methods (${p}) is not permitted in introduction chat.`,
        };
      }
    } else {
      const reg = new RegExp(`\\b${p}\\b`, 'i');
      if (reg.test(lower) || reg.test(normalized)) {
        return {
          allowed: false,
          reason: `Contact keyword "${p}" detected. Please use MentorNearby contact unlocks to exchange details.`,
        };
      }
    }
  }

  // ── 6. Repeated symbols / separators ────────────────────────
  if (/[-_\.\+\/\\:;]{3,}/.test(raw)) {
    return {
      allowed: false,
      reason: 'Excessive punctuation or repeated symbols are not allowed.',
    };
  }

  // ── 7. Address attempts ─────────────────────────────────────
  const addressWords = [
    'sector', 'house', 'flat', 'plot', 'block', 'lane', 'gali', 'ward', 'phase', 'floor', 'building',
  ];
  for (const aw of addressWords) {
    const reg = new RegExp(`\\b${aw}\\b`, 'i');
    if (reg.test(lower) || reg.test(normalized)) {
      return {
        allowed: false,
        reason: 'Address details are not allowed in introduction chat. Keep conversations focused on tuition needs.',
      };
    }
  }

  return { allowed: true, reason: '' };
};

/**
 * Legacy compatibility helper
 */
export const containsContactInfo = (text) => {
  return !canSendMessage(text).allowed;
};

export default canSendMessage;
