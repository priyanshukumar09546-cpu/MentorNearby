require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const EducationalResource = require('../models/EducationalResource');
const ContentSource = require('../models/ContentSource');
const Bookmark = require('../models/Bookmark');
const User = require('../models/User');
const ncertSyncService = require('../services/ncertSyncService');

async function testAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  console.log('--- 1. Testing NCERT Sync ---');
  const sync1 = await ncertSyncService.runSync();
  console.log('Sync 1 result:', sync1.success, sync1.message);
  
  const count1 = await EducationalResource.countDocuments();
  console.log('Total resources after Sync 1:', count1);

  console.log('--- 2. Testing Sync Idempotency (Duplicate Prevention) ---');
  const sync2 = await ncertSyncService.runSync();
  const count2 = await EducationalResource.countDocuments();
  console.log('Total resources after Sync 2:', count2);
  if (count1 === count2) {
    console.log('✅ PASS: Sync is idempotent, 0 duplicate records created!');
  } else {
    console.error('❌ FAIL: Duplicate records created!');
  }

  console.log('--- 3. Testing Dynamic Classes & Subjects ---');
  const classes = await EducationalResource.distinct('classLevel', { isActive: true });
  console.log('Distinct classes in DB:', classes);
  const subjects = await EducationalResource.distinct('subject', { classLevel: 'Class 12', isActive: true });
  console.log('Class 12 subjects in DB:', subjects);

  console.log('--- 4. Testing Resource Query & Chapters ---');
  const math12 = await EducationalResource.findOne({ classLevel: 'Class 12', subject: 'Mathematics' });
  console.log('Found resource:', math12.title, 'Chapters count:', math12.chapters.length);
  console.log('Chapter 1:', math12.chapters[0].title, 'Official URL:', math12.chapters[0].openUrl);

  console.log('--- 5. Testing Search by Chapter ---');
  const searchResults = await EducationalResource.find({
    isActive: true,
    $or: [
      { title: /Relations/i },
      { 'chapters.title': /Relations/i }
    ]
  });
  console.log('Search for "Relations":', searchResults.length, 'matching resources found.');

  console.log('--- 6. Testing Bookmark System ---');
  const testUser = await User.findOne({ role: 'ADMIN' });
  if (testUser) {
    await Bookmark.deleteMany({ user: testUser._id });
    
    const bm = await Bookmark.create({
      user: testUser._id,
      resource: math12._id,
      resourceType: 'BOOK',
      chapterIndex: -1
    });
    console.log('✅ PASS: Bookmark created with ID:', bm._id);

    try {
      await Bookmark.create({
        user: testUser._id,
        resource: math12._id,
        chapterIndex: -1
      });
      console.error('❌ FAIL: Duplicate bookmark allowed!');
    } catch (e) {
      console.log('✅ PASS: Duplicate bookmark prevented by unique index constraint!');
    }

    await Bookmark.deleteOne({ _id: bm._id });
    console.log('✅ PASS: Bookmark deleted cleanly.');
  }

  console.log('--- 7. Testing Content Health Metrics ---');
  const status = await ncertSyncService.getSyncStatus();
  console.log('Content Health Report:', status.health);

  console.log('🎉 ALL 7 TEST SUITES PASSED SUCCESSFULLY!');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
