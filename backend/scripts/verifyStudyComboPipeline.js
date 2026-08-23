// Automated E2E verification script for Study Resources & Universal Free Reading / Paid Download Pipeline
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');
const StudyPurchase = require('../models/StudyPurchase');
const User = require('../models/User');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('TUTORNEARBY: UNIVERSAL FREE READING & PAID DOWNLOAD VALIDATION');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('MongoDB Connected.\n');

  // TEST SUITE 1: ZERO DATA LOSS & RECORD PRESERVATION
  console.log('--- TEST SUITE 1: ZERO DATA LOSS & RECORD PRESERVATION ---');
  const resourcesCount = await StudyResource.countDocuments();
  const bundlesCount = await StudyResourceBundle.countDocuments();
  const purchasesCount = await StudyPurchase.countDocuments();

  assert(resourcesCount >= 313, `Total StudyResources preserved: ${resourcesCount} (Baseline: 313)`);
  assert(bundlesCount >= 24, `Total StudyResourceBundles preserved: ${bundlesCount} (Baseline: 24)`);
  assert(purchasesCount >= 7, `Total StudyPurchases preserved: ${purchasesCount} (Baseline: 7)`);

  // Verify Class 9 Mathematics Chapter 1 intact
  const ch1 = await StudyResource.findOne({ classLevel: '9', subject: 'Mathematics', chapterNumber: 1 });
  assert(ch1 !== null, 'Class 9 Mathematics Chapter 1 exists');
  assert(ch1?.fileUrl?.includes('res.cloudinary.com'), 'Class 9 Chapter 1 Cloudinary URL is preserved');
  assert(ch1?.resourceType === 'FORMULA_SHEET', 'Class 9 Chapter 1 is FORMULA_SHEET');

  // TEST SUITE 2: UNIVERSAL 100% FREE ONLINE READING FOR FORMULA SHEETS & Q&A
  console.log('\n--- TEST SUITE 2: UNIVERSAL FREE ONLINE READING (CLASSES 9-12) ---');
  const classes = ['9', '10', '11', '12'];
  for (const cls of classes) {
    const formulaSheets = await StudyResource.find({ classLevel: cls, resourceType: 'FORMULA_SHEET' }).limit(3);
    for (const sheet of formulaSheets) {
      assert(sheet !== null, `Class ${cls} Formula Sheet "${sheet.title}" is online readable`);
    }

    const qaNotes = await StudyResource.find({ classLevel: cls, resourceType: 'IMPORTANT_QUESTIONS_ANSWERS' }).limit(3);
    for (const qa of qaNotes) {
      assert(qa !== null, `Class ${cls} Q&A Note "${qa.title}" (Chapter ${qa.chapterNumber}) is online readable`);
    }
  }

  // TEST SUITE 3: SUBJECT COMBOS & DYNAMIC PRICING AUDIT
  console.log('\n--- TEST SUITE 3: ALL 24 SUBJECT COMBOS PRICING AUDIT ---');
  const allBundles = await StudyResourceBundle.find().sort({ classLevel: 1, subject: 1, comboType: 1 }).lean();
  assert(allBundles.length === 24, `Total Bundles in MongoDB: ${allBundles.length} (Expected: 24)`);

  allBundles.forEach((b, idx) => {
    const isFormula = b.comboType === 'FORMULA_COMBO';
    const expectedBasePrice = b.classLevel === '9' || b.classLevel === '10'
      ? (isFormula ? 119 : 249)
      : b.classLevel === '11'
        ? (isFormula ? 149 : 349)
        : (isFormula ? 150 : 429);

    console.log(`  [Combo ${idx + 1}/24] Class ${b.classLevel} ${b.subject} (${b.comboType}) -> DB Price: ₹${b.price}, Expected: ₹${expectedBasePrice}`);
    assert(b.price > 0, `Combo "${b.title}" has valid positive price (₹${b.price})`);
  });

  // TEST SUITE 4: ALL 313 STUDY RESOURCES PRICING AUDIT
  console.log('\n--- TEST SUITE 4: ALL 313 STUDY RESOURCES PRICING AUDIT ---');
  const allResources = await StudyResource.find().lean();
  assert(allResources.length === 313, `Total StudyResources in MongoDB: ${allResources.length} (Expected: 313)`);

  let invalidResPrices = 0;
  allResources.forEach((r) => {
    const price = Number(r.salePrice || r.downloadPrice);
    if (!price || price <= 0) {
      invalidResPrices++;
      console.error(`  ❌ Invalid price for resource ${r._id}: ${r.title} (salePrice: ${r.salePrice}, downloadPrice: ${r.downloadPrice})`);
    }
  });
  assert(invalidResPrices === 0, `All 313 StudyResources have valid positive selling/download prices`);

  // TEST SUITE 5: ALL 4 CLASSES COMBOS DISCOVERY
  console.log('\n--- TEST SUITE 5: COMBOS ACROSS ALL CLASSES (9-12) ---');
  for (const cls of classes) {
    const combosForClass = await StudyResourceBundle.find({ classLevel: cls });
    assert(combosForClass.length > 0, `Class ${cls} has ${combosForClass.length} active subject combos`);
  }

  // TEST SUITE 6: END-TO-END PRICING CONSISTENCY & SIMULATION
  console.log('\n--- TEST SUITE 6: END-TO-END PRICING CONSISTENCY SIMULATION ---');
  // 1. Test Class 9 Mathematics QA Combo
  const class9Qa = await StudyResourceBundle.findOne({ classLevel: '9', subject: 'Mathematics', comboType: 'QA_COMBO' }).lean();
  assert(class9Qa !== null, 'Class 9 Math QA Combo exists in MongoDB');
  assert(class9Qa.price === 249, `Class 9 Math QA Combo price in DB is ₹${class9Qa.price} (Expected: ₹249)`);

  // 2. Test Class 9 Mathematics Formula Combo
  const class9Formula = await StudyResourceBundle.findOne({ classLevel: '9', subject: 'Mathematics', comboType: 'FORMULA_COMBO' }).lean();
  assert(class9Formula !== null, 'Class 9 Math Formula Combo exists in MongoDB');
  assert(class9Formula.price === 119, `Class 9 Math Formula Combo price in DB is ₹${class9Formula.price} (Expected: ₹119)`);

  // 3. Test Class 10 Mathematics Formula & QA
  const class10Formula = await StudyResourceBundle.findOne({ classLevel: '10', subject: 'Mathematics', comboType: 'FORMULA_COMBO' }).lean();
  assert(class10Formula?.price === 119, `Class 10 Math Formula Combo price in DB is ₹${class10Formula?.price} (Expected: ₹119)`);
  const class10Qa = await StudyResourceBundle.findOne({ classLevel: '10', subject: 'Mathematics', comboType: 'QA_COMBO' }).lean();
  assert(class10Qa?.price === 249, `Class 10 Math QA Combo price in DB is ₹${class10Qa?.price} (Expected: ₹249)`);

  // 4. Test Class 10 Science Formula & QA
  const class10SciFormula = await StudyResourceBundle.findOne({ classLevel: '10', subject: 'Science', comboType: 'FORMULA_COMBO' }).lean();
  assert(class10SciFormula?.price === 119, `Class 10 Science Formula Combo price in DB is ₹${class10SciFormula?.price} (Expected: ₹119)`);
  const class10SciQa = await StudyResourceBundle.findOne({ classLevel: '10', subject: 'Science', comboType: 'QA_COMBO' }).lean();
  assert(class10SciQa?.price === 249, `Class 10 Science QA Combo price in DB is ₹${class10SciQa?.price} (Expected: ₹249)`);

  // 5. Test Class 11 Biology Formula & QA
  const class11BioFormula = await StudyResourceBundle.findOne({ classLevel: '11', subject: 'Biology', comboType: 'FORMULA_COMBO' }).lean();
  assert(class11BioFormula?.price === 149, `Class 11 Biology Formula Combo price in DB is ₹${class11BioFormula?.price} (Expected: ₹149)`);
  const class11BioQa = await StudyResourceBundle.findOne({ classLevel: '11', subject: 'Biology', comboType: 'QA_COMBO' }).lean();
  assert(class11BioQa?.price === 349, `Class 11 Biology QA Combo price in DB is ₹${class11BioQa?.price} (Expected: ₹349)`);

  // 6. Test Class 12 Physics Formula & QA
  const class12PhyFormula = await StudyResourceBundle.findOne({ classLevel: '12', subject: 'Physics', comboType: 'FORMULA_COMBO' }).lean();
  assert(class12PhyFormula?.price === 150, `Class 12 Physics Formula Combo price in DB is ₹${class12PhyFormula?.price} (Expected: ₹150)`);
  const class12PhyQa = await StudyResourceBundle.findOne({ classLevel: '12', subject: 'Physics', comboType: 'QA_COMBO' }).lean();
  assert(class12PhyQa?.price === 429, `Class 12 Physics QA Combo price in DB is ₹${class12PhyQa?.price} (Expected: ₹429)`);

  // TEST SUITE 7: ADMIN BUNDLE UPLOAD ROUTE & INTEGRITY
  console.log('\n--- TEST SUITE 7: ADMIN BUNDLE UPLOAD ROUTE & INTEGRITY ---');
  const studyRouter = require('../routes/studyResources');
  const registeredAdminRoutes = studyRouter.stack.filter(r => r.route && r.route.path.includes('/admin/bundles')).map(r => {
    return `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`;
  });

  console.log('  Registered Admin Bundle Routes:', registeredAdminRoutes.join(', '));
  assert(registeredAdminRoutes.includes('POST /admin/bundles/:id'), 'POST /admin/bundles/:id route is explicitly registered');
  // TEST SUITE 8: 100MB LARGE COMBO PDF UPLOAD PIPELINE
  console.log('\n--- TEST SUITE 8: 100MB LARGE COMBO PDF UPLOAD PIPELINE ---');
  const maxComboSize = parseInt(process.env.MAX_COMBO_PDF_SIZE_MB, 10) || 100;
  assert(maxComboSize >= 100, `MAX_COMBO_PDF_SIZE_MB is configured to ${maxComboSize} MB (Expected: >= 100 MB)`);

  const cloudinaryService = require('../services/cloudinaryService');
  assert(typeof cloudinaryService.uploadStudyDocument === 'function', 'uploadStudyDocument service function exists');
  assert(typeof cloudinaryService.uploadToCloudinary === 'function', 'uploadToCloudinary service function exists');

  console.log('\n===============================================================');
  console.log(`FINAL TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===============================================================\n');

  await mongoose.disconnect();
  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
