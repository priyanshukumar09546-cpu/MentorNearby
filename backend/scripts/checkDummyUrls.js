require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function checkDummyUrls() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const dummyDocs = await StudyResource.find({
    $or: [
      { fileUrl: /dummy\.pdf/i },
      { 'fileReference.url': /dummy\.pdf/i },
      { fileUrl: /w3\.org/i },
      { 'fileReference.url': /w3\.org/i },
    ]
  }).lean();

  console.log(`Found ${dummyDocs.length} resources with dummy.pdf / w3.org URLs:`);
  dummyDocs.forEach((d, idx) => {
    if (idx < 10) {
      console.log(`- [${d._id}] ${d.classLevel} ${d.subject} Ch ${d.chapterNumber}: ${d.title} | fileUrl: ${d.fileUrl} | fileReference.url: ${d.fileReference?.url}`);
    }
  });

  const total = await StudyResource.countDocuments();
  console.log(`\nTotal resources in DB: ${total}`);

  await mongoose.disconnect();
}

checkDummyUrls().catch(console.error);
