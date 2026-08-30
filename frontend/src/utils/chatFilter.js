// ============================================================
// utils/chatFilter.js
// Frontend Multi-Layer Contact & Social-Media Leak-Proof Filter
// Permits all legitimate educational content (Maths, Physics, Chem, Class 10, ₹500/hr)
// Detects & blocks disguised phone numbers, social handles, emails & links
// ============================================================

export const SECURITY_BLOCKED_MESSAGE =
  "🔒 For your safety, contact details and social-media information can't be shared in MentorNearby chat. Please keep communication within MentorNearby.";

// Dictionary of number words (English + Hindi Latin + Hindi Devanagari)
const NUMBER_WORD_MAP = {
  // English
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  // Hindi Latin Transliteration
  'shunya': 0, 'ek': 1, 'ekk': 1, 'do': 2, 'doo': 2, 'teen': 3, 'teenn': 3, 'tin': 3,
  'char': 4, 'chaar': 4, 'paanch': 5, 'panch': 5, 'cheh': 6, 'chheh': 6, 'chhah': 6,
  'saat': 7, 'sath': 7, 'aath': 8, 'ath': 8, 'nau': 9, 'das': 10, 'dus': 10,
  // Hindi Devanagari
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
};

// Roman numerals mapping for digits 1-10
const ROMAN_DIGIT_MAP = {
  'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
  'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
};

/**
 * Normalizes emojis, unicode homoglyphs, and symbol substitutions
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .normalize('NFKD')
    .replace(/0️⃣|0\uFE0F?\u20E3/g, '0')
    .replace(/1️⃣|1\uFE0F?\u20E3/g, '1')
    .replace(/2️⃣|2\uFE0F?\u20E3/g, '2')
    .replace(/3️⃣|3\uFE0F?\u20E3/g, '3')
    .replace(/4️⃣|4\uFE0F?\u20E3/g, '4')
    .replace(/5️⃣|5\uFE0F?\u20E3/g, '5')
    .replace(/6️⃣|6\uFE0F?\u20E3/g, '6')
    .replace(/7️⃣|7\uFE0F?\u20E3/g, '7')
    .replace(/8️⃣|8\uFE0F?\u20E3/g, '8')
    .replace(/9️⃣|9\uFE0F?\u20E3/g, '9')
    .toLowerCase();
};

/**
 * Removes legitimate educational patterns before digit clustering
 */
const stripEducationalContext = (text) => {
  return text
    // Currency
    .replace(/₹\s*\d+(?:[,\.]\d+)?(?:\s*\/\s*(?:hr|hour|mo|month|class|session))?/gi, ' ')
    .replace(/rs\.?\s*\d+(?:[,\.]\d+)?(?:\s*\/\s*(?:hr|hour|mo|month|class|session))?/gi, ' ')
    .replace(/inr\s*\d+(?:[,\.]\d+)?/gi, ' ')
    // Class / Grade / Standard
    .replace(/\b(?:class|grade|std|standard)\s*\d{1,2}\b/gi, ' ')
    .replace(/\b\d{1,2}(?:th|st|nd|rd)\s*(?:class|grade|std|standard|board)\b/gi, ' ')
    // Chapter / Page / Exercise / Question / Unit
    .replace(/\b(?:chapter|ch|page|pg|exercise|ex|question|q|unit|section|lesson)\s*\d+(?:\.\d+)?\b/gi, ' ')
    // Percentage / Marks ratio
    .replace(/\b\d{1,3}\s*%/g, ' ')
    .replace(/\b\d{1,3}\s*\/\s*\d{1,3}\b/g, ' ')
    // Time / Timings
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, ' ')
    .replace(/\b(?:from|at|till|to)\s*\d{1,2}\s*(?:am|pm)?\b/gi, ' ')
    // Dates
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:\d{2,4})?\b/gi, ' ')
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{2,4})?\b/gi, ' ')
    // Chemistry formulas (e.g. H2O, CO2, 2H2 + O2 -> 2H2O, CH4)
    .replace(/\b[a-z]{1,2}\d{1,2}(?:[a-z]{1,2}\d{0,2})*\b/gi, ' ')
    .replace(/\b\d{1,2}[a-z]{1,3}\d{0,2}\b/gi, ' ')
    // Maths expressions with variables (e.g. 2x + 5 = 15, x^2 + 5x + 6)
    .replace(/\b\d*[a-z]\s*[\^+\-*/=]\s*\d*[a-z0-9]*/gi, ' ')
    .replace(/\b[a-z]\s*[\^+\-*/=]\s*\d+/gi, ' ');
};

/**
 * Checks for direct or spaced 7-15 digit phone numbers
 */
const detectPhoneNumbers = (rawText) => {
  const cleaned = stripEducationalContext(rawText);

  const potentialMatches = cleaned.match(/(?:\+?\d[\d\s\-_.,;/@#$%^&*()~+=|\\\[\]]{5,}\d)/g);
  if (potentialMatches) {
    for (const match of potentialMatches) {
      const digitsOnly = match.replace(/\D/g, '');
      if (/^[6-9]\d{9}$/.test(digitsOnly)) return true;
      if (/^91[6-9]\d{9}$/.test(digitsOnly)) return true;
      if (/^0[6-9]\d{9}$/.test(digitsOnly)) return true;
      if (digitsOnly.length >= 8) return true;
    }
  }

  const leetTransformed = cleaned
    .replace(/o/gi, '0')
    .replace(/[li!|]/gi, '1')
    .replace(/z/gi, '2')
    .replace(/e/gi, '3')
    .replace(/a/gi, '4')
    .replace(/s/gi, '5')
    .replace(/b/gi, '8');

  const leetMatches = leetTransformed.match(/(?:\+?\d[\d\s\-_.,;/@#$%^&*()~+=|\\\[\]]{5,}\d)/g);
  if (leetMatches) {
    for (const match of leetMatches) {
      const digitsOnly = match.replace(/\D/g, '');
      if (/^[6-9]\d{9}$/.test(digitsOnly) || /^91[6-9]\d{9}$/.test(digitsOnly) || digitsOnly.length >= 9) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks for spelled out numbers in English, Hindi, or Roman numerals
 */
const detectSpelledOutNumbers = (text) => {
  const normalized = normalizeText(text);
  const tokens = normalized.replace(/[^a-z0-9\u0900-\u097F]/g, ' ').split(/\s+/).filter(Boolean);

  let sequenceCount = 0;
  for (const token of tokens) {
    if (NUMBER_WORD_MAP[token] !== undefined || ROMAN_DIGIT_MAP[token] !== undefined) {
      sequenceCount++;
      if (sequenceCount >= 5) return true;
    } else {
      sequenceCount = 0;
    }
  }

  const compressed = normalized.replace(/[^a-z0-9\u0900-\u097F]/g, '');
  const numberWordPatterns = Object.keys(NUMBER_WORD_MAP);
  let totalFoundInCompressed = 0;
  for (const nw of numberWordPatterns) {
    const reg = new RegExp(nw, 'g');
    const matches = compressed.match(reg);
    if (matches) totalFoundInCompressed += matches.length;
  }
  if (totalFoundInCompressed >= 6) return true;

  return false;
};

/**
 * Checks for emails (standard, disguised, bracketed, or obfuscated)
 */
const detectEmails = (rawText) => {
  const text = rawText.toLowerCase();

  const standardEmail = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  if (standardEmail.test(text)) return true;

  const disguisedEmail = /\b[a-z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|at)\s*[a-z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|dot)\s*(?:com|in|org|net|co|io|edu|gov|ac|ai|me)\b/i;
  if (disguisedEmail.test(text)) return true;

  const spacedEmail = /\b[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}\b/i;
  if (spacedEmail.test(text)) return true;

  const providerPattern = /\b(?:gmail|yahoo|outlook|hotmail|rediffmail|icloud)\b/i;
  if (providerPattern.test(text) && (text.includes('@') || text.includes('dot') || text.includes('.com') || text.includes('.in'))) {
    return true;
  }

  return false;
};

/**
 * Checks for social media handles, usernames, and profile exchange patterns
 */
const detectSocialMediaHandles = (rawText) => {
  const normalized = normalizeText(rawText);

  // 1. Instagram variations
  const instaRegex = /\b(?:insta|instagram|ig|i\.g|i\.g\.|i_g)\b[\s:=-_./\\@#*]*[a-z0-9_.-]{3,30}\b/i;
  if (instaRegex.test(rawText) || instaRegex.test(normalized)) return true;
  if (/\b(?:my\s+insta|my\s+ig|insta\s+id|ig\s+id|insta\s+handle|ig\s+handle|on\s+insta|on\s+ig|dm\s+on\s+insta|dm\s+on\s+ig)\b/i.test(normalized)) {
    return true;
  }

  // 2. Snapchat variations
  const snapRegex = /\b(?:snap|snapchat|sc|snap_id)\b[\s:=-_./\\@#*]*[a-z0-9_.-]{3,30}\b/i;
  if (snapRegex.test(rawText) || snapRegex.test(normalized)) return true;
  if (/\b(?:my\s+snap|my\s+snapchat|snap\s+id|snapchat\s+id|snap\s+me|add\s+on\s+snap)\b/i.test(normalized)) {
    return true;
  }

  // 3. Telegram variations
  const tgRegex = /\b(?:tg|telegram|tele)\b[\s:=-_./\\@#*]*[a-z0-9_.-]{3,30}\b/i;
  if (tgRegex.test(rawText) || tgRegex.test(normalized)) return true;
  if (/\b(?:my\s+telegram|telegram\s+id|tg\s+id|ping\s+on\s+tg|msg\s+on\s+telegram|telegram\s+handle)\b/i.test(normalized)) {
    return true;
  }

  // 4. WhatsApp variations
  const waRegex = /\b(?:wa|whatsapp|watsapp|whatsap|whatapp|whats\s*app)\b/i;
  if (waRegex.test(rawText)) {
    if (/\d/.test(rawText) || /\b(?:msg|message|ping|call|chat|dm|send|number|no|contact)\b/i.test(normalized)) {
      return true;
    }
  }

  // 5. Discord / Facebook / Twitter / X handles
  if (/\b(?:discord|discord\.gg|discord\s*id|my\s*discord|fb\s*id|facebook\s*id|my\s*fb|twitter\s*handle|x\s*handle)\b/i.test(normalized)) {
    return true;
  }

  // 6. Direct contact request phrases
  const directContactPhrases = [
    'call me at', 'contact me at', 'my phone is', 'my number is',
    'my mobile is', 'ping me on', 'msg me on', 'dm me on',
    'connect on', 'share your number', 'send your number',
    'give me your number', 'call on this', 'ping on this',
    'reach me at', 'my handle is', 'find me on', 'add me on'
  ];

  for (const phrase of directContactPhrases) {
    if (normalized.includes(phrase)) {
      if (/\d/.test(rawText) || /[@_.]/.test(rawText) || detectSpelledOutNumbers(rawText)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks for external contact links & URL shorteners
 */
const detectExternalLinks = (rawText) => {
  const text = rawText.toLowerCase();

  const blockedDomains = [
    'wa.me', 'api.whatsapp.com', 'chat.whatsapp.com',
    't.me', 'telegram.me', 'telegram.dog',
    'instagram.com', 'instagr.am',
    'facebook.com', 'fb.me', 'fb.com',
    'snapchat.com',
    'discord.gg', 'discord.com/invite',
    'twitter.com', 'x.com',
    'bit.ly', 'tinyurl.com', 'cutt.ly', 'linktr.ee', 'shorturl.at', 'is.gd'
  ];

  for (const domain of blockedDomains) {
    if (text.includes(domain)) return true;
  }

  if (/\b(?:wa|t|instagram|telegram|snapchat|discord)\s+(?:dot|\.)\s+(?:me|com|gg)\s+(?:slash|\/)\b/i.test(text)) {
    return true;
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

  // 1. Phone numbers (10-digit, international, spaced, punctuated, leet)
  if (detectPhoneNumbers(raw)) {
    return {
      allowed: false,
      reason: SECURITY_BLOCKED_MESSAGE,
    };
  }

  // 2. Spelled out numbers (English, Hindi, Roman numerals)
  if (detectSpelledOutNumbers(raw)) {
    return {
      allowed: false,
      reason: SECURITY_BLOCKED_MESSAGE,
    };
  }

  // 3. Emails (standard, disguised, bracketed)
  if (detectEmails(raw)) {
    return {
      allowed: false,
      reason: SECURITY_BLOCKED_MESSAGE,
    };
  }

  // 4. Social media usernames, profile handles & direct contact requests
  if (detectSocialMediaHandles(raw)) {
    return {
      allowed: false,
      reason: SECURITY_BLOCKED_MESSAGE,
    };
  }

  // 5. External contact links & shorteners
  if (detectExternalLinks(raw)) {
    return {
      allowed: false,
      reason: SECURITY_BLOCKED_MESSAGE,
    };
  }

  return { allowed: true, reason: '' };
};

export const hasContactInfo = (text) => !canSendMessage(text).allowed;
