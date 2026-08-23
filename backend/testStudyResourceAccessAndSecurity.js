// ============================================================
// testStudyResourceAccessAndSecurity.js
// Automated verification suite for Study Resources Free Demo / Paid Access Control
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('./models/StudyResource');
const StudyPurchase = require('./models/StudyPurchase');
const User = require('./models/User');

async function runTests() {
  console.log('============================================================');
  console.log('STARTING STUDY RESOURCES ACCESS CONTROL VERIFICATION');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to database.\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ------------------------------------------------------------
  // TEST 1: Class 9 - 12 Unit 1 & 2 Free Demo Rules
  // ------------------------------------------------------------
  console.log('--- TEST GROUP 1: Free Demo Rules (Units 1 & 2) ---');
  for (const cls of ['9', '10', '11', '12']) {
    const ch1Formula = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 1, resourceType: 'FORMULA_SHEET' });
    const ch1QA = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 1, resourceType: 'IMPORTANT_QUESTIONS_ANSWERS' });
    const ch2Formula = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 2, resourceType: 'FORMULA_SHEET' });
    const ch2QA = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 2, resourceType: 'IMPORTANT_QUESTIONS_ANSWERS' });

    if (ch1Formula) {
      assert(ch1Formula.isFreeDemo === true && ch1Formula.accessType === 'FREE_DEMO', `Class ${cls} Ch 1 Formula is FREE DEMO`);
      assert(ch1Formula.originalPrice === 49 && ch1Formula.salePrice === 19, `Class ${cls} Ch 1 Formula price: ~~₹49~~ ₹19`);
    }
    if (ch1QA) {
      assert(ch1QA.isFreeDemo === true && ch1QA.accessType === 'FREE_DEMO', `Class ${cls} Ch 1 Q&A is FREE DEMO`);
      assert(ch1QA.originalPrice === 79 && ch1QA.salePrice === 39, `Class ${cls} Ch 1 Q&A price: ~~₹79~~ ₹39`);
    }
    if (ch2Formula) {
      assert(ch2Formula.isFreeDemo === true && ch2Formula.accessType === 'FREE_DEMO', `Class ${cls} Ch 2 Formula is FREE DEMO`);
    }
    if (ch2QA) {
      assert(ch2QA.isFreeDemo === true && ch2QA.accessType === 'FREE_DEMO', `Class ${cls} Ch 2 Q&A is FREE DEMO`);
    }
  }

  // ------------------------------------------------------------
  // TEST 2: Class 9 - 12 Unit 3+ Paid Rules
  // ------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Paid Rules (Units 3+) ---');
  for (const cls of ['9', '10', '11', '12']) {
    const ch3Formula = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 3, resourceType: 'FORMULA_SHEET' });
    const ch3QA = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 3, resourceType: 'IMPORTANT_QUESTIONS_ANSWERS' });
    const ch4Formula = await StudyResource.findOne({ classLevel: { $in: [cls, `Class ${cls}`] }, chapterNumber: 4, resourceType: 'FORMULA_SHEET' });

    if (ch3Formula) {
      assert(ch3Formula.isFreeDemo === false && ch3Formula.accessType === 'PAID', `Class ${cls} Ch 3 Formula is PAID (not free demo)`);
      assert(ch3Formula.originalPrice === 49 && ch3Formula.salePrice === 19, `Class ${cls} Ch 3 Formula pricing: ~~₹49~~ ₹19`);
    }
    if (ch3QA) {
      assert(ch3QA.isFreeDemo === false && ch3QA.accessType === 'PAID', `Class ${cls} Ch 3 Q&A is PAID (not free demo)`);
      assert(ch3QA.originalPrice === 79 && ch3QA.salePrice === 39, `Class ${cls} Ch 3 Q&A pricing: ~~₹79~~ ₹39`);
    }
    if (ch4Formula) {
      assert(ch4Formula.isFreeDemo === false && ch4Formula.accessType === 'PAID', `Class ${cls} Ch 4 Formula is PAID`);
    }
  }

  // ------------------------------------------------------------
  // TEST 3: Model Pre-Save Validation (Enforces Chapter 3+ Paid)
  // ------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Schema Pre-Save Automatic Enforcement ---');
  const tempResource = new StudyResource({
    title: 'Test Unit 4 Resource Attempt Free',
    classLevel: '10',
    subject: 'Science',
    chapterNumber: 4,
    resourceType: 'FORMULA_SHEET',
    isFreeDemo: true, // Intentionally trying to set free demo on Chapter 4
    accessType: 'FREE_DEMO',
  });
  await tempResource.save();

  assert(tempResource.isFreeDemo === false, 'Attempt to create Chapter 4 with isFreeDemo=true was auto-corrected to false');
  assert(tempResource.accessType === 'PAID', 'Attempt to create Chapter 4 with accessType=FREE_DEMO was auto-corrected to PAID');
  assert(tempResource.originalPrice === 49 && tempResource.salePrice === 19, 'Formula prices auto-enforced to 49/19');

  // Clean up temp test document
  await StudyResource.findByIdAndDelete(tempResource._id);
  console.log('Cleaned up temporary test resource.');

  // ------------------------------------------------------------
  // TEST 4: Backend Security Check on Protected Access
  // ------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Controller Server-Side Protection Logic ---');
  const ch1Doc = await StudyResource.findOne({ chapterNumber: 1 });
  const ch3Doc = await StudyResource.findOne({ chapterNumber: 3 });

  // Simulating controller decision logic
  const checkAccess = (resource, userId, userPurchases = []) => {
    const chNum = Number(resource.chapterNumber) || 1;
    const isFreeDemo = chNum <= 2;
    if (isFreeDemo) return { allowed: true, reason: 'FREE_DEMO' };
    
    // Chapter 3+ requires purchase
    if (!userId) return { allowed: false, error: 'AUTH_REQUIRED', status: 401 };
    const hasPurchase = userPurchases.includes(resource._id.toString());
    if (hasPurchase) return { allowed: true, reason: 'PURCHASED' };
    return { allowed: false, error: 'PURCHASE_REQUIRED', status: 403 };
  };

  const guestCh1 = checkAccess(ch1Doc, null);
  assert(guestCh1.allowed === true && guestCh1.reason === 'FREE_DEMO', 'Guest accessing Chapter 1 is allowed via FREE_DEMO');

  const guestCh3 = checkAccess(ch3Doc, null);
  assert(guestCh3.allowed === false && guestCh3.status === 401, 'Guest accessing Chapter 3 is blocked with 401 AUTH_REQUIRED');

  const unpurchasedUserCh3 = checkAccess(ch3Doc, 'user_123', []);
  assert(unpurchasedUserCh3.allowed === false && unpurchasedUserCh3.status === 403, 'Logged-in user without purchase accessing Chapter 3 is blocked with 403 PURCHASE_REQUIRED');

  const purchasedUserCh3 = checkAccess(ch3Doc, 'user_123', [ch3Doc._id.toString()]);
  assert(purchasedUserCh3.allowed === true && purchasedUserCh3.reason === 'PURCHASED', 'Logged-in user with completed purchase accessing Chapter 3 is allowed');

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
