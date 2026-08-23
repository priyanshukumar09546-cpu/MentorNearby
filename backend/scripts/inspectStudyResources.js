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

  const sampleBundles = await StudyResourceBundle.find().limit(5).lean();
  console.log('\nSample StudyResourceBundles:');
  sampleBundles.forEach(b => {
    console.log({
      _id: b._id,
      title: b.title,
      classLevel: b.classLevel,
      subject: b.subject,
      comboType: b.comboType,
      price: b.price,
      fileUrl: b.fileUrl,
      fileReference: b.fileReference,
    });
  });

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error('Error inspecting:', err);
  process.exit(1);
});
