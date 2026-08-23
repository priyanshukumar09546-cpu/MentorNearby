// ============================================================
// scripts/testAutoFileUploadPipeline.js
// End-to-End Test Suite for Automatic File Upload & Storage Pipeline
// Tests: Real JPEG, Real PNG, Real PDF -> Cloudinary -> DB -> API -> Student Reader & Download
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyPurchase = require('../models/StudyPurchase');
const User = require('../models/User');
const { uploadStudyDocument } = require('../services/cloudinaryService');

// Standard valid JPEG binary buffer
const sampleJpegBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
).length === 0 ? Buffer.alloc(0) : Buffer.from(
  'ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffda0008010100003f00bf80ffd9',
  'hex'
);

// Minimal valid PNG binary buffer
const samplePngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wHzN6XWbAAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal valid PDF binary buffer
const samplePdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF',
  'utf-8'
);

async function runTests() {
  console.log('============================================================');
  console.log('STUDY RESOURCE AUTO FILE UPLOAD PIPELINE VERIFICATION');
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
  // TEST 1: JPEG FORMULA SHEET AUTO UPLOAD
  // ------------------------------------------------------------
  console.log('--- TEST 1: JPEG Formula Sheet Upload ---');
  const jpegUpload = await uploadStudyDocument(sampleJpegBuffer, 'FormulaSheet.jpg', 'image/jpeg');
  assert(jpegUpload && jpegUpload.secure_url, 'Cloudinary returned secure_url for JPEG');
  assert(jpegUpload.resource_type === 'image', 'Cloudinary stored JPEG with resource_type: image');
  console.log('   JPEG URL:', jpegUpload.secure_url);

  // Update Class 9 Chapter 1 Formula Sheet in database
  const ch1 = await StudyResource.findOne({
    classLevel: { $in: ['9', 'Class 9'] },
    chapterNumber: 1,
    resourceType: 'FORMULA_SHEET',
  });
  assert(ch1 !== null, 'Found Class 9 Chapter 1 Formula Sheet in DB');

  ch1.fileName = 'FormulaSheet.jpg';
  ch1.fileUrl = jpegUpload.secure_url;
  ch1.fileType = 'image';
  ch1.mimeType = 'image/jpeg';
  ch1.fileReference = {
    url: jpegUpload.secure_url,
    publicId: jpegUpload.public_id,
    filename: 'FormulaSheet.jpg',
    fileSize: sampleJpegBuffer.length,
    mimeType: 'image/jpeg',
    fileType: 'image',
  };
  await ch1.save();

  // Re-fetch from DB
  const ch1Saved = await StudyResource.findById(ch1._id).lean();
  assert(ch1Saved.fileName === 'FormulaSheet.jpg', 'Database stored fileName: FormulaSheet.jpg');
  assert(ch1Saved.fileUrl === jpegUpload.secure_url, 'Database stored automatic Cloudinary fileUrl');
  assert(ch1Saved.fileType === 'image', 'Database stored fileType: image');
  assert(ch1Saved.mimeType === 'image/jpeg', 'Database stored mimeType: image/jpeg');
  assert(ch1Saved.isFreeDemo === true, 'Class 9 Chapter 1 remains FREE DEMO');

  // ------------------------------------------------------------
  // TEST 2: PNG NOTES AUTO UPLOAD
  // ------------------------------------------------------------
  console.log('\n--- TEST 2: PNG Notes Upload ---');
  const pngUpload = await uploadStudyDocument(samplePngBuffer, 'Chapter2-Notes.png', 'image/png');
  assert(pngUpload && pngUpload.secure_url, 'Cloudinary returned secure_url for PNG');
  assert(pngUpload.resource_type === 'image', 'Cloudinary stored PNG with resource_type: image');
  console.log('   PNG URL:', pngUpload.secure_url);

  const ch2 = await StudyResource.findOne({
    classLevel: { $in: ['9', 'Class 9'] },
    chapterNumber: 2,
    resourceType: 'FORMULA_SHEET',
  });
  assert(ch2 !== null, 'Found Class 9 Chapter 2 in DB');

  ch2.fileName = 'Chapter2-Notes.png';
  ch2.fileUrl = pngUpload.secure_url;
  ch2.fileType = 'image';
  ch2.mimeType = 'image/png';
  ch2.fileReference = {
    url: pngUpload.secure_url,
    publicId: pngUpload.public_id,
    filename: 'Chapter2-Notes.png',
    fileSize: samplePngBuffer.length,
    mimeType: 'image/png',
    fileType: 'image',
  };
  await ch2.save();

  const ch2Saved = await StudyResource.findById(ch2._id).lean();
  assert(ch2Saved.fileName === 'Chapter2-Notes.png', 'Database stored fileName: Chapter2-Notes.png');
  assert(ch2Saved.fileUrl === pngUpload.secure_url, 'Database stored automatic Cloudinary fileUrl');
  assert(ch2Saved.fileType === 'image', 'Database stored fileType: image');
  assert(ch2Saved.mimeType === 'image/png', 'Database stored mimeType: image/png');
  assert(ch2Saved.isFreeDemo === true, 'Class 9 Chapter 2 remains FREE DEMO');

  // ------------------------------------------------------------
  // TEST 3: PDF COMPLETE GUIDE AUTO UPLOAD
  // ------------------------------------------------------------
  console.log('\n--- TEST 3: PDF Document Upload ---');
  const pdfUpload = await uploadStudyDocument(samplePdfBuffer, 'Chapter3-Complete-Guide.pdf', 'application/pdf');
  assert(pdfUpload && pdfUpload.secure_url, 'Cloudinary returned secure_url for PDF');
  assert(pdfUpload.resource_type === 'raw', 'Cloudinary stored PDF with resource_type: raw');
  console.log('   PDF URL:', pdfUpload.secure_url);

  const ch3 = await StudyResource.findOne({
    classLevel: { $in: ['9', 'Class 9'] },
    chapterNumber: 3,
    resourceType: 'FORMULA_SHEET',
  });
  assert(ch3 !== null, 'Found Class 9 Chapter 3 in DB');

  ch3.fileName = 'Chapter3-Complete-Guide.pdf';
  ch3.fileUrl = pdfUpload.secure_url;
  ch3.fileType = 'pdf';
  ch3.mimeType = 'application/pdf';
  ch3.fileReference = {
    url: pdfUpload.secure_url,
    publicId: pdfUpload.public_id,
    filename: 'Chapter3-Complete-Guide.pdf',
    fileSize: samplePdfBuffer.length,
    mimeType: 'application/pdf',
    fileType: 'pdf',
  };
  await ch3.save();

  const ch3Saved = await StudyResource.findById(ch3._id).lean();
  assert(ch3Saved.fileName === 'Chapter3-Complete-Guide.pdf', 'Database stored fileName: Chapter3-Complete-Guide.pdf');
  assert(ch3Saved.fileUrl === pdfUpload.secure_url, 'Database stored automatic Cloudinary fileUrl');
  assert(ch3Saved.fileType === 'pdf', 'Database stored fileType: pdf');
  assert(ch3Saved.mimeType === 'application/pdf', 'Database stored mimeType: application/pdf');
  assert(ch3Saved.isFreeDemo === false, 'Class 9 Chapter 3 remains PAID / LOCKED');
  assert(ch3Saved.salePrice === 19, 'Class 9 Chapter 3 Formula Price is ₹19');

  // ------------------------------------------------------------
  // TEST 4: CONTROLLER VIEWER & ACCESS CONTROL
  // ------------------------------------------------------------
  console.log('\n--- TEST 4: Student Viewer & Access Control API ---');
  const controller = require('../controllers/studyResourceController');

  // 4a. Guest reading Chapter 1 (Free Demo - JPEG)
  let ch1Res = {};
  const mockReq1 = { params: { id: ch1Saved._id.toString() }, user: null };
  const mockRes1 = {
    status: (s) => ({ json: (d) => { ch1Res = { status: s, ...d }; } }),
  };
  await controller.readStudyResource(mockReq1, mockRes1);
  assert(ch1Res.success === true, 'Free Demo (Chapter 1 JPEG) allowed for guest online viewing');
  assert(ch1Res.data?.resource?.fileUrl === jpegUpload.secure_url, 'Viewer received exact automatic JPEG fileUrl');
  assert(ch1Res.data?.resource?.fileType === 'image', 'Viewer received fileType: image');
  assert(ch1Res.data?.resource?.mimeType === 'image/jpeg', 'Viewer received mimeType: image/jpeg');
  assert(ch1Res.data?.resource?.fileName === 'FormulaSheet.jpg', 'Viewer received fileName: FormulaSheet.jpg');

  // 4b. Guest reading Chapter 3 (Paid - Blocked)
  let ch3GuestRes = {};
  const mockReq3Guest = { params: { id: ch3Saved._id.toString() }, user: null };
  const mockRes3Guest = {
    status: (s) => ({ json: (d) => { ch3GuestRes = { status: s, ...d }; } }),
  };
  await controller.readStudyResource(mockReq3Guest, mockRes3Guest);
  assert(ch3GuestRes.status === 401, 'Guest accessing Paid Chapter 3 is blocked with 401 AUTH_REQUIRED');

  // 4c. Purchased Student downloading Chapter 3 (Paid - PDF)
  let testUser = await User.findOne({ email: 'student_test_buyer@tutornearby.com' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Test Buyer',
      email: 'student_test_buyer@tutornearby.com',
      password: 'Password123!',
      role: 'STUDENT',
    });
  }

  // Create purchase entitlement
  await StudyPurchase.deleteMany({ user: testUser._id });
  await StudyPurchase.create({
    user: testUser._id,
    resource: ch3Saved._id,
    purchaseType: 'INDIVIDUAL_RESOURCE',
    classLevel: '9',
    subject: ch3Saved.subject || 'Science',
    amount: 19,
    paymentStatus: 'COMPLETED',
    razorpayOrderId: 'order_test_pipeline_123',
    razorpayPaymentId: 'pay_test_pipeline_123',
  });

  let ch3DownloadRes = {};
  const mockReq3Dl = { params: { id: ch3Saved._id.toString() }, user: { id: testUser._id.toString() } };
  const mockRes3Dl = {
    status: (s) => ({ json: (d) => { ch3DownloadRes = { status: s, ...d }; } }),
  };
  await controller.downloadStudyResource(mockReq3Dl, mockRes3Dl);
  assert(ch3DownloadRes.success === true, 'Purchased student download authorized for Chapter 3');
  assert(ch3DownloadRes.data?.downloadUrl === pdfUpload.secure_url, 'Download returned exact Cloudinary PDF URL');
  assert(ch3DownloadRes.data?.fileType === 'pdf', 'Download returned fileType: pdf');
  assert(ch3DownloadRes.data?.fileName === 'Chapter3-Complete-Guide.pdf', 'Download returned fileName: Chapter3-Complete-Guide.pdf');

  // Clean up test user & purchase
  await StudyPurchase.deleteMany({ user: testUser._id });
  await User.findByIdAndDelete(testUser._id);

  console.log('\n============================================================');
  console.log(`ALL AUTOMATED PIPELINE TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
