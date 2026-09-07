const mongoose = require('mongoose');
require('dotenv').config();
const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');

async function inspect() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('No MONGO_URI');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const count = await StudyResource.countDocuments();
  console.log('Total StudyResources in DB:', count);

  const sampleResources = await StudyResource.find().limit(5).lean();
  console.log('\nSample StudyResources:');
  sampleResources.forEach(r => {
    console.log({
      _id: r._id,
      title: r.title,
      classLevel: r.classLevel,
      subject: r.subject,
      resourceType: r.resourceType,
      fileUrl: r.fileUrl,
      fileReference: r.fileReference,
      downloadPrice: r.downloadPrice,
      salePrice: r.salePrice,
      hasContent: Boolean(r.content || r.notes || r.summary || r.formulaContent),
    });
  });

  const allBundles = await StudyResourceBundle.find().lean();
  console.log('\nAll StudyResourceBundles (' + allBundles.length + ' total):');
  allBundles.forEach(b => {
    if (b.fileUrl || b.fileReference?.url) {
      console.log('BUNDLE_WITH_FILE:', {
        _id: b._id,
        title: b.title,
        classLevel: b.classLevel,
        subject: b.subject,
        comboType: b.comboType,
        price: b.price,
        fileUrl: b.fileUrl,
        filename: b.fileReference?.filename || b.fileName,
      });
    }
  });

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error('Error inspecting:', err);
  process.exit(1);
});
