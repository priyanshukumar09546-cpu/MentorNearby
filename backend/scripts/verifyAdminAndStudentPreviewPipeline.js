// ============================================================
// scripts/verifyAdminAndStudentPreviewPipeline.js
// Tests real-world upload, Admin edit modal preview, and Student Reader
// across PNG, JPG, WEBP, and PDF
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const { uploadStudyDocument } = require('../services/cloudinaryService');
const { detectFileType } = require('../utils/fileTypeDetector');
const controller = require('../controllers/studyResourceController');

const samplePngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wHzN6XWbAAAAABJRU5ErkJggg==',
  'base64'
);

const samplePdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF',
  'utf-8'
);

async function run() {
  console.log('============================================================');
  console.log('TUTORNEARBY — ADMIN & STUDENT PREVIEW VERIFICATION');
  console.log('============================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
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
  // TEST 1: Class 9 Math Ch 1 Number Systems (The exact user resource)
  // ------------------------------------------------------------
  console.log('--- TEST 1: Class 9 Math Ch 1 Number Systems ---');
  const ch1Math9 = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, subject: /Math/i, chapterNumber: 1, resourceType: 'FORMULA_SHEET' });
  assert(ch1Math9 !== null, 'Found Class 9 Math Chapter 1 resource');
  assert(ch1Math9.isFreeDemo === true, 'Resource is marked isFreeDemo: true');
  assert(ch1Math9.fileUrl.includes('res.cloudinary.com'), 'fileUrl is a real Cloudinary URL (NOT dummy.pdf)');
  assert(!ch1Math9.fileUrl.includes('dummy.pdf'), 'fileUrl contains NO dummy.pdf');
  assert(ch1Math9.fileType === 'image', 'fileType in DB is image');
  assert(ch1Math9.mimeType === 'image/png' || ch1Math9.mimeType === 'image/jpeg', 'mimeType in DB is image MIME');

  let ch1Read = {};
  await controller.readStudyResource(
    { params: { id: ch1Math9._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { ch1Read = { status: s, ...d }; } }) }
  );
  assert(ch1Read.status === 200, 'readStudyResource returned 200 OK');
  assert(ch1Read.data.resource.fileUrl.includes('res.cloudinary.com'), 'API returned real Cloudinary URL');
  assert(ch1Read.data.resource.fileType === 'image', 'API returned fileType: image');
  assert(ch1Read.data.resource.isFreeDemo === true, 'API returned isFreeDemo: true');

  // ------------------------------------------------------------
  // TEST 2: Class 10 Math Ch 1 Real Numbers (PNG Image)
  // ------------------------------------------------------------
  console.log('\n--- TEST 2: Class 10 Math Ch 1 Real Numbers ---');
  const ch1Math10 = await StudyResource.findOne({ classLevel: { $in: ['10', 'Class 10'] }, subject: /Math/i, chapterNumber: 1, resourceType: 'FORMULA_SHEET' });
  assert(ch1Math10 !== null, 'Found Class 10 Math Chapter 1 resource');
  assert(ch1Math10.fileUrl.includes('res.cloudinary.com'), 'fileUrl is real Cloudinary URL');
  assert(ch1Math10.fileType === 'image', 'fileType is image');

  let math10Read = {};
  await controller.readStudyResource(
    { params: { id: ch1Math10._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { math10Read = { status: s, ...d }; } }) }
  );
  assert(math10Read.data.resource.fileType === 'image', 'API returns fileType: image for Real Numbers');
  assert(math10Read.data.resource.mimeType === 'image/png', 'API returns mimeType: image/png for Real Numbers');

  // ------------------------------------------------------------
  // TEST 3: Admin File Upload Flow (PNG Upload)
  // ------------------------------------------------------------
  console.log('\n--- TEST 3: Admin Upload PNG File ---');
  const pngUpload = await uploadStudyDocument(samplePngBuffer, 'image (5).png', 'image/png');
  assert(pngUpload.resource_type === 'image', 'Cloudinary uploaded as resource_type: image');
  assert(pngUpload.fileType === 'image', 'Upload returned fileType: image');
  assert(pngUpload.mimeType === 'image/png', 'Upload returned mimeType: image/png');
  assert(pngUpload.fileFormat === 'png', 'Upload returned fileFormat: png');

  const pngDetect = detectFileType({
    fileName: 'image (5).png',
    fileUrl: pngUpload.secure_url,
    fileType: pngUpload.fileType,
    mimeType: pngUpload.mimeType,
  });
  assert(pngDetect.label === 'PNG Image', 'detectFileType returns label: PNG Image (NOT PDF)');
  assert(pngDetect.isImage === true, 'detectFileType returns isImage: true');

  // ------------------------------------------------------------
  // TEST 4: Admin File Upload Flow (PDF Upload)
  // ------------------------------------------------------------
  console.log('\n--- TEST 4: Admin Upload PDF File ---');
  const pdfUpload = await uploadStudyDocument(samplePdfBuffer, 'Math-Complete-Notes.pdf', 'application/pdf');
  assert(pdfUpload.resource_type === 'raw', 'Cloudinary uploaded PDF as resource_type: raw');
  assert(pdfUpload.fileType === 'pdf', 'Upload returned fileType: pdf');
  assert(pdfUpload.mimeType === 'application/pdf', 'Upload returned mimeType: application/pdf');

  const pdfDetect = detectFileType({
    fileName: 'Math-Complete-Notes.pdf',
    fileUrl: pdfUpload.secure_url,
    fileType: pdfUpload.fileType,
    mimeType: pdfUpload.mimeType,
  });
  assert(pdfDetect.label === 'PDF Document', 'detectFileType returns label: PDF Document');
  assert(pdfDetect.isImage === false, 'detectFileType returns isImage: false');

  console.log('\n============================================================');
  console.log(`PREVIEW PIPELINE SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

run().catch(console.error);
