// ============================================================
// scripts/verifyCompleteResourceUploadAndReadPipeline.js
// End-to-End Test Suite for Complete Admin Upload -> DB -> Cloudinary ->
// Admin Edit -> Preview File -> Student Read Free Pipeline
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const https = require('https');
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

function checkUrlStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('============================================================');
  console.log('TUTORNEARBY — MASTER PIPELINE VERIFICATION SUITE');
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
  // TEST 1 — PNG UPLOAD & ADMIN/STUDENT FLOW
  // ------------------------------------------------------------
  console.log('--- TEST 1: PNG Upload & Synchronous Pipeline ---');
  const target1 = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, chapterNumber: 1, resourceType: 'FORMULA_SHEET' });
  assert(target1 !== null, 'Found target resource: ' + target1.title);

  // Upload new PNG
  const pngFilename = 'image (5).png';
  const pngUpload = await uploadStudyDocument(samplePngBuffer, pngFilename, 'image/png');
  assert(pngUpload.secure_url && pngUpload.secure_url.includes('res.cloudinary.com'), 'Cloudinary returned secure HTTPS URL');
  assert(pngUpload.resource_type === 'image', 'Cloudinary resource_type: image');
  assert(pngUpload.fileType === 'image', 'fileType: image');
  assert(pngUpload.mimeType === 'image/png', 'mimeType: image/png');

  // Verify Cloudinary URL is live over HTTPS
  const pngHttp = await checkUrlStatus(pngUpload.secure_url);
  assert(pngHttp.status === 200, 'Cloudinary URL returns HTTP 200 OK');
  assert(pngHttp.contentType && pngHttp.contentType.includes('image/png'), 'Cloudinary Content-Type is image/png');

  // Update DB through controller mock
  let updateRes = {};
  await controller.adminUpdateResource(
    {
      params: { id: target1._id.toString() },
      body: {
        title: target1.title,
        chapterNumber: 1,
      },
      file: {
        buffer: samplePngBuffer,
        originalname: pngFilename,
        mimetype: 'image/png',
        size: samplePngBuffer.length,
      }
    },
    { status: (s) => ({ json: (d) => { updateRes = { status: s, ...d }; } }) }
  );

  assert(updateRes.status === 200, 'adminUpdateResource returned 200 OK');
  assert(updateRes.data.resource.fileName === pngFilename, 'Returned resource contains updated fileName');
  assert(updateRes.data.resource.fileUrl.includes('res.cloudinary.com'), 'Returned resource contains valid Cloudinary fileUrl');
  assert(updateRes.data.resource.fileType === 'image', 'Returned resource contains fileType: image');
  assert(updateRes.data.resource.mimeType === 'image/png', 'Returned resource contains mimeType: image/png');
  assert(updateRes.data.resource.fileFormat === 'png', 'Returned resource contains fileFormat: png');

  // Verify DB record directly
  const savedDoc = await StudyResource.findById(target1._id).lean();
  assert(savedDoc.fileName === pngFilename, 'MongoDB contains updated fileName: ' + pngFilename);
  assert(savedDoc.fileUrl === updateRes.data.resource.fileUrl, 'MongoDB contains synchronized fileUrl');
  assert(savedDoc.fileReference.url === updateRes.data.resource.fileUrl, 'MongoDB fileReference.url matches fileUrl');
  assert(savedDoc.fileType === 'image', 'MongoDB fileType is image');
  assert(savedDoc.mimeType === 'image/png', 'MongoDB mimeType is image/png');

  // Verify Student Read Free API
  let studentRead = {};
  await controller.readStudyResource(
    { params: { id: target1._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { studentRead = { status: s, ...d }; } }) }
  );
  assert(studentRead.status === 200, 'Student readStudyResource returned 200 OK');
  assert(studentRead.data.resource.fileUrl === savedDoc.fileUrl, 'Student receives exact same Cloudinary URL');
  assert(studentRead.data.resource.fileType === 'image', 'Student receives fileType: image');
  assert(studentRead.data.resource.fileName === pngFilename, 'Student receives fileName: ' + pngFilename);
  assert(studentRead.data.resource.isFreeDemo === true, 'Student receives isFreeDemo: true');

  // ------------------------------------------------------------
  // TEST 2 — PDF UPLOAD FLOW
  // ------------------------------------------------------------
  console.log('\n--- TEST 2: PDF Upload & Detection Pipeline ---');
  const target2 = await StudyResource.findOne({ classLevel: { $in: ['9', 'Class 9'] }, chapterNumber: 2, resourceType: 'FORMULA_SHEET' });
  const pdfFilename = 'Polynomials-Master-Notes.pdf';

  let pdfUpdateRes = {};
  await controller.adminUpdateResource(
    {
      params: { id: target2._id.toString() },
      body: { title: target2.title },
      file: {
        buffer: samplePdfBuffer,
        originalname: pdfFilename,
        mimetype: 'application/pdf',
        size: samplePdfBuffer.length,
      }
    },
    { status: (s) => ({ json: (d) => { pdfUpdateRes = { status: s, ...d }; } }) }
  );

  assert(pdfUpdateRes.status === 200, 'PDF adminUpdateResource returned 200 OK');
  assert(pdfUpdateRes.data.resource.fileName === pdfFilename, 'PDF fileName is set correctly');
  assert(pdfUpdateRes.data.resource.fileType === 'pdf', 'PDF fileType is pdf');
  assert(pdfUpdateRes.data.resource.mimeType === 'application/pdf', 'PDF mimeType is application/pdf');
  assert(pdfUpdateRes.data.resource.fileFormat === 'pdf', 'PDF fileFormat is pdf');

  const pdfDoc = await StudyResource.findById(target2._id).lean();
  assert(pdfDoc.fileType === 'pdf', 'MongoDB contains fileType: pdf');
  assert(pdfDoc.mimeType === 'application/pdf', 'MongoDB contains mimeType: application/pdf');

  // ------------------------------------------------------------
  // TEST 3 — FILE REPLACEMENT (FILE-A -> FILE-B)
  // ------------------------------------------------------------
  console.log('\n--- TEST 3: File Replacement (FILE-A -> FILE-B) ---');
  const fileA_name = 'Original-Diagram.png';
  const fileB_name = 'Updated-Diagram.png';

  // Upload File A
  const uploadA = await uploadStudyDocument(samplePngBuffer, fileA_name, 'image/png');
  target1.fileName = fileA_name;
  target1.fileUrl = uploadA.secure_url;
  target1.fileReference = { url: uploadA.secure_url, filename: fileA_name, mimeType: 'image/png', fileType: 'image' };
  await target1.save();

  const docA = await StudyResource.findById(target1._id).lean();
  assert(docA.fileName === fileA_name, 'Resource has File A filename');
  assert(docA.fileUrl === uploadA.secure_url, 'Resource points to File A URL');

  // Replace with File B
  const uploadB = await uploadStudyDocument(samplePngBuffer, fileB_name, 'image/png');
  let replaceRes = {};
  await controller.adminUpdateResource(
    {
      params: { id: target1._id.toString() },
      body: { title: target1.title },
      file: {
        buffer: samplePngBuffer,
        originalname: fileB_name,
        mimetype: 'image/png',
        size: samplePngBuffer.length,
      }
    },
    { status: (s) => ({ json: (d) => { replaceRes = { status: s, ...d }; } }) }
  );

  assert(replaceRes.status === 200, 'Replacement returned 200 OK');
  assert(replaceRes.data.resource.fileName === fileB_name, 'Returned resource contains File B filename');
  assert(replaceRes.data.resource.fileUrl !== uploadA.secure_url, 'Old File A URL is no longer returned');

  const docB = await StudyResource.findById(target1._id).lean();
  assert(docB.fileName === fileB_name, 'MongoDB contains updated File B filename');
  assert(docB.fileUrl === replaceRes.data.resource.fileUrl, 'MongoDB contains synchronized File B URL');
  assert(docB.fileUrl !== uploadA.secure_url, 'MongoDB no longer contains File A URL');

  console.log('\n============================================================');
  console.log(`MASTER PIPELINE SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  await mongoose.disconnect();
}

run().catch(console.error);
