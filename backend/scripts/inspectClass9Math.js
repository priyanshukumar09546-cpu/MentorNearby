require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const resources = await StudyResource.find({ classLevel: { $in: ['9', 'Class 9'] }, subject: /math/i });
  console.log('Found', resources.length, 'resources:');
  for (const r of resources) {
    console.log({
      id: r._id.toString(),
      chapterNumber: r.chapterNumber,
      title: r.title,
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      fileType: r.fileType,
      mimeType: r.mimeType,
      fileFormat: r.fileFormat,
      cloudinaryResourceType: r.cloudinaryResourceType,
    });
  }
  await mongoose.disconnect();
}
run();
