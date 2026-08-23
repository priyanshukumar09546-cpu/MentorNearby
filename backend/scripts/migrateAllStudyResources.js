// ============================================================
// scripts/migrateAllStudyResources.js
// Database migration & normalization for all StudyResource records
// Fixes fileType, mimeType, fileFormat, fileName, and fileReference
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const { detectFileType } = require('../utils/fileTypeDetector');

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected.\n');

  const resources = await StudyResource.find({});
  console.log(`Found ${resources.length} study resources to check and normalize...`);

  let updatedCount = 0;

  for (const r of resources) {
    const detected = detectFileType({
      fileName: r.fileName || r.fileReference?.filename,
      fileUrl: r.fileUrl || r.fileReference?.url,
      fileType: r.fileType,
      mimeType: r.mimeType,
      fileFormat: r.fileFormat,
      resourceType: r.resourceType,
    });

    const oldFileType = r.fileType;
    const oldMimeType = r.mimeType;

    r.fileType = detected.fileType;
    r.mimeType = detected.mimeType;
    r.fileFormat = detected.format;

    if (!r.fileName) {
      r.fileName = r.fileReference?.filename || `${r.title || 'study-material'}.${detected.format}`;
    }

    if (!r.fileUrl && r.fileReference?.url) {
      r.fileUrl = r.fileReference.url;
    }

    if (r.fileReference) {
      r.fileReference.fileType = detected.fileType;
      r.fileReference.mimeType = detected.mimeType;
      if (!r.fileReference.filename) {
        r.fileReference.filename = r.fileName;
      }
    } else if (r.fileUrl) {
      r.fileReference = {
        url: r.fileUrl,
        filename: r.fileName,
        fileType: detected.fileType,
        mimeType: detected.mimeType,
      };
    }

    await r.save();
    updatedCount++;

    console.log(`[ID: ${r._id}] ${r.title} | ${oldFileType || 'none'} -> ${r.fileType} (${r.mimeType}) | File: ${r.fileName}`);
  }

  console.log(`\nMigration completed successfully! ${updatedCount} records normalized.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
