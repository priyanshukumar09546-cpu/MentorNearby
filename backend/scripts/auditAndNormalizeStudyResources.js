// ============================================================
// scripts/auditAndNormalizeStudyResources.js
// Audits and safely normalizes StudyResource records in MongoDB Atlas
// Enforces: Chapter 1/2 = FREE DEMO, Chapter 3+ = PAID (Formula: 49/19, Q&A: 79/39)
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');

async function auditAndNormalize() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to database successfully.\n');

  const total = await StudyResource.countDocuments();
  console.log(`Auditing ${total} study resources in database...\n`);

  const resources = await StudyResource.find({});
  let freeCount = 0;
  let paidCount = 0;
  let updatedCount = 0;

  for (const r of resources) {
    const chNum = Number(r.chapterNumber) || 1;
    const isFormula = r.resourceType === 'FORMULA_SHEET';
    const isFreeDemo = chNum <= 2;
    const accessType = isFreeDemo ? 'FREE_DEMO' : 'PAID';
    const originalPrice = isFormula ? 49 : 79;
    const salePrice = isFormula ? 19 : 39;

    let changed = false;

    if (r.isFreeDemo !== isFreeDemo) {
      r.isFreeDemo = isFreeDemo;
      changed = true;
    }
    if (r.isFree !== isFreeDemo) {
      r.isFree = isFreeDemo;
      changed = true;
    }
    if (r.accessType !== accessType) {
      r.accessType = accessType;
      changed = true;
    }
    if (r.originalPrice !== originalPrice) {
      r.originalPrice = originalPrice;
      changed = true;
    }
    if (r.salePrice !== salePrice) {
      r.salePrice = salePrice;
      changed = true;
    }
    if (r.downloadPrice !== salePrice) {
      r.downloadPrice = salePrice;
      changed = true;
    }
    if (r.readingEnabled !== isFreeDemo) {
      r.readingEnabled = isFreeDemo;
      changed = true;
    }

    if (changed) {
      await StudyResource.findByIdAndUpdate(r._id, {
        isFreeDemo,
        isFree: isFreeDemo,
        accessType,
        originalPrice,
        salePrice,
        downloadPrice: salePrice,
        readingEnabled: isFreeDemo,
      });
      updatedCount++;
    }

    if (isFreeDemo) freeCount++;
    else paidCount++;
  }

  console.log('--- AUDIT & NORMALIZATION SUMMARY ---');
  console.log(`Total Resources Checked: ${total}`);
  console.log(`FREE DEMO Resources (Units 1 & 2): ${freeCount}`);
  console.log(`PAID Resources (Units 3+): ${paidCount}`);
  console.log(`Records Normalized / Updated: ${updatedCount}`);
  console.log('-------------------------------------\n');

  // Verify Sample Chapters across Class 9-12
  console.log('--- VERIFYING SAMPLE RESOURCES ---');
  for (const cls of ['9', '10', '11', '12']) {
    const samples = await StudyResource.find({
      classLevel: { $in: [cls, `Class ${cls}`] },
    }).sort({ chapterNumber: 1 }).limit(5);

    console.log(`\nClass ${cls} Sample Chapters:`);
    samples.forEach(s => {
      console.log(`  Ch ${s.chapterNumber}: [${s.resourceType === 'FORMULA_SHEET' ? 'Formula' : 'Q&A'}] -> Access: ${s.accessType} | isFreeDemo: ${s.isFreeDemo} | Price: ₹${s.salePrice} (MRP: ₹${s.originalPrice}) | Title: ${s.title}`);
    });
  }

  await mongoose.disconnect();
  console.log('\nAudit and normalization completed safely with 0 deleted records.');
}

auditAndNormalize().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
