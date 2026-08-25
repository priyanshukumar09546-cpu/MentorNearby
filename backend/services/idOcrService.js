// ============================================================
// services/idOcrService.js
// MentorNearby OCR & Fraud Detection Engine for Govt ID Verification
// Enforces Real Aadhaar / PAN validation using Tesseract OCR & pattern matching
// ============================================================

const Tesseract = require('tesseract.js');

// Keywords and regex patterns for different Govt ID types
const ID_VALIDATION_RULES = {
  AADHAAR: {
    keywords: [
      'AADHAAR',
      'AADHAR',
      'UIDAI',
      'GOVERNMENT OF INDIA',
      'BHARAT SARKAR',
      'BHARAT',
      'UNIQUE IDENTIFICATION',
      'ENROLMENT',
      'ENROLLMENT',
      'MERA AADHAAR',
      'DOB',
      'YEAR OF BIRTH',
      'MALE',
      'FEMALE',
      'VID',
      'HELP@UIDAI',
      'MYAADHAAR',
      'FATHER',
      'HUSBAND',
      'ADDRESS',
      'PATER',
      'MATER'
    ],
    patterns: [
      /\d{4}\s\d{4}\s\d{4}/, // 12-digit grouped Aadhaar pattern
      /\b\d{12}\b/,          // 12-digit raw number
      /VID\s*:\s*\d{4}/i,    // Virtual ID pattern
    ],
    errorMessage: 'Sahi Aadhaar ki saaf photo upload karein. Ye Aadhaar jaisa nahi lag raha.'
  },
  PAN: {
    keywords: [
      'INCOME TAX DEPARTMENT',
      'GOVT. OF INDIA',
      'GOVT OF INDIA',
      'PERMANENT ACCOUNT NUMBER',
      'INCOMETAX',
      'SIGNATURE',
      'FATHER',
      'NAME',
      'DATE OF BIRTH',
      'NATIONALITY'
    ],
    patterns: [
      /[A-Z]{5}[0-9]{4}[A-Z]/, // Standard 10-char PAN format
    ],
    errorMessage: 'Sahi PAN Card ki saaf photo upload karein. Ye PAN card jaisa nahi lag raha.'
  },
  PASSPORT: {
    keywords: [
      'PASSPORT',
      'REPUBLIC OF INDIA',
      'MINISTRY OF EXTERNAL AFFAIRS',
      'NATIONALITY',
      'GIVEN NAME',
      'SURNAME',
      'TYPE P'
    ],
    patterns: [
      /[A-Z][0-9]{7}/, // Passport number format
    ],
    errorMessage: 'Sahi Passport ki saaf photo upload karein.'
  },
  VOTER_ID: {
    keywords: [
      'ELECTION COMMISSION OF INDIA',
      'ELECTION COMMISSION',
      'ELECTOR',
      'IDENTITY CARD',
      'EPIC',
      'BHARAT NIRVACHAN',
      'VOTER'
    ],
    patterns: [
      /[A-Z]{3}[0-9]{7}/, // Standard EPIC format
    ],
    errorMessage: 'Sahi Voter ID ki saaf photo upload karein.'
  }
};

/**
 * Normalizes input govtIdType string to standard enum key
 */
const normalizeIdType = (typeStr) => {
  if (!typeStr) return 'AADHAAR';
  const clean = String(typeStr).toUpperCase().trim();
  if (clean.includes('AADHAAR') || clean.includes('AADHAR') || clean.includes('ADHAR')) return 'AADHAAR';
  if (clean.includes('PAN')) return 'PAN';
  if (clean.includes('PASSPORT')) return 'PASSPORT';
  if (clean.includes('VOTER')) return 'VOTER_ID';
  return 'AADHAAR';
};

/**
 * Perform OCR on image buffer and validate against Govt ID rules
 * @param {Object} options
 * @param {Buffer} options.buffer - File buffer
 * @param {string} options.mimetype - MIME type of the file
 * @param {string} options.govtIdType - Type of ID ('Aadhaar Card', 'PAN Card', etc.)
 * @param {number} options.fileSize - Size in bytes
 * @returns {Promise<{ isValid: boolean, errorCode?: string, message?: string, extractedText?: string }>}
 */
const validateGovtIdDocument = async ({ buffer, mimetype, govtIdType, fileSize }) => {
  // 1. File Size Verification (50KB to 5MB)
  const MIN_SIZE_BYTES = 50 * 1024;      // 50 KB
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  if (fileSize && fileSize < MIN_SIZE_BYTES) {
    return {
      isValid: false,
      errorCode: 'FILE_TOO_SMALL',
      message: 'File size bohot chhota hai (kam se kam 50KB hona chahiye). Saaf aur clear photo upload karein.'
    };
  }

  if (fileSize && fileSize > MAX_SIZE_BYTES) {
    return {
      isValid: false,
      errorCode: 'FILE_TOO_LARGE',
      message: 'File size 5MB se zyada hai. Kripya 5MB se kam ki photo upload karein.'
    };
  }

  // 2. MIME type check
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (mimetype && !allowedMimes.includes(mimetype.toLowerCase())) {
    return {
      isValid: false,
      errorCode: 'INVALID_FILE_TYPE',
      message: 'Kewal JPG, PNG, WEBP ya PDF file hi allowed hai.'
    };
  }

  // If it's a PDF, verify header and allow manual review queue
  if (mimetype === 'application/pdf') {
    const isPdfHeader = buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
    if (!isPdfHeader) {
      return {
        isValid: false,
        errorCode: 'INVALID_PDF',
        message: 'Ye valid PDF file nahi hai. Saaf document upload karein.'
      };
    }
    return {
      isValid: true,
      isPdf: true,
      extractedText: 'PDF_DOCUMENT_SUBMITTED'
    };
  }

  // 3. For Image Files: Run Tesseract OCR
  const idTypeKey = normalizeIdType(govtIdType);
  const rules = ID_VALIDATION_RULES[idTypeKey] || ID_VALIDATION_RULES.AADHAAR;

  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {}, // suppress verbose logs
    });

    const cleanText = (text || '').toUpperCase().replace(/[\r\n]+/g, ' ');

    // Check if any keyword matches
    const matchedKeywords = rules.keywords.filter(keyword => cleanText.includes(keyword));

    // Check if any regex pattern matches
    const matchedPatterns = rules.patterns.filter(pattern => pattern.test(cleanText));

    const isMatch = matchedKeywords.length > 0 || matchedPatterns.length > 0;

    if (!isMatch) {
      return {
        isValid: false,
        errorCode: 'INVALID_DOCUMENT',
        message: rules.errorMessage,
        extractedSample: cleanText.slice(0, 150)
      };
    }

    return {
      isValid: true,
      govtIdType: idTypeKey,
      matchedKeywords,
      matchedPatternsCount: matchedPatterns.length,
      extractedTextSample: cleanText.slice(0, 200)
    };
  } catch (ocrErr) {
    console.warn('[OCR Engine] Tesseract OCR recognition failed or timed out:', ocrErr.message);
    // If OCR engine had an internal processing glitch, allow document through to human review
    return {
      isValid: true,
      ocrSkipped: true,
      message: 'OCR skipped, forwarded to manual review queue'
    };
  }
};

module.exports = {
  validateGovtIdDocument,
  normalizeIdType,
  ID_VALIDATION_RULES
};
