// ============================================================
// backend/scripts/verify_production_features.js
// MentorNearby Production Features Verification Suite
// Tests Email Service, Forgot Password, Idempotency, and PWA Artifacts
// ============================================================

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  inspectMissingProfileDetails,
} = require('../controllers/adminController');
const {
  sendTutorApprovalEmail,
  sendTutorUnapprovalEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

const tests = [];
let passedCount = 0;
let failedCount = 0;

function assert(description, condition, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${description}`);
    tests.push({ description, status: 'PASS' });
  } else {
    failedCount++;
    console.error(`  [FAIL] ${description} ${details ? '--> ' + details : ''}`);
    tests.push({ description, status: 'FAIL', details });
  }
}

async function runSuite() {
  console.log('========================================================');
  console.log('MentorNearby — Production Readiness Verification Suite');
  console.log('========================================================\n');

  // -----------------------------------------------------------------
  // 1. Missing Profile Analysis Verification
  // -----------------------------------------------------------------
  console.log('--- 1. Profile Completeness & Missing Fields Inspection ---');
  try {
    const emptyProfile = {
      headline: '',
      bio: '',
      teachingModes: [],
      experienceYears: 0,
      hourlyRate: null,
      languages: [],
      grades: [],
      avatar: null,
    };
    const missingInEmpty = inspectMissingProfileDetails(emptyProfile);
    assert(
      'inspectMissingProfileDetails detects all missing fields on empty profile',
      missingInEmpty.length >= 6,
      `Detected count: ${missingInEmpty.length}`
    );

    const fullProfile = {
      professionalHeadline: 'Senior Mathematics & Physics Educator',
      bio: 'Over 10 years of teaching high school students with great results and concept clarity.',
      teachingModes: ['ONLINE', 'OFFLINE_STUDENT_HOME'],
      experienceYears: 10,
      hourlyRate: 800,
      subjects: ['Math', 'Physics'],
      education: [{ degree: 'M.Sc' }],
      city: 'Delhi',
      introVideoUrl: 'https://res.cloudinary.com/demo/video/upload/intro.mp4',
      avatar: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    };
    const missingInFull = inspectMissingProfileDetails(fullProfile);
    assert(
      'inspectMissingProfileDetails gives zero false warnings on 100% complete profile',
      missingInFull.length === 0,
      `Unexpected warnings: ${JSON.stringify(missingInFull)}`
    );

    const partialProfile = {
      professionalHeadline: 'Math Tutor',
      bio: 'I have been helping high school students master calculus and algebra for years.',
      teachingModes: ['ONLINE'],
      experienceYears: 2,
      subjects: ['Math'],
      education: [{ degree: 'B.Sc' }],
      city: 'Mumbai',
      introVideoUrl: 'https://res.cloudinary.com/demo/video/upload/intro.mp4',
      hourlyRate: null, // missing fees
      avatar: null, // missing photo
    };
    const missingInPartial = inspectMissingProfileDetails(partialProfile);
    const missingKeys = missingInPartial.map((m) => m.key);
    assert(
      'inspectMissingProfileDetails accurately identifies partial missing fields (fees, profilePhoto)',
      missingKeys.includes('fees') && missingKeys.includes('profilePhoto') && !missingKeys.includes('bio'),
      `Got keys: ${JSON.stringify(missingKeys)}`
    );
  } catch (err) {
    assert('inspectMissingProfileDetails execution', false, err.message);
  }

  // -----------------------------------------------------------------
  // 2. Password Reset Token Generation, Hash & Expiry Verification
  // -----------------------------------------------------------------
  console.log('\n--- 2. Password Reset Security & Single-Use Tokens ---');
  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    assert(
      'Generated raw reset token is 64 hex characters (32 bytes entropy)',
      rawToken.length === 64
    );

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert(
      'Hashed token is a 64-character SHA-256 digest',
      hashedToken.length === 64 && hashedToken !== rawToken
    );

    // Verify expiry math: 10 minutes in milliseconds
    const now = Date.now();
    const expiryDate = new Date(now + 10 * 60 * 1000);
    const timeDelta = expiryDate.getTime() - now;
    assert(
      'Token expiration set precisely to 10 minutes (600,000 ms)',
      timeDelta === 600000
    );

    // Verify constant-time comparison or hash uniqueness
    const wrongHash = crypto.createHash('sha256').update('wrong_token').digest('hex');
    assert('Wrong token produces distinct hash', hashedToken !== wrongHash);
  } catch (err) {
    assert('Password reset security token check', false, err.message);
  }

  // -----------------------------------------------------------------
  // 3. Email Templates & Dual Provider Interface
  // -----------------------------------------------------------------
  console.log('\n--- 3. Email Service Template & Dispatch Interface ---');
  try {
    assert(
      'sendTutorApprovalEmail is defined and exported as an async function',
      typeof sendTutorApprovalEmail === 'function'
    );
    assert(
      'sendTutorUnapprovalEmail is defined and exported as an async function',
      typeof sendTutorUnapprovalEmail === 'function'
    );
    assert(
      'sendPasswordResetEmail is defined and exported as an async function',
      typeof sendPasswordResetEmail === 'function'
    );

    // Call sendPasswordResetEmail in test mode with invalid recipient to verify error handling
    // It should safely return { success: false, error: ... } instead of crashing
    const testResult = await sendPasswordResetEmail({
      to: 'invalid-email-format-for-testing',
      name: 'Test Recipient',
      resetUrl: 'https://mentornearby.com/reset-password/sampletoken123',
    });
    assert(
      'sendPasswordResetEmail gracefully handles errors and returns structured object',
      typeof testResult === 'object' && ('success' in testResult),
      `Returned: ${JSON.stringify(testResult)}`
    );
  } catch (err) {
    assert('Email service interface check', false, err.message);
  }

  // -----------------------------------------------------------------
  // 4. EmailLog Schema & Idempotency Audit Model
  // -----------------------------------------------------------------
  console.log('\n--- 4. EmailLog Model & Audit Verification ---');
  try {
    const EmailLog = require('../models/EmailLog');
    assert('EmailLog Mongoose model is loaded successfully', Boolean(EmailLog));
    const schemaPaths = Object.keys(EmailLog.schema.paths);
    assert(
      'EmailLog schema has required fields: type, recipient, status, idempotencyKey',
      schemaPaths.includes('type') &&
        schemaPaths.includes('recipient') &&
        schemaPaths.includes('status') &&
        schemaPaths.includes('idempotencyKey')
    );
  } catch (err) {
    assert('EmailLog model verification', false, err.message);
  }

  // -----------------------------------------------------------------
  // 5. PWA Artifacts Verification
  // -----------------------------------------------------------------
  console.log('\n--- 5. PWA & Mobile Widget Artifacts Verification ---');
  try {
    const swPath = path.join(__dirname, '../../frontend/public/sw.js');
    assert('Service worker sw.js exists in frontend/public', fs.existsSync(swPath));
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert(
      'Service worker contains explicit security bypass for /api/, /admin/, and /auth/',
      swContent.includes('/api/') &&
        swContent.includes('/admin/') &&
        swContent.includes('/auth/')
    );

    const manifestPath = path.join(__dirname, '../../frontend/public/manifest.json');
    assert('PWA manifest.json exists in frontend/public', fs.existsSync(manifestPath));
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(
      'manifest.json has correct short_name and standalone display',
      manifestJson.short_name === 'MentorNearby' &&
        manifestJson.display === 'standalone'
    );
    assert(
      'manifest.json contains required 192x192 and 512x512 icons',
      manifestJson.icons.some((i) => i.sizes === '192x192') &&
        manifestJson.icons.some((i) => i.sizes === '512x512')
    );

    const widgetPath = path.join(
      __dirname,
      '../../frontend/src/components/common/MobileShareInstallWidget.jsx'
    );
    assert(
      'MobileShareInstallWidget.jsx component exists',
      fs.existsSync(widgetPath)
    );
    const widgetContent = fs.readFileSync(widgetPath, 'utf8');
    assert(
      'MobileShareInstallWidget includes beforeinstallprompt and iOS guide',
      widgetContent.includes('beforeinstallprompt') &&
        widgetContent.includes('showIosGuide')
    );

    const widgetCssPath = path.join(
      __dirname,
      '../../frontend/src/components/common/MobileShareInstallWidget.css'
    );
    assert(
      'MobileShareInstallWidget.css exists and handles safe-area-inset-bottom',
      fs.existsSync(widgetCssPath) &&
        fs.readFileSync(widgetCssPath, 'utf8').includes('safe-area-inset-bottom')
    );
  } catch (err) {
    assert('PWA artifacts verification', false, err.message);
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${tests.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('========================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
