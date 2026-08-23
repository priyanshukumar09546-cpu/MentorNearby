// ============================================================
// scripts/syncAllResourceAndBundlePrices.js
// One-Time Sync Script: Enforce Official Pricing Matrix across all MongoDB documents
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const mongoose = require('mongoose');
require('dotenv').config();

const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');
const Course = require('../models/Course');
const CourseBundle = require('../models/CourseBundle');

const normalizeClass = (cls) => {
  if (!cls) return '';
  return cls.toString().replace(/class\s*/i, '').trim();
};

async function syncPrices() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not configured in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for price synchronization...\n');

  // 1. Sync StudyResource individual prices
  // Class 9 & 10: Formula = ₹7, Notes = ₹12
  // Class 11 & 12: Formula = ₹8, Notes = ₹14
  const allResources = await StudyResource.find({});
  console.log(`Found ${allResources.length} StudyResource documents.`);

  let updatedResourcesCount = 0;
  for (const res of allResources) {
    const norm = normalizeClass(res.classLevel);
    const isSenior = norm === '11' || norm === '12';
    const isFormula = res.resourceType === 'FORMULA_SHEET';
    const correctPrice = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
    const correctOriginal = isFormula ? 49 : 79;

    if (res.downloadPrice !== correctPrice || res.salePrice !== correctPrice || res.price !== correctPrice) {
      await StudyResource.findByIdAndUpdate(res._id, {
        downloadPrice: correctPrice,
        salePrice: correctPrice,
        price: correctPrice,
        originalPrice: correctOriginal,
        readingEnabled: true,
      });
      updatedResourcesCount++;
    }
  }
  console.log(`Updated ${updatedResourcesCount} StudyResource documents to official prices.`);

  // 2. Sync StudyResourceBundle combo prices
  // Class 9 & 10: Formula Combo = ₹50, Notes Combo = ₹100
  // Class 11 & 12: Formula Combo = ₹60, Notes Combo = ₹120
  const allBundles = await StudyResourceBundle.find({});
  console.log(`Found ${allBundles.length} StudyResourceBundle documents.`);

  let updatedBundlesCount = 0;
  for (const b of allBundles) {
    const norm = normalizeClass(b.classLevel);
    const isSenior = norm === '11' || norm === '12';
    const isFormula = b.comboType === 'FORMULA_COMBO';
    const correctComboPrice = isFormula ? (isSenior ? 60 : 50) : (isSenior ? 120 : 100);

    if (b.price !== correctComboPrice) {
      console.log(`Updating bundle "${b.title}" from ₹${b.price} -> ₹${correctComboPrice}`);
      await StudyResourceBundle.findByIdAndUpdate(b._id, {
        price: correctComboPrice,
      });
      updatedBundlesCount++;
    }
  }
  console.log(`Updated ${updatedBundlesCount} StudyResourceBundle documents to official prices.`);

  console.log('\nAll study resource and bundle prices synchronized successfully!');
  await mongoose.disconnect();
}

syncPrices().catch((err) => {
  console.error('Error syncing prices:', err);
  process.exit(1);
});
