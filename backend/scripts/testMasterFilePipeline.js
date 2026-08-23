// ============================================================
// scripts/testMasterFilePipeline.js
// Comprehensive End-to-End Test Suite for TutorNearby File Pipeline
// Tests: PNG, JPG, WEBP, PDF, Replacement, Access Control, Viewer Detection
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyPurchase = require('../models/StudyPurchase');
const User = require('../models/User');
const { uploadStudyDocument } = require('../services/cloudinaryService');
const { detectFileType } = require('../utils/fileTypeDetector');
const controller = require('../controllers/studyResourceController');

// 1. Binary test buffers
// Valid PNG Buffer
const samplePngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wHzN6XWbAAAAABJRU5ErkJggg==',
  'base64'
);

// Valid JPEG Buffer
const sampleJpegBuffer = Buffer.from(
  'ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffda0008010100003f00bf80ffd9',
  'hex'
);

// Valid WEBP Buffer
const sampleWebpBuffer = Buffer.from(
  '524946461a000000574542505650384c0d0000002f00000010071011118888fe0700',
  'hex'
);

// Valid PDF Buffer
const samplePdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF',
  'utf-8'
);

async function runMasterSuite() {
  console.log('============================================================');
  console.log('TUTORNEARBY — MASTER FILE PIPELINE VERIFICATION SUITE');
  console.log('============================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas.\n');

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
  // TEST 1 — PNG UPLOAD & DETECTION (e.g. image (5).png)
  // ------------------------------------------------------------
  console.log('--- TEST 1: PNG Upload & Viewer Pipeline ---');
  const pngFilename = 'image (5).png';
  const pngResult = await uploadStudyDocument(samplePngBuffer, pngFilename, 'image/png');
  assert(pngResult.secure_url && pngResult.secure_url.startsWith('https://'), 'Cloudinary returned secure HTTPS URL for PNG');
  assert(pngResult.resource_type === 'image', 'Cloudinary uploaded PNG with resource_type: image');
  assert(pngResult.fileType === 'image', 'uploadStudyDocument returned fileType: image');
  assert(pngResult.mimeType === 'image/png', 'uploadStudyDocument returned mimeType: image/png');

  // Verify detector on Cloudinary result
  const pngDetected = detectFileType({
    fileName: pngFilename,
    fileUrl: pngResult.secure_url,
    fileType: pngResult.fileType,
    mimeType: pngResult.mimeType,
  });
  assert(pngDetected.fileType === 'image', 'detectFileType identified fileType: image (NOT pdf)');
  assert(pngDetected.label === 'PNG Image', 'detectFileType label is PNG Image');
  assert(pngDetected.isImage === true, 'detectFileType flagged isImage: true');

  // Update resource in DB
  const ch1 = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, chapterNumber: 1 });
  ch1.fileName = pngFilename;
  ch1.fileUrl = pngResult.secure_url;
  ch1.fileType = 'image';
  ch1.mimeType = 'image/png';
  ch1.fileFormat = 'png';
  ch1.cloudinaryPublicId = pngResult.public_id;
  ch1.cloudinaryResourceType = 'image';
  await ch1.save();

  // Read via Controller API
  let ch1ApiRes = {};
  await controller.readStudyResource(
    { params: { id: ch1._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { ch1ApiRes = { status: s, ...d }; } }) }
  );
  assert(ch1ApiRes.success === true, 'API returned success for Chapter 1 Free Demo reading');
  assert(ch1ApiRes.data.resource.fileName === pngFilename, 'API response contains fileName: image (5).png');
  assert(ch1ApiRes.data.resource.fileType === 'image', 'API response contains fileType: image');
  assert(ch1ApiRes.data.resource.mimeType === 'image/png', 'API response contains mimeType: image/png');
  assert(ch1ApiRes.data.resource.fileUrl === pngResult.secure_url, 'API response contains real Cloudinary URL');

  // ------------------------------------------------------------
  // TEST 2 — JPG UPLOAD & DETECTION
  // ------------------------------------------------------------
  console.log('\n--- TEST 2: JPG Upload & Detection ---');
  const jpgFilename = 'Physics-Formula-Sheet.jpg';
  const jpgResult = await uploadStudyDocument(sampleJpegBuffer, jpgFilename, 'image/jpeg');
  assert(jpgResult.resource_type === 'image', 'Cloudinary uploaded JPG with resource_type: image');
  assert(jpgResult.fileType === 'image', 'JPG detected as fileType: image');
  assert(jpgResult.mimeType === 'image/jpeg', 'JPG detected as mimeType: image/jpeg');

  const jpgDetected = detectFileType({
    fileName: jpgFilename,
    fileUrl: jpgResult.secure_url,
    fileType: jpgResult.fileType,
    mimeType: jpgResult.mimeType,
  });
  assert(jpgDetected.label === 'JPEG Image', 'detectFileType label is JPEG Image');

  // ------------------------------------------------------------
  // TEST 3 — WEBP UPLOAD & DETECTION
  // ------------------------------------------------------------
  console.log('\n--- TEST 3: WEBP Upload & Detection ---');
  const webpFilename = 'Chemistry-Notes.webp';
  const webpResult = await uploadStudyDocument(sampleWebpBuffer, webpFilename, 'image/webp');
  assert(webpResult.resource_type === 'image', 'Cloudinary uploaded WEBP with resource_type: image');
  assert(webpResult.fileType === 'image', 'WEBP detected as fileType: image');
  assert(webpResult.mimeType === 'image/webp', 'WEBP detected as mimeType: image/webp');

  const webpDetected = detectFileType({
    fileName: webpFilename,
    fileUrl: webpResult.secure_url,
    fileType: webpResult.fileType,
    mimeType: webpResult.mimeType,
  });
  assert(webpDetected.label === 'WEBP Image', 'detectFileType label is WEBP Image');

  // ------------------------------------------------------------
  // TEST 4 — PDF UPLOAD & DETECTION
  // ------------------------------------------------------------
  console.log('\n--- TEST 4: PDF Upload & Detection ---');
  const pdfFilename = 'Math-Full-Notes.pdf';
  const pdfResult = await uploadStudyDocument(samplePdfBuffer, pdfFilename, 'application/pdf');
  assert(pdfResult.resource_type === 'raw', 'Cloudinary uploaded PDF with resource_type: raw');
  assert(pdfResult.fileType === 'pdf', 'PDF detected as fileType: pdf');
  assert(pdfResult.mimeType === 'application/pdf', 'PDF detected as mimeType: application/pdf');

  const pdfDetected = detectFileType({
    fileName: pdfFilename,
    fileUrl: pdfResult.secure_url,
    fileType: pdfResult.fileType,
    mimeType: pdfResult.mimeType,
  });
  assert(pdfDetected.label === 'PDF Document', 'detectFileType label is PDF Document');
  assert(pdfDetected.isImage === false, 'detectFileType flagged isImage: false');

  // ------------------------------------------------------------
  // TEST 5 — REPLACEMENT (FILE-A -> FILE-B)
  // ------------------------------------------------------------
  console.log('\n--- TEST 5: File Replacement (FILE-A.png -> FILE-B.png) ---');
  const targetResource = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, chapterNumber: 2 });
  assert(targetResource !== null, 'Found target resource for replacement test');

  // Step 1: Upload FILE-A.png
  const fileAResult = await uploadStudyDocument(samplePngBuffer, 'FILE-A.png', 'image/png');
  targetResource.fileName = 'FILE-A.png';
  targetResource.fileUrl = fileAResult.secure_url;
  await targetResource.save();

  let checkARes = {};
  await controller.readStudyResource(
    { params: { id: targetResource._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { checkARes = { status: s, ...d }; } }) }
  );
  assert(checkARes.data.resource.fileName === 'FILE-A.png', 'Resource initially contains FILE-A.png');
  assert(checkARes.data.resource.fileUrl === fileAResult.secure_url, 'Resource points to FILE-A Cloudinary URL');

  // Step 2: Replace with FILE-B.png
  const fileBResult = await uploadStudyDocument(samplePngBuffer, 'FILE-B.png', 'image/png');
  targetResource.fileName = 'FILE-B.png';
  targetResource.fileUrl = fileBResult.secure_url;
  await targetResource.save();

  let checkBRes = {};
  await controller.readStudyResource(
    { params: { id: targetResource._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { checkBRes = { status: s, ...d }; } }) }
  );
  assert(checkBRes.data.resource.fileName === 'FILE-B.png', 'Resource successfully replaced with FILE-B.png');
  assert(checkBRes.data.resource.fileUrl === fileBResult.secure_url, 'Resource points to new FILE-B Cloudinary URL');
  assert(checkBRes.data.resource.fileUrl !== fileAResult.secure_url, 'Old FILE-A URL is completely replaced');

  // ------------------------------------------------------------
  // TEST 6 — ACCESS CONTROL (Unit 01/02 Free vs Unit 03+ Locked)
  // ------------------------------------------------------------
  console.log('\n--- TEST 6: Free Demo vs Paid Access Control ---');
  // Chapter 1 (Free Demo)
  let ch1Read = {};
  await controller.readStudyResource(
    { params: { id: ch1._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { ch1Read = { status: s, ...d }; } }) }
  );
  assert(ch1Read.success === true, 'Unit 1 is 100% FREE DEMO for guest online reading');

  // Chapter 3 (Paid) - Guest blocked
  const ch3 = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, chapterNumber: 3 });
  let ch3Guest = {};
  await controller.readStudyResource(
    { params: { id: ch3._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { ch3Guest = { status: s, ...d }; } }) }
  );
  assert(ch3Guest.status === 401, 'Guest accessing Unit 3 is blocked with 401 AUTH_REQUIRED');

  // Chapter 3 (Paid) - Student without purchase blocked
  const testStudent = await User.findOne({ role: 'STUDENT' }) || await User.create({
    name: 'Pipeline Test Student',
    email: 'pipeline_test_student@tutornearby.com',
    password: 'Password123!',
    role: 'STUDENT',
  });

  let ch3NoPurchase = {};
  await controller.readStudyResource(
    { params: { id: ch3._id.toString() }, user: { id: testStudent._id.toString() } },
    { status: (s) => ({ json: (d) => { ch3NoPurchase = { status: s, ...d }; } }) }
  );
  assert(ch3NoPurchase.status === 403, 'Student without purchase is blocked with 403 PURCHASE_REQUIRED');

  // Chapter 3 (Paid) - Student with completed purchase allowed
  await StudyPurchase.deleteMany({ user: testStudent._id });
  await StudyPurchase.create({
    user: testStudent._id,
    resource: ch3._id,
    purchaseType: 'INDIVIDUAL_RESOURCE',
    classLevel: '9',
    subject: ch3.subject || 'Science',
    amount: 19,
    paymentStatus: 'COMPLETED',
    razorpayOrderId: 'order_test_master_123',
    razorpayPaymentId: 'pay_test_master_123',
  });

  let ch3Purchased = {};
  await controller.readStudyResource(
    { params: { id: ch3._id.toString() }, user: { id: testStudent._id.toString() } },
    { status: (s) => ({ json: (d) => { ch3Purchased = { status: s, ...d }; } }) }
  );
  assert(ch3Purchased.success === true, 'Student with completed purchase is allowed access to Unit 3');
  assert(ch3Purchased.data.resource.isDownloadUnlocked === true, 'Purchased resource is marked isDownloadUnlocked: true');

  // Clean up test user & purchase
  await StudyPurchase.deleteMany({ user: testStudent._id });
  if (testStudent.email === 'pipeline_test_student@tutornearby.com') {
    await User.findByIdAndDelete(testStudent._id);
  }

  console.log('\n============================================================');
  console.log(`MASTER FILE PIPELINE SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runMasterSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
