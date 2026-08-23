require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const https = require('https');
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const { uploadStudyDocument } = require('../services/cloudinaryService');
const { detectFileType } = require('../utils/fileTypeDetector');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const resources = await StudyResource.find({});
  console.log(`Checking all ${resources.length} resources...`);

  for (const r of resources) {
    const rawRefUrl = r.fileReference?.url || '';
    const rawDirectUrl = r.fileUrl || '';

    // If fileReference has a Cloudinary URL
    if (rawRefUrl.includes('res.cloudinary.com')) {
      const isRawCloudinary = rawRefUrl.includes('/raw/upload/');
      const detected = detectFileType({
        fileName: r.fileName || r.fileReference?.filename,
        fileUrl: rawRefUrl,
        fileType: r.fileType,
        mimeType: r.mimeType,
        resourceType: r.resourceType,
      });

      // If it's an image that was uploaded as raw, re-upload to Cloudinary image storage
      if (detected.isImage && isRawCloudinary) {
        console.log(`Re-uploading raw image to image storage: [${r._id}] ${r.title} (${r.fileName || r.fileReference?.filename})`);
        try {
          const buf = await fetchBuffer(rawRefUrl);
          const uploadRes = await uploadStudyDocument(buf, r.fileName || r.fileReference?.filename || 'image.png', detected.mimeType);
          r.fileUrl = uploadRes.secure_url;
          r.fileName = uploadRes.fileName;
          r.fileType = uploadRes.fileType;
          r.mimeType = uploadRes.mimeType;
          r.fileFormat = uploadRes.fileFormat;
          r.cloudinaryPublicId = uploadRes.public_id;
          r.cloudinaryResourceType = uploadRes.resource_type;
          r.fileReference = {
            url: uploadRes.secure_url,
            publicId: uploadRes.public_id,
            filename: uploadRes.fileName,
            fileSize: buf.length,
            mimeType: uploadRes.mimeType,
            fileType: uploadRes.fileType,
          };
          await r.save();
          console.log(`   -> Successfully converted to: ${r.fileUrl}`);
        } catch (err) {
          console.error(`   -> Failed to re-upload: ${err.message}`);
          r.fileUrl = rawRefUrl;
          await r.save();
        }
      } else {
        r.fileUrl = rawRefUrl;
        await r.save();
      }
    }
  }

  console.log('\nMigration complete.');
  await mongoose.disconnect();
}

run().catch(console.error);
