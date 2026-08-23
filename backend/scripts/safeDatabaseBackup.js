// Non-destructive snapshot backup script
const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const StudyResourceBundle = require('../models/StudyResourceBundle');
const StudyPurchase = require('../models/StudyPurchase');

async function backup() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('MongoDB Connected.');

  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const resources = await StudyResource.find().lean();
  const bundles = await StudyResourceBundle.find().lean();
  const purchases = await StudyPurchase.find().lean();

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      studyResources: resources.length,
      studyResourceBundles: bundles.length,
      studyPurchases: purchases.length,
    },
    studyResources: resources,
    studyResourceBundles: bundles,
    studyPurchases: purchases,
  };

  const backupFilePath = path.join(backupDir, `backup-${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('==============================================');
  console.log('SAFE DATABASE SNAPSHOT COMPLETED');
  console.log(`StudyResources count: ${resources.length}`);
  console.log(`StudyResourceBundles count: ${bundles.length}`);
  console.log(`StudyPurchases count: ${purchases.length}`);
  console.log(`Backup saved to: ${backupFilePath}`);
  console.log('==============================================');

  await mongoose.disconnect();
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
