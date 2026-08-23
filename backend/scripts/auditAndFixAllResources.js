require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const { detectFileType } = require('../utils/fileTypeDetector');

async function audit() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const resources = await StudyResource.find({});
  console.log(`Auditing ${resources.length} resources...`);

  let imageCount = 0;
  let pdfCount = 0;
  let rawImageCount = 0;

  for (const r of resources) {
    const detected = detectFileType({
      fileName: r.fileName || r.fileReference?.filename,
      fileUrl: r.fileUrl || r.fileReference?.url,
      fileType: r.fileType,
      mimeType: r.mimeType,
      fileFormat: r.fileFormat,
      resourceType: r.resourceType,
    });

    r.fileType = detected.fileType;
    r.mimeType = detected.mimeType;
    r.fileFormat = detected.format;

    if (!r.fileName) {
      r.fileName = `${r.title || 'study-material'}.${detected.format}`;
    }

    if (r.fileReference) {
      r.fileReference.fileType = detected.fileType;
      r.fileReference.mimeType = detected.mimeType;
      r.fileReference.filename = r.fileName;
    }

    if (detected.isImage) {
      imageCount++;
      if (r.fileUrl && r.fileUrl.includes('/raw/upload/')) {
        rawImageCount++;
      }
    } else {
      pdfCount++;
    }

    await r.save();
  }

  console.log(`\nAudit Complete:`);
  console.log(`Total Resources: ${resources.length}`);
  console.log(`Images: ${imageCount}`);
  console.log(`PDFs: ${pdfCount}`);
  console.log(`Raw URL Images: ${rawImageCount}`);

  await mongoose.disconnect();
}

audit().catch(console.error);
