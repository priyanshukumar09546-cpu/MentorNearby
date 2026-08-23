require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const https = require('https');
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const ch1 = await StudyResource.findById('6a7f72ab8e69e3dea68cbee6');
  console.log('Ch 1 Resource:', {
    id: ch1._id.toString(),
    title: ch1.title,
    fileName: ch1.fileName,
    fileUrl: ch1.fileUrl,
    fileType: ch1.fileType,
    mimeType: ch1.mimeType,
  });

  // Check headers of fileUrl
  https.get(ch1.fileUrl, (res) => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', res.headers['content-length']);
    mongoose.disconnect();
  });
}
run();
