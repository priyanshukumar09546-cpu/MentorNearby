// ============================================================
// scripts/testStudyResources.js
// Verification test for Study Resources APIs & Business Logic
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');
const StudyPurchase = require('../models/StudyPurchase');

async function testAll() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for testing.');

  // 1. Verify resources count
  const count = await StudyResource.countDocuments({ published: true });
  console.log(`✅ Total Published Resources: ${count}`);

  // 2. Verify bundles count
  const bundlesCount = await StudyResourceBundle.countDocuments({ published: true });
  console.log(`✅ Total Published Bundles: ${bundlesCount}`);

  // 3. Test Class 9 Science Bundle & Chapter pricing
  const class9ScienceResources = await StudyResource.find({
    classLevel: '9',
    subject: 'Science',
    published: true,
  });

  const bundle9Science = await StudyResourceBundle.findOne({
    classLevel: '9',
    subject: 'Science',
  });

  const normalTotal = class9ScienceResources.reduce((s, r) => s + r.salePrice, 0);
  const comboPrice = bundle9Science.price;
  const savings = normalTotal - comboPrice;

  console.log(`\n--- Class 9 Science Check ---`);
  console.log(`Total Chapters / Resources: ${class9ScienceResources.length}`);
  console.log(`Formula Sheets Count: ${class9ScienceResources.filter(r => r.resourceType === 'FORMULA_SHEET').length} (Price: ₹${class9ScienceResources[0]?.salePrice})`);
  console.log(`Important Q&A Count: ${class9ScienceResources.filter(r => r.resourceType === 'IMPORTANT_QUESTIONS_ANSWERS').length} (Price: ₹${class9ScienceResources[1]?.salePrice})`);
  console.log(`Calculated Normal Total: ₹${normalTotal}`);
  console.log(`Complete Pack Price: ₹${comboPrice}`);
  console.log(`Dynamic Savings: ₹${savings}`);

  if (comboPrice === 100 && savings > 0) {
    console.log('✅ Class 9 Science pricing and combo logic verified!');
  } else {
    console.error('❌ Pricing logic check failed.');
  }

  await mongoose.disconnect();
  console.log('Test completed successfully.');
}

testAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
