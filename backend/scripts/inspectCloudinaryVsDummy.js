require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function inspectAllCloudinaryVsDummy() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const docs = await StudyResource.find({}).lean();
  let cloudinaryInFileRef = 0;
  let cloudinaryInFileUrl = 0;
  let dummyInFileUrl = 0;
  let fixedCount = 0;

  for (const d of docs) {
    const hasCloudinaryInRef = d.fileReference?.url && d.fileReference.url.includes('res.cloudinary.com');
    const hasCloudinaryInUrl = d.fileUrl && d.fileUrl.includes('res.cloudinary.com');
    const hasDummyInUrl = d.fileUrl && (d.fileUrl.includes('dummy.pdf') || d.fileUrl.includes('w3.org'));

    if (hasCloudinaryInRef) cloudinaryInFileRef++;
    if (hasCloudinaryInUrl) cloudinaryInFileUrl++;
    if (hasDummyInUrl) dummyInFileUrl++;

    if (hasCloudinaryInRef && !hasCloudinaryInUrl) {
      console.log(`[MISMATCH] ${d._id} | ${d.classLevel} ${d.subject} Ch ${d.chapterNumber}: ${d.title}`);
      console.log(`   fileUrl: ${d.fileUrl}`);
      console.log(`   fileReference.url: ${d.fileReference?.url}`);
      fixedCount++;
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log('Total Docs:', docs.length);
  console.log('Cloudinary in fileReference:', cloudinaryInFileRef);
  console.log('Cloudinary in fileUrl:', cloudinaryInFileUrl);
  console.log('Dummy in fileUrl:', dummyInFileUrl);
  console.log('Mismatches (Cloudinary in ref, but dummy in fileUrl):', fixedCount);

  await mongoose.disconnect();
}

inspectAllCloudinaryVsDummy().catch(console.error);
