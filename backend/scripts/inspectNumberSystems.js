require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const docs = await StudyResource.find({
    $or: [
      { title: /Number Systems/i },
      { chapterTitle: /Number Systems/i },
      { classLevel: { $in: ['9', 'Class 9'] }, subject: /Math/i, chapterNumber: 1 }
    ]
  }).lean();
  console.log('Found records:', docs.length);
  docs.forEach((d, i) => {
    console.log(`\n--- Record ${i + 1} ---`);
    console.log('ID:', d._id.toString());
    console.log('title:', d.title);
    console.log('classLevel:', d.classLevel);
    console.log('subject:', d.subject);
    console.log('chapterNumber:', d.chapterNumber);
    console.log('chapterTitle:', d.chapterTitle);
    console.log('resourceType:', d.resourceType);
    console.log('isFreeDemo:', d.isFreeDemo);
    console.log('accessType:', d.accessType);
    console.log('fileName:', d.fileName);
    console.log('fileUrl:', d.fileUrl);
    console.log('fileType:', d.fileType);
    console.log('mimeType:', d.mimeType);
    console.log('fileFormat:', d.fileFormat);
    console.log('fileReference:', d.fileReference);
  });
  await mongoose.disconnect();
}
inspect();
