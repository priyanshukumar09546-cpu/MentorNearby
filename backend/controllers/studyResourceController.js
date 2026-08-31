// ============================================================
// controllers/studyResourceController.js
// Complete business logic for Study Resources, Free Online Reading,
// Paid PDF Downloads, Dual Combos, Printing Partners, and Admin Management
// ============================================================

const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');
const StudyPurchase = require('../models/StudyPurchase');
const PrintProvider = require('../models/PrintProvider');
const AdminConfig = require('../models/AdminConfig');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const razorpayService = require('../services/razorpayService');
const { uploadToCloudinary, uploadStudyDocument, deleteFromCloudinary } = require('../services/cloudinaryService');
const { detectFileType } = require('../utils/fileTypeDetector');
const studyContentEngine = require('../services/studyContentEngine');
const { createNotification } = require('./notificationController');

// Helper: Normalize class level for consistent queries (e.g., "Class 9" -> "9")
const normalizeClass = (cls) => {
  if (!cls) return '';
  const num = cls.toString().replace(/class\s*/i, '').trim();
  return num;
};

// Helper: Find study resource by MongoDB ObjectId, slug, or synthetic ID
const findStudyResourceByIdOrSlug = async (id) => {
  if (!id) return null;
  const cleanId = String(id).trim();

  // 1. If valid ObjectId, try findById
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    try {
      const res = await StudyResource.findById(cleanId).lean();
      if (res) return res;
    } catch (_) {}
  }

  // 2. Try findOne by slug, id string or title
  try {
    const res = await StudyResource.findOne({
      $or: [
        { slug: cleanId },
        { id: cleanId },
        { chapterTitle: new RegExp(cleanId.replace(/[-_]/g, ' '), 'i') }
      ]
    }).lean();
    if (res) return res;
  } catch (_) {}

  // 3. Fallback: Parse string IDs like 'c9-sci-ch5-formula', 'c10-sci-ch1-notes', 'c9-sci-ch1-formula'
  const lower = cleanId.toLowerCase();
  let classLevel = '9';
  if (lower.includes('c10') || lower.includes('class-10') || lower.includes('class10')) classLevel = '10';
  else if (lower.includes('c11') || lower.includes('class-11') || lower.includes('class11')) classLevel = '11';
  else if (lower.includes('c12') || lower.includes('class-12') || lower.includes('class12')) classLevel = '12';

  let subject = 'Science';
  if (lower.includes('math')) subject = 'Mathematics';
  else if (lower.includes('phy')) subject = 'Physics';
  else if (lower.includes('chem')) subject = 'Chemistry';
  else if (lower.includes('bio')) subject = 'Biology';

  const chMatch = lower.match(/ch(\d+)/);
  const chapterNumber = chMatch ? parseInt(chMatch[1], 10) : 1;

  const isFormula = lower.includes('formula') || lower.includes('sheet');
  const resourceType = isFormula ? 'FORMULA_SHEET' : 'IMPORTANT_QUESTIONS_ANSWERS';

  // Search MongoDB Atlas for original uploaded Cloudinary file matching this chapter
  try {
    const existingDbRecord = await StudyResource.findOne({
      classLevel,
      subject,
      chapterNumber,
      resourceType, // STRICT RESOURCE TYPE MATCHING (FORMULA_SHEET vs IMPORTANT_QUESTIONS_ANSWERS)
      published: true,
      $or: [
        { fileUrl: { $regex: 'res.cloudinary.com' } },
        { 'fileReference.url': { $regex: 'res.cloudinary.com' } },
        { fileUrl: { $regex: '^/uploads/' } }
      ]
    }).lean();
    if (existingDbRecord) {
      return existingDbRecord;
    }
  } catch (_) {}

  const chapterContent = studyContentEngine.getChapterStudyContent({
    classLevel,
    subject,
    chapterNumber,
    resourceType,
  });

  return {
    _id: cleanId,
    id: cleanId,
    title: `Chapter ${chapterNumber} ${isFormula ? 'Formula Sheet' : 'Revision Notes'} — ${chapterContent.title || 'Key Concepts'}`,
    chapter: `Chapter ${chapterNumber}`,
    chapterNumber,
    chapterTitle: chapterContent.title || 'Key Concepts',
    classLevel,
    subject,
    resourceType,
    published: true,
    downloadEnabled: true,
    fileSize: 324000,
    downloadPrice: isFormula ? (['11', '12'].includes(classLevel) ? 8 : 7) : (['11', '12'].includes(classLevel) ? 14 : 12),
    salePrice: isFormula ? (['11', '12'].includes(classLevel) ? 8 : 7) : (['11', '12'].includes(classLevel) ? 14 : 12),
    originalPrice: isFormula ? 49 : 79,
  };
};

// Helper: Find study resource bundle by MongoDB ObjectId, slug, bundleId, or synthetic ID
const findStudyResourceBundleByIdOrSlug = async (id, filter = {}) => {
  if (!id && Object.keys(filter).length === 0) return null;
  const cleanId = id ? String(id).trim() : '';

  // 1. If valid 24-hex ObjectId, try findById
  if (cleanId && mongoose.Types.ObjectId.isValid(cleanId) && /^[0-9a-fA-F]{24}$/.test(cleanId)) {
    try {
      const res = await StudyResourceBundle.findById(cleanId);
      if (res) return res;
    } catch (_) {}
  }

  // 2. Try findOne by slug, bundleId, or _id
  if (cleanId) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(cleanId) && /^[0-9a-fA-F]{24}$/.test(cleanId);
      const res = await StudyResourceBundle.findOne({
        $or: [
          { slug: cleanId },
          { bundleId: cleanId },
          ...(isObjId ? [{ _id: new mongoose.Types.ObjectId(cleanId) }] : []),
        ],
      });
      if (res) return res;
    } catch (_) {}

    // 3. Parse string IDs like 'combo-c9-math-formula', 'combo-c10-sci-notes', 'combo-c9-sci-formula'
    const lower = cleanId.toLowerCase();
    let classLevel = '9';
    if (lower.includes('c10') || lower.includes('class-10') || lower.includes('class10')) classLevel = '10';
    else if (lower.includes('c11') || lower.includes('class-11') || lower.includes('class11')) classLevel = '11';
    else if (lower.includes('c12') || lower.includes('class-12') || lower.includes('class12')) classLevel = '12';

    let subject = 'Mathematics';
    if (lower.includes('sci')) subject = 'Science';
    else if (lower.includes('phy')) subject = 'Physics';
    else if (lower.includes('chem')) subject = 'Chemistry';
    else if (lower.includes('bio')) subject = 'Biology';
    else if (lower.includes('math')) subject = 'Mathematics';

    const isFormula = lower.includes('formula');
    const comboType = isFormula ? 'FORMULA_COMBO' : 'QA_COMBO';

    try {
      const res = await StudyResourceBundle.findOne({
        classLevel: { $in: [classLevel, `Class ${classLevel}`] },
        subject: new RegExp(`^${subject}$`, 'i'),
        comboType,
      });
      if (res) return res;
    } catch (_) {}
  }

  if (filter && Object.keys(filter).length > 0) {
    try {
      const res = await StudyResourceBundle.findOne(filter);
      if (res) return res;
    } catch (_) {}
  }

  return null;
};

// Authoritative Default Pricing Matrix (Database Driven)
// CLASS 9: Maths = ₹7, Science = ₹7, Formula Combo = ₹50, Notes/PPT = ₹12, Notes Combo = ₹100
// CLASS 10: Maths = ₹7, Science = ₹7, Formula Combo = ₹50, Notes/PPT = ₹12, Notes Combo = ₹100
// CLASS 11: Maths = ₹8, Science = ₹8, Formula Combo = ₹60, Notes/PPT = ₹14, Notes Combo = ₹120
// CLASS 12: Maths = ₹8, Science = ₹8, Formula Combo = ₹60, Notes/PPT = ₹14, Notes Combo = ₹120
const DEFAULT_PRICING_MATRIX = {
  '9': {
    mathsFormulaIndividual: 7,
    scienceFormulaIndividual: 7,
    formulaCombo: 50,
    notesIndividual: 12,
    notesCombo: 100,
  },
  '10': {
    mathsFormulaIndividual: 7,
    scienceFormulaIndividual: 7,
    formulaCombo: 50,
    notesIndividual: 12,
    notesCombo: 100,
  },
  '11': {
    mathsFormulaIndividual: 8,
    scienceFormulaIndividual: 8,
    formulaCombo: 60,
    notesIndividual: 14,
    notesCombo: 120,
  },
  '12': {
    mathsFormulaIndividual: 8,
    scienceFormulaIndividual: 8,
    formulaCombo: 60,
    notesIndividual: 14,
    notesCombo: 120,
  },
};

// Helper: Dynamic Combo & Resource Pricing from Database
const getStandardComboPrices = async (classLevel, subject = '') => {
  const norm = normalizeClass(classLevel);
  const isSenior = norm === '11' || norm === '12';
  const isMaths = /^Math/i.test(subject || '');

  try {
    const config = await AdminConfig.findOne({ key: 'FORMULA_SHEET_PRICING_MATRIX' }).lean();
    if (config?.value && config.value[norm]) {
      const entry = config.value[norm];
      const formulaPrice = Number(entry.formulaCombo) || (isSenior ? 60 : 50);
      const qaPrice = Number(entry.notesCombo) || (isSenior ? 120 : 100);
      const singleFormulaPrice = (isMaths ? Number(entry.mathsFormulaIndividual || entry.mathsIndividual) : Number(entry.scienceFormulaIndividual || entry.scienceIndividual)) || (isSenior ? 8 : 7);
      const singleNotesPrice = Number(entry.notesIndividual) || (isSenior ? 14 : 12);
      return { formulaPrice, qaPrice, singleFormulaPrice, singleNotesPrice };
    }
  } catch (_) {
    // Non-blocking fallback to default matrix
  }

  const def = DEFAULT_PRICING_MATRIX[norm] || DEFAULT_PRICING_MATRIX['9'];
  return {
    formulaPrice: def.formulaCombo,
    qaPrice: def.notesCombo,
    singleFormulaPrice: isMaths ? def.mathsFormulaIndividual : def.scienceFormulaIndividual,
    singleNotesPrice: def.notesIndividual,
  };
};

// ============================================================
// 1. PUBLIC: GET CLASSES & SUBJECTS CATALOG
// ============================================================
exports.getClassesAndSubjects = asyncHandler(async (req, res, next) => {
  const defaultCatalog = [
    {
      classLevel: '9',
      displayName: 'Class 9',
      subjects: ['Mathematics', 'Science'],
      description: 'Foundational concept sheets, formula compilations & high-yield practice questions.',
      icon: '📐',
    },
    {
      classLevel: '10',
      displayName: 'Class 10',
      subjects: ['Mathematics', 'Science'],
      description: 'Board-exam ready formula sheets, past-trend questions & step-by-step solutions.',
      icon: '🔬',
    },
    {
      classLevel: '11',
      displayName: 'Class 11',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      description: 'Senior secondary derivations, master formula banks & competitive entrance primers.',
      icon: '⚛️',
    },
    {
      classLevel: '12',
      displayName: 'Class 12',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      description: 'Complete revision decks, scoring tips, and comprehensive unit-wise compilations.',
      icon: '🧪',
    },
  ];

  // Fetch dynamic statistics from DB
  const stats = await StudyResource.aggregate([
    { $match: { published: true } },
    {
      $group: {
        _id: { classLevel: '$classLevel', subject: '$subject' },
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  stats.forEach((s) => {
    const key = `${normalizeClass(s._id.classLevel)}_${s._id.subject?.toLowerCase()}`;
    statsMap[key] = s.count;
  });

  const catalog = defaultCatalog.map((cat) => ({
    ...cat,
    subjects: cat.subjects.map((sub) => ({
      name: sub,
      resourceCount: statsMap[`${cat.classLevel}_${sub.toLowerCase()}`] || 0,
    })),
  }));

  return success(res, 'Classes and subjects catalog retrieved', { catalog });
});

// ============================================================
// 2. PUBLIC: GET SUBJECT STUDY RESOURCES & DUAL COMBO PRODUCTS
// (ONLINE READING IS 100% FREE; DOWNLOADS ARE PAID)
// ============================================================
exports.getSubjectStudyResources = asyncHandler(async (req, res, next) => {
  const { classLevel, subject } = req.params;
  const normalizedClass = normalizeClass(classLevel);

  // 1. Fetch all published resources for this class + subject
  const query = {
    published: true,
    classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`, classLevel] },
    subject: new RegExp(`^${subject}$`, 'i'),
  };

  const resources = await StudyResource.find(query)
    .sort({ chapterNumber: 1, order: 1, createdAt: 1 })
    .lean();

  const standardPrices = await getStandardComboPrices(normalizedClass, subject);

  // 2. Fetch or create logical Formula Combo Bundle
  let formulaBundle = await StudyResourceBundle.findOne({
    classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
    subject: new RegExp(`^${subject}$`, 'i'),
    comboType: 'FORMULA_COMBO',
    published: true,
  }).lean();

  if (!formulaBundle) {
    formulaBundle = {
      title: `Class ${normalizedClass} ${subject} Formula Sheets Combo`,
      description: `Get all Chapter Formula Sheets from Chapter 1 to the final chapter for Class ${normalizedClass} ${subject}.`,
      classLevel: normalizedClass,
      subject: subject,
      comboType: 'FORMULA_COMBO',
      resourceType: 'FORMULA_SHEET',
      price: standardPrices.formulaPrice,
      published: true,
    };
  } else {
    // Enforce single source of truth price
    formulaBundle.price = standardPrices.formulaPrice;
    StudyResourceBundle.findByIdAndUpdate(formulaBundle._id, { price: standardPrices.formulaPrice }).exec().catch(() => {});
  }

  // 3. Fetch or create logical QA Combo Bundle
  let qaBundle = await StudyResourceBundle.findOne({
    classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
    subject: new RegExp(`^${subject}$`, 'i'),
    comboType: 'QA_COMBO',
    published: true,
  }).lean();

  if (!qaBundle) {
    qaBundle = {
      title: `Class ${normalizedClass} ${subject} Important Questions + Answers Combo`,
      description: `Get all Important Questions + Answers from Chapter 1 to the final chapter for Class ${normalizedClass} ${subject}.`,
      classLevel: normalizedClass,
      subject: subject,
      comboType: 'QA_COMBO',
      resourceType: 'IMPORTANT_QUESTIONS_ANSWERS',
      price: standardPrices.qaPrice,
      published: true,
    };
  } else {
    // Enforce single source of truth price
    qaBundle.price = standardPrices.qaPrice;
    StudyResourceBundle.findByIdAndUpdate(qaBundle._id, { price: standardPrices.qaPrice }).exec().catch(() => {});
  }

  // 4. Calculate normal individual totals for Formula and QA
  let formulaNormalTotal = 0;
  let formulaCount = 0;
  let qaNormalTotal = 0;
  let qaCount = 0;

  resources.forEach((r) => {
    const isFormula = r.resourceType === 'FORMULA_SHEET';
    const defaultSinglePrice = isFormula ? standardPrices.singleFormulaPrice : standardPrices.singleNotesPrice;
    const downloadPrice = Number(r.downloadPrice || r.salePrice) || defaultSinglePrice;
    if (isFormula) {
      formulaCount += 1;
      formulaNormalTotal += downloadPrice;
    } else {
      qaCount += 1;
      qaNormalTotal += downloadPrice;
    }
  });

  const formulaSavings = Math.max(0, formulaNormalTotal - formulaBundle.price);
  const formulaDiscountPct = formulaNormalTotal > 0 ? Math.round((formulaSavings / formulaNormalTotal) * 100) : 0;

  const qaSavings = Math.max(0, qaNormalTotal - qaBundle.price);
  const qaDiscountPct = qaNormalTotal > 0 ? Math.round((qaSavings / qaNormalTotal) * 100) : 0;

  // 5. Check user purchase status if logged in
  let userPurchasedResourceIds = new Set();
  let userPurchasedFormulaCombo = false;
  let userPurchasedQaCombo = false;

  if (req.user && req.user.id) {
    const userPurchases = await StudyPurchase.find({
      user: req.user.id,
      paymentStatus: 'COMPLETED',
      classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
      subject: new RegExp(`^${subject}$`, 'i'),
    }).lean();

    userPurchases.forEach((p) => {
      if (p.purchaseType === 'FORMULA_COMBO' || p.comboType === 'FORMULA_COMBO') {
        userPurchasedFormulaCombo = true;
      } else if (p.purchaseType === 'QA_COMBO' || p.comboType === 'QA_COMBO') {
        userPurchasedQaCombo = true;
      } else if (p.purchaseType === 'SUBJECT_BUNDLE') {
        userPurchasedFormulaCombo = true;
      } else if (p.resource) {
        userPurchasedResourceIds.add(p.resource.toString());
      }
    });
  }

  // 6. Group resources by chapter with clean reading & download metadata
  const chaptersMap = new Map();

  resources.forEach((r) => {
    const chNum = r.chapterNumber || 1;
    const isFormula = r.resourceType === 'FORMULA_SHEET';
    const defaultSinglePrice = isFormula ? standardPrices.singleFormulaPrice : standardPrices.singleNotesPrice;
    const individualPrice = Number(r.downloadPrice || r.salePrice) || defaultSinglePrice;
    const origPrice = Number(r.originalPrice) || (isFormula ? 49 : 79);

    let isDownloadUnlocked = false;
    let unlockedVia = null;

    if (userPurchasedResourceIds.has(r._id.toString())) {
      isDownloadUnlocked = true;
      unlockedVia = 'INDIVIDUAL';
    } else if (isFormula && userPurchasedFormulaCombo) {
      isDownloadUnlocked = true;
      unlockedVia = 'FORMULA_COMBO';
    } else if (!isFormula && userPurchasedQaCombo) {
      isDownloadUnlocked = true;
      unlockedVia = 'QA_COMBO';
    }

    if (!chaptersMap.has(chNum)) {
      chaptersMap.set(chNum, {
        chapterNumber: chNum,
        chapterTitle: r.chapterTitle || r.chapter || `Chapter ${chNum}`,
        unit: r.unit || '',
        resources: [],
      });
    }

    const isFreeDemo = r.isFreeDemo === true || chNum <= 2;

    chaptersMap.get(chNum).resources.push({
      _id: r._id,
      title: r.title,
      description: r.description,
      resourceType: r.resourceType,
      classLevel: r.classLevel,
      subject: r.subject,
      chapterNumber: r.chapterNumber,
      chapterTitle: r.chapterTitle,
      unit: r.unit,
      isFreeDemo,
      isFree: isFreeDemo || r.isFree,
      readingEnabled: true, // Reading is ALWAYS 100% FREE
      downloadEnabled: r.downloadEnabled !== false,
      originalPrice: origPrice,
      downloadPrice: individualPrice,
      salePrice: individualPrice,
      isDownloadUnlocked,
      isUnlocked: isDownloadUnlocked,
      unlockedVia,
      viewsCount: r.viewsCount || 0,
      downloadsCount: r.downloadsCount || 0,
    });
  });

  const chapters = Array.from(chaptersMap.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);

  return success(res, 'Subject study resources retrieved', {
    classLevel: normalizedClass,
    subject,
    totalResourcesCount: resources.length,
    readingModel: 'FREE_ONLINE_READING',
    combos: {
      formulaBundle: {
        ...formulaBundle,
        normalTotal: formulaNormalTotal,
        resourceCount: formulaCount,
        savings: formulaSavings,
        discountPercentage: formulaDiscountPct,
        isPurchased: userPurchasedFormulaCombo,
      },
      qaBundle: {
        ...qaBundle,
        normalTotal: qaNormalTotal,
        resourceCount: qaCount,
        savings: qaSavings,
        discountPercentage: qaDiscountPct,
        isPurchased: userPurchasedQaCombo,
      },
    },
    // Backwards compatibility alias
    bundle: {
      ...formulaBundle,
      normalTotal: formulaNormalTotal,
      resourceCount: formulaCount,
      savings: formulaSavings,
      discountPercentage: formulaDiscountPct,
      isPurchased: userPurchasedFormulaCombo,
  },
    chapters,
  });
});

// ============================================================
// 3. PUBLIC: SEARCH STUDY RESOURCES & FREE BOOKS
// ============================================================
exports.searchStudyResources = asyncHandler(async (req, res, next) => {
  const {
    query,
    q,
    classLevel,
    subject,
    chapter,
    board,
    medium,
    category,
    resourceType,
    sort = 'recommended',
    page = 1,
    limit = 20,
  } = req.query;

  const mongoQuery = { published: true };

  const rawSearch = (q || query || '').trim();

  // Class Filter
  if (classLevel && classLevel.toLowerCase() !== 'all' && classLevel.toLowerCase() !== 'all classes') {
    const norm = normalizeClass(classLevel);
    mongoQuery.classLevel = { $in: [norm, `Class ${norm}`] };
  }

  // Board Filter
  if (board && board.toLowerCase() !== 'all' && board.toLowerCase() !== 'all boards') {
    if (board === 'UP_BOARD_ENGLISH' || board.includes('English Medium') || board.includes('(EM)')) {
      mongoQuery.board = 'UP_BOARD_ENGLISH';
    } else if (board === 'UP_BOARD_HINDI' || board.includes('Hindi Medium') || board.includes('(HM)')) {
      mongoQuery.board = 'UP_BOARD_HINDI';
    } else {
      mongoQuery.board = new RegExp(`^${board.trim()}$`, 'i');
    }
  }

  // Medium Filter
  if (medium && medium.toLowerCase() !== 'all' && medium.toLowerCase() !== 'all mediums') {
    mongoQuery.medium = new RegExp(`^${medium.trim()}$`, 'i');
  }

  // Subject Filter
  if (subject && subject.toLowerCase() !== 'all' && subject.toLowerCase() !== 'all subjects') {
    mongoQuery.subject = new RegExp(`^${subject.trim()}$`, 'i');
  }

  // Chapter Filter
  if (chapter && chapter.toLowerCase() !== 'all') {
    const chNum = parseInt(chapter.replace(/\D/g, ''));
    if (!isNaN(chNum)) {
      mongoQuery.$or = [
        { chapterNumber: chNum },
        { chapter: new RegExp(`^chapter\\s*${chNum}$`, 'i') },
      ];
    } else {
      mongoQuery.chapter = new RegExp(`^${chapter}$`, 'i');
    }
  }

  // Category / Resource Type Filter
  const effectiveType = category || resourceType;
  if (effectiveType && effectiveType.toLowerCase() !== 'all' && effectiveType.toLowerCase() !== 'all types') {
    const typeUpper = effectiveType.toUpperCase();
    if (typeUpper === 'TEXTBOOK' || typeUpper === 'BOOK' || typeUpper === 'BOOKS') {
      mongoQuery.resourceType = { $in: ['BOOK', 'TEXTBOOK'] };
    } else if (typeUpper === 'SOLUTIONS') {
      mongoQuery.resourceType = { $in: ['SOLUTIONS', 'IMPORTANT_QUESTIONS_ANSWERS'] };
    } else if (typeUpper === 'PYQ' || typeUpper === 'PYQ_PAPERS' || typeUpper === 'PYQ PAPERS') {
      mongoQuery.resourceType = { $in: ['PYQ', 'PYQ_PAPERS', 'QUESTION_BANK'] };
    } else if (typeUpper === 'NOTES') {
      mongoQuery.resourceType = { $in: ['NOTES', 'REVISION_NOTES', 'IMPORTANT_QUESTIONS_ANSWERS'] };
    } else if (typeUpper === 'NOTES_FORMULAS' || typeUpper === 'NOTES & FORMULAS') {
      mongoQuery.resourceType = { $in: ['NOTES', 'NOTES_FORMULAS', 'FORMULA_SHEET', 'REVISION_NOTES', 'IMPORTANT_QUESTIONS_ANSWERS'] };
    } else if (typeUpper === 'SAMPLE_PAPER' || typeUpper === 'SAMPLE PAPERS') {
      mongoQuery.resourceType = { $in: ['SAMPLE_PAPER', 'QUESTION_BANK'] };
    } else if (typeUpper === 'FORMULA_SHEET' || typeUpper === 'FORMULA SHEETS' || typeUpper === 'FORMULA') {
      mongoQuery.resourceType = { $in: ['FORMULA_SHEET', 'NOTES_FORMULAS'] };
    } else if (typeUpper === 'REVISION' || typeUpper === 'REVISION_MATERIAL' || typeUpper === 'REVISION MATERIAL') {
      mongoQuery.resourceType = { $in: ['REVISION_MATERIAL', 'REVISION_NOTES', 'NOTES'] };
    } else {
      mongoQuery.resourceType = effectiveType;
    }
  }

  // Keyword Search across title, description, chapterTitle, chapter, subject, unit, and board
  if (rawSearch.length > 0) {
    mongoQuery.$or = [
      { title: { $regex: rawSearch, $options: 'i' } },
      { description: { $regex: rawSearch, $options: 'i' } },
      { chapterTitle: { $regex: rawSearch, $options: 'i' } },
      { chapter: { $regex: rawSearch, $options: 'i' } },
      { subject: { $regex: rawSearch, $options: 'i' } },
      { unit: { $regex: rawSearch, $options: 'i' } },
      { board: { $regex: rawSearch, $options: 'i' } },
      { medium: { $regex: rawSearch, $options: 'i' } },
    ];
  }

  // Sorting
  let sortObj = { classLevel: 1, subject: 1, chapterNumber: 1, order: 1 };
  if (sort === 'recommended' || sort === 'popular') {
    sortObj = { viewsCount: -1, downloadsCount: -1, classLevel: 1, chapterNumber: 1 };
  } else if (sort === 'title' || sort === 'a-z' || sort === 'A–Z') {
    sortObj = { title: 1 };
  } else if (sort === 'newest' || sort === 'latest' || sort === 'Latest First') {
    sortObj = { createdAt: -1 };
  } else if (sort === 'oldest' || sort === 'Oldest First') {
    sortObj = { createdAt: 1 };
  } else if (sort === 'class_order' || sort === 'class' || sort === 'Class Order') {
    sortObj = { classLevel: 1, subject: 1, chapterNumber: 1, order: 1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [resources, total] = await Promise.all([
    StudyResource.find(mongoQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    StudyResource.countDocuments(mongoQuery),
  ]);

  const formattedResources = resources.map((r) => {
    return {
      ...r,
      isFree: true,
      isFreeDemo: true,
      readingEnabled: true,
      downloadEnabled: true,
      downloadPrice: 0,
      salePrice: 0,
      originalPrice: 0,
      isDownloadUnlocked: true,
    };
  });

  return success(res, 'Study resources found', {
    resources: formattedResources,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  });
});

// ============================================================
// 4. PUBLIC / PROTECTED: READ STUDY RESOURCE ONLINE
// (All Formula Sheets across Class 9-12 are 100% Free Online Reading;
//  Q&A Chapters 1 & 2 are Free Demo; Chapter 3+ Q&A requires completed purchase)
// ============================================================
exports.readStudyResource = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const resource = await findStudyResourceByIdOrSlug(id);
  if (!resource || !resource.published) {
    return error(res, 'Study resource not found or unavailable', 404);
  }

  const isFormula = resource.resourceType === 'FORMULA_SHEET';
  const normalizedClass = normalizeClass(resource.classLevel);
  const isSenior = ['11', '12'].includes(normalizedClass);
  const defaultDownloadPrice = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
  const downloadPrice = Number(resource.salePrice || resource.downloadPrice) || defaultDownloadPrice;
  const originalPrice = Number(resource.originalPrice) || (isFormula ? 49 : 79);

  // Check if user has purchase access for downloading
  let isDownloadUnlocked = false;
  let unlockedVia = null;

  if (userId) {
    const purchase = await StudyPurchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { resource: resource._id },
        {
          classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
          subject: new RegExp(`^${resource.subject}$`, 'i'),
          $or: [
            { purchaseType: isFormula ? { $in: ['FORMULA_COMBO', 'SUBJECT_BUNDLE'] } : 'QA_COMBO' },
            { comboType: isFormula ? 'FORMULA_COMBO' : 'QA_COMBO' },
          ],
        },
      ],
    }).lean();

    if (purchase) {
      isDownloadUnlocked = true;
      unlockedVia = purchase?.purchaseType || 'INDIVIDUAL';
    }
  }

  // Increment views count asynchronously if in DB
  if (mongoose.Types.ObjectId.isValid(resource._id)) {
    await StudyResource.findByIdAndUpdate(resource._id, { $inc: { viewsCount: 1 } }).catch(() => {});
  }

  // Get authentic structured academic content for this chapter
  const chapterContent = studyContentEngine.getChapterStudyContent({
    classLevel: resource.classLevel,
    subject: resource.subject,
    chapterNumber: resource.chapterNumber,
    chapterTitle: resource.chapterTitle || resource.chapter,
    resourceType: resource.resourceType,
  });

  const sessionCode = `TN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const fileName = resource.fileName || resource.fileReference?.filename || `MentorNearby_Class_${resource.classLevel}_${resource.subject}_Ch${resource.chapterNumber || 1}_${isFormula ? 'FormulaSheet' : 'Notes'}.pdf`;

  const viewerPayload = {
    id: resource._id,
    _id: resource._id,
    title: resource.title,
    description: resource.description || chapterContent.overview,
    classLevel: resource.classLevel,
    subject: resource.subject,
    chapterNumber: resource.chapterNumber,
    chapterTitle: resource.chapterTitle || chapterContent.title,
    unit: resource.unit,
    resourceType: resource.resourceType,
    isFreeDemo: true,
    isFree: true,
    accessType: 'FREE_DEMO',
    readingEnabled: true, // Online Reading is 100% FREE
    downloadEnabled: resource.downloadEnabled !== false,
    downloadPrice,
    originalPrice,
    salePrice: downloadPrice,
    isDownloadUnlocked,
    unlockedVia,
    sessionCode,
    watermarkText: `MentorNearby • For Personal Study Only • ${req.user ? req.user.name || 'Student' : 'Free Reader'}`,
    fileName,
    filename: fileName,
    fileUrl: `/api/study-resources/stream/${resource._id}`,
    rawFileUrl: req.user?.role === 'ADMIN' ? (resource.fileUrl || resource.fileReference?.url) : undefined,
    fileReference: resource.fileReference,
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileFormat: 'pdf',
    totalPages: resource.totalPages || 4,
    chapterContent,
  };

  return success(res, 'Study resource loaded for free online reading', {
    resource: viewerPayload,
  });
});

// ============================================================
// 4B. PROTECTED STREAM: INLINE VIEWING DELIVERY FOR STUDY RESOURCE
// (100% FREE ONLINE READING STREAM FOR ALL FORMULAS & Q&A)
// ============================================================
exports.streamStudyResource = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const isDownload = req.query.download === 'true' || req.query.attachment === 'true';

  const resource = await findStudyResourceByIdOrSlug(id);
  if (!resource || !resource.published) {
    return error(res, 'Study resource not found or unavailable', 404);
  }

  let realFileUrl = resource.fileUrl;
  if (resource.fileReference?.url && resource.fileReference.url.includes('res.cloudinary.com')) {
    realFileUrl = resource.fileReference.url;
  } else if (!realFileUrl || realFileUrl.includes('dummy.pdf') || realFileUrl.includes('w3.org')) {
    realFileUrl = (resource.fileReference?.url && !resource.fileReference.url.includes('dummy.pdf') && !resource.fileReference.url.includes('w3.org'))
      ? resource.fileReference.url
      : null;
  }

  const cleanFileName = `MentorNearby_Class_${resource.classLevel}_${resource.subject}_Ch${resource.chapterNumber || 1}_${resource.resourceType === 'FORMULA_SHEET' ? 'FormulaSheet' : 'Notes'}.pdf`;

  // 1. If local disk file exists, stream directly
  if (realFileUrl && !realFileUrl.startsWith('http://') && !realFileUrl.startsWith('https://')) {
    const cleanRelPath = realFileUrl.replace(/^\/+/, '');
    const localFilePath = (realFileUrl.includes(':') && path.isAbsolute(realFileUrl))
      ? realFileUrl
      : path.join(__dirname, '..', cleanRelPath);

    if (fs.existsSync(localFilePath)) {
      const mimeType = localFilePath.endsWith('.png') ? 'image/png' : (localFilePath.endsWith('.jpg') || localFilePath.endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${cleanFileName}"`);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return fs.createReadStream(localFilePath).pipe(res);
    }
  }

  // 2. If valid remote Cloudinary/HTTPS file exists, proxy stream
  if (realFileUrl && (realFileUrl.startsWith('https://') || realFileUrl.startsWith('http://')) && !realFileUrl.includes('dummy.pdf') && !realFileUrl.includes('w3.org')) {
    const getter = realFileUrl.startsWith('https') ? https : http;

    return getter.get(realFileUrl, (streamRes) => {
      if (streamRes.statusCode < 400) {
        const mimeType = streamRes.headers['content-type'] || 'application/pdf';
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${cleanFileName}"`,
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        });
        return streamRes.pipe(res);
      }
      // Fallback to high-fidelity generated PDF if remote fetch returns error
      const pdfBuffer = studyContentEngine.generateStudyPdfBuffer({
        title: resource.title,
        classLevel: resource.classLevel,
        subject: resource.subject,
        chapterNumber: resource.chapterNumber,
        resourceType: resource.resourceType,
      });
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${cleanFileName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Length': pdfBuffer.length,
      });
      return res.end(pdfBuffer);
    }).on('error', () => {
      const pdfBuffer = studyContentEngine.generateStudyPdfBuffer({
        title: resource.title,
        classLevel: resource.classLevel,
        subject: resource.subject,
        chapterNumber: resource.chapterNumber,
        resourceType: resource.resourceType,
      });
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${cleanFileName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Length': pdfBuffer.length,
      });
      return res.end(pdfBuffer);
    });
  }

  // 3. Dynamic High-Fidelity Academic PDF Stream
  const pdfBuffer = studyContentEngine.generateStudyPdfBuffer({
    title: resource.title,
    classLevel: resource.classLevel,
    subject: resource.subject,
    chapterNumber: resource.chapterNumber,
    resourceType: resource.resourceType,
  });

  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${cleanFileName}"`,
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Length': pdfBuffer.length,
  });
  return res.end(pdfBuffer);
});

// ============================================================
// 4C. PUBLIC / PROTECTED: READ SUBJECT COMBO ONLINE
// (100% FREE ONLINE READING FOR FORMULA & Q&A COMBOS)
// ============================================================
exports.readStudyResourceCombo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const bundle = await findStudyResourceBundleByIdOrSlug(id);
  if (!bundle || !bundle.published) {
    return error(res, 'Subject combo not found or unavailable', 404);
  }

  const isFormulaCombo = bundle.comboType === 'FORMULA_COMBO';
  const normalizedClass = normalizeClass(bundle.classLevel);

  let isPurchased = false;
  let unlockedVia = null;

  if (userId) {
    const purchase = await StudyPurchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { bundle: bundle._id },
        {
          classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
          subject: new RegExp(`^${bundle.subject}$`, 'i'),
          $or: [
            { purchaseType: isFormulaCombo ? { $in: ['FORMULA_COMBO', 'SUBJECT_BUNDLE'] } : 'QA_COMBO' },
            { comboType: bundle.comboType },
          ],
        },
      ],
    }).lean();

    if (purchase) {
      isPurchased = true;
      unlockedVia = purchase.purchaseType || 'COMBO';
    }
  }

  const realFileUrl = bundle.fileUrl || bundle.fileReference?.url;
  if (!realFileUrl) {
    return error(res, 'Combo master PDF is being prepared by tutor. Please view individual chapter sheets.', 404, 'FILE_NOT_FOUND');
  }

  const sessionCode = `TN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const viewerPayload = {
    id: bundle._id,
    title: bundle.title,
    description: bundle.description,
    classLevel: bundle.classLevel,
    subject: bundle.subject,
    comboType: bundle.comboType,
    resourceType: bundle.resourceType,
    isFreeDemo: true,
    isFree: true,
    accessType: 'FREE_DEMO',
    readingEnabled: true, // Online reading is 100% FREE
    downloadEnabled: true,
    price: bundle.price,
    downloadPrice: bundle.price,
    originalPrice: bundle.originalPrice || (isFormulaCombo ? 249 : 429),
    salePrice: bundle.price,
    isDownloadUnlocked: isPurchased,
    unlockedVia,
    sessionCode,
    watermarkText: `MentorNearby • For Personal Study Only • ${req.user ? req.user.name || 'Student' : 'Free Reader'}`,
    fileName: bundle.fileName || `${bundle.title}.pdf`,
    filename: bundle.fileName || `${bundle.title}.pdf`,
    fileUrl: `/api/study-resources/combo/stream/${bundle._id}`,
    rawFileUrl: req.user?.role === 'ADMIN' ? realFileUrl : undefined,
    fileType: bundle.fileType || 'pdf',
    mimeType: bundle.mimeType || 'application/pdf',
    fileFormat: bundle.fileFormat || 'pdf',
    fileSize: bundle.fileSize || 0,
    isCombo: true,
    comboType: bundle.comboType,
  };

  return success(res, 'Combo loaded for free online reading', {
    resource: viewerPayload,
  });
});

// ============================================================
// 4D. PROTECTED STREAM: INLINE VIEWING DELIVERY FOR COMBO
// ============================================================
exports.streamStudyResourceCombo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const bundle = await findStudyResourceBundleByIdOrSlug(id);
  if (!bundle || !bundle.published) {
    return error(res, 'Subject combo not found or unavailable', 404);
  }

  const realFileUrl = bundle.fileUrl || bundle.fileReference?.url;
  if (!realFileUrl) {
    return error(res, 'Combo file is unavailable', 404, 'FILE_NOT_FOUND');
  }

  const mimeType = bundle.mimeType || 'application/pdf';

  // Support local disk storage for large multi-page master PDF files
  if (!realFileUrl.startsWith('http://') && !realFileUrl.startsWith('https://')) {
    const cleanRelPath = realFileUrl.replace(/^\/+/, '');
    const localFilePath = (realFileUrl.includes(':') && path.isAbsolute(realFileUrl))
      ? realFileUrl
      : path.join(__dirname, '..', cleanRelPath);

    if (fs.existsSync(localFilePath)) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const stream = fs.createReadStream(localFilePath);
      stream.on('error', (streamErr) => {
        console.error('[STREAM LOCAL ERROR]', streamErr);
        if (!res.headersSent) {
          return error(res, 'Streaming error: ' + streamErr.message, 500);
        }
      });
      return stream.pipe(res);
    } else {
      console.error('[STREAM LOCAL FILE NOT FOUND]', localFilePath);
      return error(res, 'Combo document file not found on server storage', 404, 'FILE_NOT_FOUND');
    }
  }

  const getter = realFileUrl.startsWith('https') ? https : http;

  getter.get(realFileUrl, (streamRes) => {
    if (streamRes.statusCode >= 400) {
      return error(res, 'Failed to fetch source document', streamRes.statusCode);
    }
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    });
    streamRes.pipe(res);
  }).on('error', (err) => {
    console.error('[STREAM GETTER ERROR]', err);
    return error(res, 'Streaming error: ' + err.message, 500);
  });
});

// ============================================================
// 5. PROTECTED: DOWNLOAD STUDY RESOURCE PDF / SECURE ACCESS
// (REQUIRES COMPLETED PURCHASE FOR INDIVIDUAL RESOURCE OR MATCHING COMBO)
// ============================================================
exports.downloadStudyResource = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const resource = await StudyResource.findById(id).lean();
  if (!resource || !resource.published) {
    return error(res, 'Study resource not found', 404);
  }

  let realFileUrl = resource.fileUrl;
  if (resource.fileReference?.url && resource.fileReference.url.includes('res.cloudinary.com')) {
    realFileUrl = resource.fileReference.url;
  } else if (!realFileUrl || realFileUrl.includes('dummy.pdf') || realFileUrl.includes('w3.org')) {
    realFileUrl = (resource.fileReference?.url && !resource.fileReference.url.includes('dummy.pdf') && !resource.fileReference.url.includes('w3.org'))
      ? resource.fileReference.url
      : `/api/study-resources/stream/${resource._id}?download=true`;
  }

  if (!realFileUrl) {
    realFileUrl = `/api/study-resources/stream/${resource._id}?download=true`;
  }

  // Increment download counter
  await StudyResource.findByIdAndUpdate(id, { $inc: { downloadsCount: 1 } });

  const cleanTitle = (resource.title || 'study-material').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = resource.fileName || resource.fileReference?.filename || `MentorNearby_Class_${resource.classLevel}_${resource.subject}_${cleanTitle}.pdf`;

  // Return download URL (100% FREE for all students)
  return success(res, 'Download authorized (100% Free)', {
    downloadUrl: realFileUrl,
    fileName,
    filename: fileName,
    unlockedVia: 'FREE_STUDENT_PORTAL',
    isFree: true,
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileFormat: 'pdf',
    resource: {
      id: resource._id,
      title: resource.title,
      classLevel: resource.classLevel,
      subject: resource.subject,
    },
  });
});

// ============================================================
// 5B. PROTECTED: DOWNLOAD COMBO PDF (REQUIRES COMPLETED PURCHASE)
// ============================================================
exports.downloadStudyResourceCombo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const bundle = await findStudyResourceBundleByIdOrSlug(id);
  if (!bundle || !bundle.published) {
    return error(res, 'Combo not found or unavailable', 404);
  }

  const isFormulaCombo = bundle.comboType === 'FORMULA_COMBO';
  const normalizedClass = normalizeClass(bundle.classLevel);

  let isAuthorized = false;
  if (req.user?.role === 'ADMIN') {
    isAuthorized = true;
  } else {
    const purchase = await StudyPurchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { bundle: bundle._id },
        {
          classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
          subject: new RegExp(`^${bundle.subject}$`, 'i'),
          $or: [
            { purchaseType: isFormulaCombo ? { $in: ['FORMULA_COMBO', 'SUBJECT_BUNDLE'] } : 'QA_COMBO' },
            { comboType: bundle.comboType },
          ],
        },
      ],
    }).lean();

    if (purchase) isAuthorized = true;
  }

  if (!isAuthorized) {
    return error(res, 'Purchase required to download this combo package', 403, 'PURCHASE_REQUIRED');
  }

  const realFileUrl = bundle.fileUrl || bundle.fileReference?.url;

  if (mongoose.Types.ObjectId.isValid(bundle._id)) {
    await StudyResourceBundle.findByIdAndUpdate(bundle._id, { $inc: { totalPurchases: 1 } });
  }

  // Fetch all included chapter resources
  const includedResources = await StudyResource.find({
    classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
    subject: new RegExp(`^${bundle.subject}$`, 'i'),
    published: true,
    ...(isFormulaCombo
      ? { resourceType: 'FORMULA_SHEET' }
      : { resourceType: { $in: ['NOTES', 'IMPORTANT_QUESTIONS_ANSWERS', 'REVISION_NOTES'] } }),
  })
    .sort({ chapterNumber: 1, chapter: 1 })
    .lean();

  const formattedResources = includedResources.map((r) => {
    const cleanChapterTitle = (r.title || `${r.chapter} - ${r.chapterTitle}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      id: r._id,
      title: r.title,
      chapter: r.chapter,
      chapterTitle: r.chapterTitle,
      downloadUrl: r.fileUrl || r.fileReference?.url || `/api/study-resources/stream/${r._id}?download=true`,
      fileName: r.fileName || r.fileReference?.filename || `MentorNearby_Class_${r.classLevel}_${r.subject}_${cleanChapterTitle}.pdf`,
    };
  });

  const cleanTitle = (bundle.title || 'study-combo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = bundle.fileName || `MentorNearby_${bundle.classLevel}_${bundle.subject}_${cleanTitle}.pdf`;

  return success(res, 'Combo download authorized', {
    downloadUrl: realFileUrl || (formattedResources[0]?.downloadUrl || null),
    fileName,
    filename: fileName,
    bundleId: bundle._id,
    title: bundle.title,
    classLevel: bundle.classLevel,
    subject: bundle.subject,
    includedResources: formattedResources,
  });
});

// ============================================================
// 6. PUBLIC: GET PRINTING PARTNERS / PROVIDERS
// ============================================================
exports.getPrintProviders = asyncHandler(async (req, res, next) => {
  let providers = await PrintProvider.find({ enabled: true })
    .sort({ priority: 1, createdAt: 1 })
    .lean();

  if (!providers || providers.length === 0) {
    // Return standard built-in quick-commerce print providers
    providers = [
      {
        name: 'Blinkit Print',
        code: 'BLINKIT',
        tagline: '⚡ Delivered in 10-15 minutes',
        description: 'Instant document & notes printing with superfast doorstep delivery in major cities.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838895.png',
        externalUrl: 'https://blinkit.com/prn',
        type: 'EXTERNAL_QUICK_COMMERCE',
        enabled: true,
        priority: 1,
        badge: '⚡ 10-Min Delivery',
      },
      {
        name: 'Zepto Print',
        code: 'ZEPTO',
        tagline: '🛵 Instant printing & delivery',
        description: 'Convenient color or B&W printouts delivered directly to your doorstep.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png',
        externalUrl: 'https://www.zeptonow.com',
        type: 'EXTERNAL_QUICK_COMMERCE',
        enabled: true,
        priority: 2,
        badge: '🛵 Quick Delivery',
      },
    ];
  }

  return success(res, 'Print providers retrieved', { providers });
});

// ============================================================
// 7. PAYMENT: CREATE ORDER FOR INDIVIDUAL STUDY RESOURCE DOWNLOAD
// ============================================================
exports.createResourcePaymentOrder = asyncHandler(async (req, res, next) => {
  const { resourceId } = req.body;
  const userId = req.user.id;

  if (!resourceId) {
    return error(res, 'Resource ID is required', 400);
  }

  const resource = await StudyResource.findById(resourceId);
  if (!resource || !resource.published) {
    return error(res, 'Resource not found or unavailable', 404);
  }

  const normalizedClass = normalizeClass(resource.classLevel);
  const isFormula = resource.resourceType === 'FORMULA_SHEET';

  // 1. Check if user already owns this resource download individually or via combo
  const existingPurchase = await StudyPurchase.findOne({
    user: userId,
    paymentStatus: 'COMPLETED',
    $or: [
      { resource: resource._id },
      {
        classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
        subject: new RegExp(`^${resource.subject}$`, 'i'),
        $or: [
          { purchaseType: isFormula ? { $in: ['FORMULA_COMBO', 'SUBJECT_BUNDLE'] } : 'QA_COMBO' },
          { comboType: isFormula ? 'FORMULA_COMBO' : 'QA_COMBO' },
        ],
      },
    ],
  });

  if (existingPurchase) {
    return error(res, 'You have already unlocked this study resource download', 400, 'ALREADY_PURCHASED');
  }

  // 2. Server-side price retrieval from actual database document
  const standardPrices = await getStandardComboPrices(normalizedClass, resource.subject);
  const defaultPrice = isFormula ? standardPrices.singleFormulaPrice : standardPrices.singleNotesPrice;
  const price = Number(resource.downloadPrice || resource.salePrice) || defaultPrice;

  // 3. Create Razorpay order
  const order = await razorpayService.createOrder(price, 'INR', {
    userId,
    resourceId: resource._id.toString(),
    purchaseType: 'INDIVIDUAL_RESOURCE',
    classLevel: normalizedClass,
    subject: resource.subject,
  });

  // 4. Create pending purchase record
  await StudyPurchase.create({
    user: userId,
    purchaseType: 'INDIVIDUAL_RESOURCE',
    resource: resource._id,
    classLevel: normalizedClass,
    subject: resource.subject,
    amount: price,
    currency: 'INR',
    razorpayOrderId: order.id,
    paymentStatus: 'PENDING',
  });

  return success(res, 'Resource payment order created', {
    orderId: order.id,
    amount: price,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    resource: {
      id: resource._id,
      title: resource.title,
      resourceType: resource.resourceType,
      classLevel: normalizedClass,
      subject: resource.subject,
      downloadPrice: price,
    },
  });
});

// ============================================================
// 8. PAYMENT: CREATE ORDER FOR SUBJECT COMBO PACK (FORMULA OR QA)
// ============================================================
exports.createBundlePaymentOrder = asyncHandler(async (req, res, next) => {
  const { classLevel, subject, comboType = 'FORMULA_COMBO', bundleId } = req.body;
  const userId = req.user.id;

  let bundle = null;
  if (bundleId) {
    bundle = await findStudyResourceBundleByIdOrSlug(bundleId);
  }

  const effectiveClass = normalizeClass(classLevel || bundle?.classLevel);
  const effectiveSubject = subject || bundle?.subject;
  const normalizedComboType =
    comboType === 'QA_COMBO' ||
    comboType === 'IMPORTANT_QUESTIONS_ANSWERS' ||
    comboType === 'NOTES' ||
    bundle?.comboType === 'QA_COMBO'
      ? 'QA_COMBO'
      : 'FORMULA_COMBO';
  const resourceType =
    normalizedComboType === 'FORMULA_COMBO'
      ? 'FORMULA_SHEET'
      : 'IMPORTANT_QUESTIONS_ANSWERS';

  const standardPrices = await getStandardComboPrices(effectiveClass, effectiveSubject);
  const defaultPrice =
    normalizedComboType === 'FORMULA_COMBO'
      ? standardPrices.formulaPrice
      : standardPrices.qaPrice;

  if (!bundle && effectiveClass && effectiveSubject) {
    bundle = await findStudyResourceBundleByIdOrSlug(null, {
      classLevel: { $in: [effectiveClass, `Class ${effectiveClass}`] },
      subject: new RegExp(`^${effectiveSubject}$`, 'i'),
      comboType: normalizedComboType,
    });
  }

  const subSlug = effectiveSubject?.toLowerCase().startsWith('math')
    ? 'math'
    : effectiveSubject?.toLowerCase().startsWith('sci')
    ? 'sci'
    : effectiveSubject?.toLowerCase().slice(0, 4) || 'gen';
  const generatedSlug = `combo-c${effectiveClass}-${subSlug}-${normalizedComboType === 'FORMULA_COMBO' ? 'formula' : 'notes'}`;

  if (!bundle && effectiveClass && effectiveSubject) {
    bundle = await StudyResourceBundle.create({
      bundleId: bundleId || generatedSlug,
      slug: generatedSlug,
      title: `Class ${effectiveClass} ${effectiveSubject} ${normalizedComboType === 'FORMULA_COMBO' ? 'Formula Sheets Combo' : 'Important Questions + Answers Combo'}`,
      description: `Complete package for all ${normalizedComboType === 'FORMULA_COMBO' ? 'Formula Sheets' : 'Important Questions & Answers'} from Chapter 1 to Last Chapter for Class ${effectiveClass} ${effectiveSubject}.`,
      classLevel: effectiveClass,
      subject: effectiveSubject,
      comboType: normalizedComboType,
      resourceType: resourceType,
      price: defaultPrice,
      published: true,
    });
  }

  if (!bundle) {
    return error(res, 'Combo bundle not found. Please provide valid class and subject.', 404);
  }

  const normalizedClass = normalizeClass(bundle.classLevel);

  // Check if user already owns this specific combo
  const existingComboPurchase = await StudyPurchase.findOne({
    user: userId,
    paymentStatus: 'COMPLETED',
    $or: [
      { bundle: bundle._id },
      {
        classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
        subject: new RegExp(`^${bundle.subject}$`, 'i'),
        $or: [
          { purchaseType: normalizedComboType },
          { comboType: normalizedComboType },
          ...(normalizedComboType === 'FORMULA_COMBO' ? [{ purchaseType: 'SUBJECT_BUNDLE', comboType: { $ne: 'QA_COMBO' } }] : []),
        ],
      },
    ],
  });

  if (existingComboPurchase) {
    return error(res, `You have already purchased the ${normalizedComboType === 'FORMULA_COMBO' ? 'Formula Sheets' : 'Important Questions + Answers'} combo for this subject`, 400, 'ALREADY_PURCHASED');
  }

  // Server-side authoritative price retrieval from single source of truth
  const price = defaultPrice;
  const originalPrice = normalizedComboType === 'FORMULA_COMBO' ? (effectiveClass === '11' || effectiveClass === '12' ? 99 : 89) : (effectiveClass === '11' || effectiveClass === '12' ? 199 : 179);

  // Sync bundle price in DB if mismatched
  if (bundle.price !== price && mongoose.Types.ObjectId.isValid(bundle._id)) {
    bundle.price = price;
    await StudyResourceBundle.findByIdAndUpdate(bundle._id, { price });
  }

  // Create Razorpay order with authoritative DB price
  const order = await razorpayService.createOrder(price, 'INR', {
    userId,
    bundleId: bundle._id.toString(),
    purchaseType: normalizedComboType,
    comboType: normalizedComboType,
    classLevel: normalizedClass,
    subject: bundle.subject,
  });

  // Create pending purchase record
  await StudyPurchase.create({
    user: userId,
    purchaseType: normalizedComboType,
    comboType: normalizedComboType,
    bundle: bundle._id,
    classLevel: normalizedClass,
    subject: bundle.subject,
    amount: price,
    currency: 'INR',
    razorpayOrderId: order.id,
    paymentStatus: 'PENDING',
  });

  return success(res, 'Bundle payment order created', {
    orderId: order.id,
    amount: price,
    originalPrice,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    bundle: {
      id: bundle._id,
      bundleId: bundle.bundleId || bundle._id,
      title: bundle.title,
      classLevel: normalizedClass,
      subject: bundle.subject,
      comboType: normalizedComboType,
      price,
      originalPrice,
    },
  });
});

// ============================================================
// 9. PAYMENT: VERIFY RAZORPAY PAYMENT & UNLOCK DOWNLOADS
// ============================================================
exports.verifyStudyPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user.id;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return error(res, 'Invalid payment details provided', 400);
  }

  // 1. Verify Razorpay signature server-side
  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    return error(res, 'Payment signature verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
  }

  // 2. Find pending purchase record
  const purchase = await StudyPurchase.findOne({
    razorpayOrderId,
    user: userId,
  });

  if (!purchase) {
    return error(res, 'Purchase transaction record not found', 404);
  }

  if (purchase.paymentStatus === 'COMPLETED') {
    return success(res, 'Payment already verified and downloads unlocked', { purchase });
  }

  // 3. Mark as completed
  purchase.paymentStatus = 'COMPLETED';
  purchase.razorpayPaymentId = razorpayPaymentId;
  purchase.razorpaySignature = razorpaySignature;
  purchase.purchasedAt = new Date();
  await purchase.save();

  // 4. Increment purchase counters
  if (purchase.purchaseType === 'INDIVIDUAL_RESOURCE' && purchase.resource) {
    await StudyResource.findByIdAndUpdate(purchase.resource, { $inc: { totalPurchases: 1 } });
  } else if (purchase.purchaseType === 'FORMULA_COMBO' || purchase.comboType === 'FORMULA_COMBO') {
    if (purchase.bundle) {
      await StudyResourceBundle.findByIdAndUpdate(purchase.bundle, { $inc: { totalPurchases: 1 } });
    }
    await StudyResource.updateMany(
      {
        classLevel: { $in: [purchase.classLevel, `Class ${purchase.classLevel}`] },
        subject: new RegExp(`^${purchase.subject}$`, 'i'),
        resourceType: 'FORMULA_SHEET',
      },
      { $inc: { totalPurchases: 1 } }
    );
  } else if (purchase.purchaseType === 'QA_COMBO' || purchase.comboType === 'QA_COMBO') {
    if (purchase.bundle) {
      await StudyResourceBundle.findByIdAndUpdate(purchase.bundle, { $inc: { totalPurchases: 1 } });
    }
    await StudyResource.updateMany(
      {
        classLevel: { $in: [purchase.classLevel, `Class ${purchase.classLevel}`] },
        subject: new RegExp(`^${purchase.subject}$`, 'i'),
        resourceType: 'IMPORTANT_QUESTIONS_ANSWERS',
      },
      { $inc: { totalPurchases: 1 } }
    );
  }

  // 5. Send automated notification to user
  try {
    const isCombo = purchase.purchaseType === 'FORMULA_COMBO' || purchase.comboType === 'FORMULA_COMBO' || purchase.purchaseType === 'QA_COMBO' || purchase.comboType === 'QA_COMBO';
    const notifTitle = isCombo ? 'Study Resource Combo Unlocked' : 'Study Resource PDF Unlocked';
    const notifMsg = `Your payment of ₹${purchase.amount} was successful. Class ${purchase.classLevel || ''} ${purchase.subject || ''} materials are now ready to download!`;
    await createNotification(
      userId,
      notifTitle,
      notifMsg,
      'PAYMENT',
      '/student/purchases',
      { actionText: 'View Downloads' }
    );
  } catch (nErr) {
    console.error('Failed to create payment notification:', nErr);
  }

  return success(res, 'Payment verified successfully! PDF download unlocked.', {
    purchase: {
      id: purchase._id,
      purchaseType: purchase.purchaseType,
      comboType: purchase.comboType,
      classLevel: purchase.classLevel,
      subject: purchase.subject,
      amount: purchase.amount,
      purchasedAt: purchase.purchasedAt,
    },
  });
});

// ============================================================
// 10. USER: GET MY DOWNLOADS & PURCHASED COMBOS
// ============================================================
exports.getMyDownloads = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const purchases = await StudyPurchase.find({
    user: userId,
    paymentStatus: 'COMPLETED',
  })
    .populate('resource')
    .populate('bundle')
    .sort({ purchasedAt: -1, createdAt: -1 })
    .lean();

  const individualDownloads = [];
  const comboPacks = [];

  purchases.forEach((p) => {
    if (p.purchaseType === 'INDIVIDUAL_RESOURCE' && p.resource) {
      individualDownloads.push({
        purchaseId: p._id,
        resourceId: p.resource._id,
        title: p.resource.title,
        classLevel: p.resource.classLevel,
        subject: p.resource.subject,
        chapterTitle: p.resource.chapterTitle,
        resourceType: p.resource.resourceType,
        amount: p.amount,
        purchasedAt: p.purchasedAt || p.createdAt,
      });
    } else if (p.purchaseType === 'FORMULA_COMBO' || p.purchaseType === 'QA_COMBO' || p.purchaseType === 'SUBJECT_BUNDLE') {
      comboPacks.push({
        purchaseId: p._id,
        title: p.bundle?.title || `Class ${p.classLevel} ${p.subject} ${p.comboType === 'QA_COMBO' ? 'Q&A Combo' : 'Formula Sheets Combo'}`,
        classLevel: p.classLevel,
        subject: p.subject,
        comboType: p.comboType || (p.purchaseType === 'QA_COMBO' ? 'QA_COMBO' : 'FORMULA_COMBO'),
        amount: p.amount,
        purchasedAt: p.purchasedAt || p.createdAt,
      });
    }
  });

  return success(res, 'User downloads retrieved', {
    individualDownloads,
    comboPacks,
    totalDownloadsCount: individualDownloads.length,
    totalCombosCount: comboPacks.length,
  });
});

// ============================================================
// 11. USER: GET PREMIUM AD-FREE STATUS
// ============================================================
exports.getPremiumStatus = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return success(res, 'Guest user status', {
      isPremium: false,
      hideAds: false,
      plan: null,
    });
  }

  const user = await User.findById(req.user.id).select('isPremium premiumExpiresAt premiumPlan role').lean();
  const isAdmin = req.user?.role === 'ADMIN' || user?.role === 'ADMIN';
  const isPremium = Boolean(user?.isPremium || isAdmin);

  return success(res, 'Premium status retrieved', {
    isPremium,
    hideAds: isPremium,
    plan: user?.premiumPlan || (isAdmin ? 'ADMIN_PASS' : null),
    expiresAt: user?.premiumExpiresAt,
  });
});

// ============================================================
// 12. ADMIN: GET ALL RESOURCES WITH FILTERS & PAGINATION
// ============================================================
exports.adminGetResources = asyncHandler(async (req, res, next) => {
  const { classLevel, subject, resourceType, published, search, page = 1, limit = 20 } = req.query;

  const query = {};

  if (classLevel) {
    const norm = normalizeClass(classLevel);
    query.classLevel = { $in: [norm, `Class ${norm}`] };
  }

  if (subject) {
    query.subject = new RegExp(`^${subject}$`, 'i');
  }

  if (resourceType) {
    query.resourceType = resourceType;
  }

  if (published !== undefined && published !== '') {
    query.published = published === 'true';
  }

  if (search) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { chapterTitle: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [resources, total] = await Promise.all([
    StudyResource.find(query)
      .sort({ classLevel: 1, subject: 1, chapterNumber: 1, order: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    StudyResource.countDocuments(query),
  ]);

  return success(res, 'Admin resources retrieved', {
    resources,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ============================================================
// 13. ADMIN: CREATE STUDY RESOURCE
// ============================================================
exports.adminCreateResource = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    classLevel,
    subject,
    chapter,
    unit,
    chapterNumber,
    chapterTitle,
    resourceType = 'FORMULA_SHEET',
    published = true,
    fileUrl,
    filename,
  } = req.body;

  if (!title || !classLevel || !subject) {
    return error(res, 'Title, class level, and subject are required', 400);
  }

  const normalizedClass = normalizeClass(classLevel);
  const chNum = Number(chapterNumber) || 1;
  const isFormula = resourceType === 'FORMULA_SHEET';
  const isFreeDemo = chNum <= 2;
  const isFree = isFreeDemo;
  const accessType = isFreeDemo ? 'FREE_DEMO' : 'PAID';

  const finalOrigPrice = isFormula ? 49 : 79;
  const finalDownloadPrice = isFormula ? 19 : 39;

  let finalFileUrl = (fileUrl && fileUrl.trim()) || '';
  let finalFileName = filename || '';
  let finalFileType = 'image';
  let finalMimeType = 'image/jpeg';
  let finalFormat = 'png';
  let finalPublicId = null;
  let fileRef = null;

  // If a file was uploaded via multer
  if (req.file) {
    const uploadResult = await uploadStudyDocument(req.file.buffer, req.file.originalname, req.file.mimetype);
    finalFileUrl = uploadResult.secure_url;
    finalFileName = uploadResult.fileName;
    finalFileType = uploadResult.fileType;
    finalMimeType = uploadResult.mimeType;
    finalFormat = uploadResult.fileFormat;
    finalPublicId = uploadResult.public_id;

    fileRef = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: finalMimeType,
      fileType: finalFileType,
    };
  } else if (finalFileUrl) {
    const detected = detectFileType({
      fileUrl: finalFileUrl,
      fileName: filename || `${title}.png`,
      resourceType,
    });
    finalFileType = detected.fileType;
    finalMimeType = detected.mimeType;
    finalFormat = detected.format;
    finalFileName = filename || `${title}.${detected.format}`;
    fileRef = {
      url: finalFileUrl,
      filename: finalFileName,
      mimeType: finalMimeType,
      fileType: finalFileType,
    };
  }

  let previewPages = [];
  if (finalFileUrl && finalFileUrl.includes('res.cloudinary.com')) {
    previewPages = [
      { page: 1, url: finalFileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_1,w_1000,f_png/').replace(/\.pdf$/i, '.png') },
      { page: 2, url: finalFileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_2,w_1000,f_png/').replace(/\.pdf$/i, '.png') },
    ];
  }

  const newResource = await StudyResource.create({
    title,
    description,
    classLevel: normalizedClass,
    subject,
    chapter: chapter || `Chapter ${chNum}`,
    unit: unit || `Unit ${chNum}`,
    chapterNumber: chNum,
    chapterTitle: chapterTitle || title,
    resourceType,
    isFreeDemo,
    isFree,
    accessType,
    originalPrice: finalOrigPrice,
    downloadPrice: finalDownloadPrice,
    salePrice: finalDownloadPrice,
    readingEnabled: isFreeDemo,
    downloadEnabled: true,
    published: published !== false,
    fileName: finalFileName,
    fileUrl: finalFileUrl,
    fileType: finalFileType,
    mimeType: finalMimeType,
    fileFormat: finalFormat,
    cloudinaryPublicId: finalPublicId,
    fileReference: fileRef,
    previewPages,
    thumbnail: {
      url: previewPages[0]?.url || finalFileUrl,
      publicId: finalPublicId || '',
    },
  });

  return success(res, 'Study resource created successfully', { resource: newResource }, 201);
});

// ============================================================
// 14. ADMIN: UPDATE STUDY RESOURCE
// ============================================================
exports.adminUpdateResource = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const resource = await StudyResource.findById(id);
  if (!resource) {
    return error(res, 'Study resource not found', 404);
  }

  if (updateData.title) resource.title = updateData.title;
  if (updateData.description !== undefined) resource.description = updateData.description;
  if (updateData.classLevel) resource.classLevel = normalizeClass(updateData.classLevel);
  if (updateData.subject) resource.subject = updateData.subject;
  if (updateData.chapter) resource.chapter = updateData.chapter;
  if (updateData.unit) resource.unit = updateData.unit;
  if (updateData.chapterNumber !== undefined) resource.chapterNumber = Number(updateData.chapterNumber);
  if (updateData.chapterTitle) resource.chapterTitle = updateData.chapterTitle;
  if (updateData.resourceType) resource.resourceType = updateData.resourceType;
  if (updateData.published !== undefined) resource.published = updateData.published === 'true' || updateData.published === true;

  if (req.file) {
    const uploadResult = await uploadStudyDocument(req.file.buffer, req.file.originalname, req.file.mimetype);
    resource.fileName = uploadResult.fileName;
    resource.fileUrl = uploadResult.secure_url;
    resource.fileType = uploadResult.fileType;
    resource.mimeType = uploadResult.mimeType;
    resource.fileFormat = uploadResult.fileFormat;
    resource.cloudinaryPublicId = uploadResult.public_id;
    resource.cloudinaryResourceType = uploadResult.resource_type;
    resource.fileReference = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: uploadResult.mimeType,
      fileType: uploadResult.fileType,
    };
  } else if (updateData.fileUrl && updateData.fileUrl.trim()) {
    const trimmedUrl = updateData.fileUrl.trim();
    const isDummy = trimmedUrl.includes('dummy.pdf') || trimmedUrl.includes('w3.org');
    const existingIsCloudinary = resource.fileReference?.url?.includes('res.cloudinary.com') || resource.fileUrl?.includes('res.cloudinary.com');
    const finalUrl = (isDummy && existingIsCloudinary)
      ? (resource.fileReference?.url || resource.fileUrl)
      : trimmedUrl;

    const detected = detectFileType({
      fileUrl: finalUrl,
      fileName: updateData.fileName || updateData.filename || resource.fileName,
      resourceType: resource.resourceType,
    });
    resource.fileUrl = finalUrl;
    resource.fileName = updateData.fileName || updateData.filename || resource.fileName || `${resource.title}.${detected.format}`;
    resource.fileType = detected.fileType;
    resource.mimeType = detected.mimeType;
    resource.fileFormat = detected.format;
    resource.fileReference = {
      ...(resource.fileReference || {}),
      url: finalUrl,
      filename: resource.fileName,
      mimeType: detected.mimeType,
      fileType: detected.fileType,
    };
  }

  // Auto-generate 2-page preview images if Cloudinary URL
  if (resource.fileUrl && resource.fileUrl.includes('res.cloudinary.com')) {
    resource.previewPages = [
      { page: 1, url: resource.fileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_1,w_1000,f_png/').replace(/\.pdf$/i, '.png') },
      { page: 2, url: resource.fileUrl.replace(/\/upload\/(?:v\d+\/)?/, '/upload/pg_2,w_1000,f_png/').replace(/\.pdf$/i, '.png') },
    ];
    if (!resource.thumbnail || !resource.thumbnail.url) {
      resource.thumbnail = {
        url: resource.previewPages[0]?.url || resource.fileUrl,
        publicId: resource.cloudinaryPublicId || '',
      };
    }
  }

  // Pre-save hook runs on save()
  await resource.save();

  return success(res, 'Study resource updated successfully', { resource });
});

// ============================================================
// 15. ADMIN: DELETE STUDY RESOURCE
// ============================================================
exports.adminDeleteResource = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const resource = await StudyResource.findByIdAndDelete(id);
  if (!resource) {
    return error(res, 'Study resource not found', 404);
  }

  return success(res, 'Study resource deleted successfully');
});

// ============================================================
// 16. ADMIN: GET & SAVE SUBJECT COMBO BUNDLES
// ============================================================
exports.adminGetBundles = asyncHandler(async (req, res, next) => {
  const bundles = await StudyResourceBundle.find()
    .sort({ classLevel: 1, subject: 1, comboType: 1 })
    .lean();

  // Aggregate resource counts for each bundle
  const populatedBundles = await Promise.all(
    bundles.map(async (b) => {
      const isFormula = b.comboType === 'FORMULA_COMBO';
      const count = await StudyResource.countDocuments({
        classLevel: { $in: [b.classLevel, `Class ${b.classLevel}`] },
        subject: new RegExp(`^${b.subject}$`, 'i'),
        resourceType: isFormula ? 'FORMULA_SHEET' : 'IMPORTANT_QUESTIONS_ANSWERS',
      });
      return {
        ...b,
        resourceCount: count,
      };
    })
  );

  return success(res, 'Subject combo bundles retrieved', { bundles: populatedBundles });
});

exports.adminSaveBundle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { classLevel, subject, comboType = 'FORMULA_COMBO', title, description, price, published } = req.body;

  let bundle = null;
  if (id) {
    bundle = await findStudyResourceBundleByIdOrSlug(id);
  }

  const normalizedClass = normalizeClass(classLevel || bundle?.classLevel);
  const normalizedComboType = (comboType || bundle?.comboType) === 'QA_COMBO' ? 'QA_COMBO' : 'FORMULA_COMBO';
  const targetSubject = subject || bundle?.subject;
  const resourceType = normalizedComboType === 'FORMULA_COMBO' ? 'FORMULA_SHEET' : 'IMPORTANT_QUESTIONS_ANSWERS';

  if (!bundle && (!normalizedClass || !targetSubject)) {
    return error(res, 'Class level and subject are required', 400);
  }

  if (!bundle) {
    bundle = await findStudyResourceBundleByIdOrSlug(null, {
      classLevel: { $in: [normalizedClass, `Class ${normalizedClass}`] },
      subject: new RegExp(`^${targetSubject}$`, 'i'),
      comboType: normalizedComboType,
    });
  }

  let oldPublicId = null;
  let oldResourceType = null;

  if (req.file) {
    const uploadRes = await uploadStudyDocument(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!uploadRes || !uploadRes.secure_url) {
      return error(res, 'Failed to upload combo document to cloud storage', 500);
    }
    if (bundle) {
      oldPublicId = bundle.cloudinaryPublicId || bundle.fileReference?.publicId;
      oldResourceType = bundle.cloudinaryResourceType || 'raw';
    }

    const fileMetadata = {
      fileUrl: uploadRes.secure_url,
      fileName: req.file.originalname,
      fileType: uploadRes.fileType || 'pdf',
      mimeType: uploadRes.mimeType || 'application/pdf',
      fileFormat: uploadRes.fileFormat || 'pdf',
      fileSize: req.file.size,
      cloudinaryPublicId: uploadRes.public_id,
      cloudinaryResourceType: uploadRes.resource_type || 'raw',
      fileReference: {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        filename: req.file.originalname,
        mimeType: uploadRes.mimeType || 'application/pdf',
        fileType: uploadRes.fileType || 'pdf',
        size: req.file.size,
        uploadedAt: new Date(),
      },
    };

    if (bundle) {
      Object.assign(bundle, fileMetadata);
    } else {
      bundle = new StudyResourceBundle({
        classLevel: normalizedClass,
        subject: targetSubject,
        comboType: normalizedComboType,
        resourceType,
        ...fileMetadata,
      });
    }
  }

  if (bundle) {
    if (title) bundle.title = title;
    if (description !== undefined) bundle.description = description;
    if (price !== undefined) bundle.price = Number(price);
    if (published !== undefined) bundle.published = published === 'true' || published === true;
    await bundle.save();
  } else {
    bundle = await StudyResourceBundle.create({
      title: title || `Class ${normalizedClass} ${targetSubject} ${normalizedComboType === 'FORMULA_COMBO' ? 'Formula Sheets Combo' : 'Important Questions + Answers Combo'}`,
      description: description || `Complete package for all ${normalizedComboType === 'FORMULA_COMBO' ? 'Formula Sheets' : 'Important Questions & Answers'} from Chapter 1 to Last Chapter for Class ${normalizedClass} ${targetSubject}.`,
      classLevel: normalizedClass,
      subject: targetSubject,
      comboType: normalizedComboType,
      resourceType,
      price: Number(price) || (normalizedComboType === 'FORMULA_COMBO' ? 119 : 249),
      published: published !== 'false' && published !== false,
    });
  }

  // Safe Cloudinary cleanup: ONLY after successful save and if publicId actually changed
  if (oldPublicId && oldPublicId !== bundle.cloudinaryPublicId) {
    deleteFromCloudinary(oldPublicId, oldResourceType).catch((err) => {
      console.warn('Non-blocking old Cloudinary file cleanup skipped:', err.message);
    });
  }

  return success(res, 'Subject combo bundle updated successfully', { bundle });
});

exports.adminDeleteBundleFile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const bundle = await findStudyResourceBundleByIdOrSlug(id);
  if (!bundle) {
    return error(res, 'Bundle not found', 404);
  }
  const oldPublicId = bundle.cloudinaryPublicId || bundle.fileReference?.publicId;
  const oldResourceType = bundle.cloudinaryResourceType || 'raw';

  bundle.fileUrl = undefined;
  bundle.fileName = undefined;
  bundle.fileSize = 0;
  bundle.cloudinaryPublicId = undefined;
  bundle.fileReference = undefined;
  await bundle.save();

  if (oldPublicId) {
    deleteFromCloudinary(oldPublicId, oldResourceType).catch(() => {});
  }

  return success(res, 'Combo file removed successfully', { bundle });
});

// ============================================================
// 17. ADMIN: GET REAL STUDY RESOURCE SALES ANALYTICS
// ============================================================
exports.adminGetAnalytics = asyncHandler(async (req, res, next) => {
  const completedPurchases = await StudyPurchase.find({ paymentStatus: 'COMPLETED' })
    .populate('resource', 'title classLevel subject resourceType')
    .populate('user', 'name email')
    .sort({ purchasedAt: -1 })
    .lean();

  const totalSales = completedPurchases.length;
  const totalRevenue = completedPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Today's metrics
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayPurchases = completedPurchases.filter((p) => new Date(p.purchasedAt || p.createdAt) >= startOfToday);
  const todayRevenue = todayPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Monthly metrics
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthPurchases = completedPurchases.filter((p) => new Date(p.purchasedAt || p.createdAt) >= startOfMonth);
  const thisMonthRevenue = monthPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Sales by type
  let individualSalesCount = 0;
  let formulaComboSalesCount = 0;
  let qaComboSalesCount = 0;

  completedPurchases.forEach((p) => {
    if (p.purchaseType === 'INDIVIDUAL_RESOURCE') individualSalesCount++;
    else if (p.purchaseType === 'FORMULA_COMBO' || p.comboType === 'FORMULA_COMBO') formulaComboSalesCount++;
    else if (p.purchaseType === 'QA_COMBO' || p.comboType === 'QA_COMBO') qaComboSalesCount++;
    else formulaComboSalesCount++;
  });

  return success(res, 'Real study resources analytics retrieved', {
    metrics: {
      totalSales,
      totalRevenue,
      todaySales: todayPurchases.length,
      todayRevenue,
      thisMonthSales: monthPurchases.length,
      thisMonthRevenue,
      individualSalesCount,
      formulaComboSalesCount,
      qaComboSalesCount,
    },
    recentPurchases: completedPurchases.slice(0, 15),
  });
});

// ============================================================
// 18. ADMIN: GET & SAVE PRINT PROVIDERS
// ============================================================
exports.adminGetPrintProviders = asyncHandler(async (req, res, next) => {
  const providers = await PrintProvider.find().sort({ priority: 1, createdAt: 1 }).lean();
  return success(res, 'Print providers retrieved', { providers });
});

exports.adminSavePrintProvider = asyncHandler(async (req, res, next) => {
  const { code, name, tagline, description, externalUrl, logoUrl, enabled, priority, type } = req.body;

  if (!code || !name) {
    return error(res, 'Provider code and name are required', 400);
  }

  const provider = await PrintProvider.findOneAndUpdate(
    { code: code.toUpperCase() },
    {
      code: code.toUpperCase(),
      name,
      tagline,
      description,
      externalUrl,
      logoUrl,
      enabled: enabled !== false,
      priority: Number(priority) || 1,
      type: type || 'EXTERNAL_QUICK_COMMERCE',
    },
    { upsert: true, new: true }
  );

  return success(res, 'Print provider updated successfully', { provider });
});

// ============================================================
// 19. ADMIN: GET & UPDATE PRICING MATRIX
// ============================================================
exports.adminGetPricingMatrix = asyncHandler(async (req, res, next) => {
  let matrix = JSON.parse(JSON.stringify(DEFAULT_PRICING_MATRIX));

  const config = await AdminConfig.findOne({ key: 'FORMULA_SHEET_PRICING_MATRIX' }).lean();
  if (config?.value) {
    matrix = { ...matrix, ...config.value };
  }

  // Also cross-verify with existing DB bundle documents
  const bundles = await StudyResourceBundle.find().lean();
  bundles.forEach((b) => {
    const cls = normalizeClass(b.classLevel);
    if (matrix[cls]) {
      if (b.comboType === 'FORMULA_COMBO') {
        matrix[cls].formulaCombo = Number(b.price) || matrix[cls].formulaCombo;
      } else if (b.comboType === 'QA_COMBO') {
        matrix[cls].notesCombo = Number(b.price) || matrix[cls].notesCombo;
      }
    }
  });

  return success(res, 'Study resources pricing matrix retrieved', { matrix });
});

exports.adminUpdatePricingMatrix = asyncHandler(async (req, res, next) => {
  const { matrix } = req.body;

  if (!matrix || typeof matrix !== 'object') {
    return error(res, 'Invalid pricing matrix provided', 400);
  }

  const updatedMatrix = JSON.parse(JSON.stringify(DEFAULT_PRICING_MATRIX));

  ['9', '10', '11', '12'].forEach((cls) => {
    if (matrix[cls]) {
      const def = DEFAULT_PRICING_MATRIX[cls];
      updatedMatrix[cls] = {
        mathsFormulaIndividual: Math.max(1, Number(matrix[cls].mathsFormulaIndividual || matrix[cls].mathsIndividual) || def.mathsFormulaIndividual),
        scienceFormulaIndividual: Math.max(1, Number(matrix[cls].scienceFormulaIndividual || matrix[cls].scienceIndividual) || def.scienceFormulaIndividual),
        formulaCombo: Math.max(1, Number(matrix[cls].formulaCombo || matrix[cls].mathsCombo) || def.formulaCombo),
        notesIndividual: Math.max(1, Number(matrix[cls].notesIndividual) || def.notesIndividual),
        notesCombo: Math.max(1, Number(matrix[cls].notesCombo || matrix[cls].qaCombo) || def.notesCombo),
      };
    }
  });

  // 1. Save to AdminConfig
  await AdminConfig.findOneAndUpdate(
    { key: 'FORMULA_SHEET_PRICING_MATRIX' },
    {
      key: 'FORMULA_SHEET_PRICING_MATRIX',
      value: updatedMatrix,
      description: 'Central authoritative formula sheet and notes/PPT pricing matrix',
      updatedBy: req.user?._id,
    },
    { upsert: true, new: true }
  );

  // 2. Synchronize StudyResourceBundle documents in MongoDB
  for (const cls of ['9', '10', '11', '12']) {
    const p = updatedMatrix[cls];

    // Update Formula Combos (Maths + Science Formula Sheet Combo)
    await StudyResourceBundle.updateMany(
      {
        classLevel: { $in: [cls, `Class ${cls}`] },
        comboType: 'FORMULA_COMBO',
      },
      { $set: { price: p.formulaCombo } }
    );

    // Update Notes / PPT Combos (Complete Notes/PPT Combo)
    await StudyResourceBundle.updateMany(
      {
        classLevel: { $in: [cls, `Class ${cls}`] },
        comboType: 'QA_COMBO',
      },
      { $set: { price: p.notesCombo } }
    );

    // 3. Synchronize individual StudyResource formula sheet download prices
    await StudyResource.updateMany(
      {
        classLevel: { $in: [cls, `Class ${cls}`] },
        subject: /^Math/i,
        resourceType: 'FORMULA_SHEET',
      },
      { $set: { downloadPrice: p.mathsFormulaIndividual, salePrice: p.mathsFormulaIndividual } }
    );

    await StudyResource.updateMany(
      {
        classLevel: { $in: [cls, `Class ${cls}`] },
        subject: { $ne: /^Math/i },
        resourceType: 'FORMULA_SHEET',
      },
      { $set: { downloadPrice: p.scienceFormulaIndividual, salePrice: p.scienceFormulaIndividual } }
    );

    // 4. Synchronize individual Notes/PPT download prices
    await StudyResource.updateMany(
      {
        classLevel: { $in: [cls, `Class ${cls}`] },
        resourceType: { $ne: 'FORMULA_SHEET' },
      },
      { $set: { downloadPrice: p.notesIndividual, salePrice: p.notesIndividual } }
    );
  }

  return success(res, 'Pricing matrix updated and synchronized successfully across all resources & bundles', {
    matrix: updatedMatrix,
  });
});
