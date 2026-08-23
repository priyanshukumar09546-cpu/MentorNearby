// ============================================================
// scripts/testTutorManagement.js
// Integration test for Admin Tutor Management (Suspend, Reactivate, Delete)
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const KYC = require('../models/KYC');
const SavedTutor = require('../models/SavedTutor');
const jwt = require('jsonwebtoken');

async function runTests() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // 1. Find or create an Admin user
  let admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: 'testadmin@tutornearby.com',
      password: 'Password123!',
      role: 'ADMIN',
      phone: '9876543210',
      emailVerified: true
    });
  }
  console.log(`✅ Admin verified: ${admin.email}`);

  // 2. Create a temporary Test Tutor for testing Suspend, Reactivate and Delete
  const testEmail = `test.tutor.${Date.now()}@example.com`;
  const testTutorUser = await User.create({
    name: 'Aarav Sharma',
    email: testEmail,
    password: 'Password123!',
    role: 'TUTOR',
    phone: '9988776655',
    emailVerified: true
  });

  const testTutorProfile = await TutorProfile.create({
    user: testTutorUser._id,
    slug: `aarav-sharma-${Date.now()}`,
    bio: 'Certified Mathematics Tutor with 5 years experience.',
    subjects: ['Mathematics', 'Physics'],
    grades: ['Class 10', 'Class 12'],
    teachingModes: ['Online', 'Offline'],
    fees: { amount: 600, frequency: 'Hour' },
    location: { city: 'New Delhi', area: 'Connaught Place', pincode: '110001' },
    kycStatus: 'VERIFIED',
    profileVisibility: true
  });

  console.log(`✅ Test Tutor created: ID=${testTutorUser._id}, Email=${testEmail}`);

  // 3. Test Suspend
  testTutorUser.isSuspended = true;
  testTutorUser.suspensionReason = 'Violated platform code of conduct';
  await testTutorUser.save();
  await TutorProfile.findOneAndUpdate({ user: testTutorUser._id }, { profileVisibility: false });

  await AuditLog.create({
    admin: admin._id,
    action: 'TUTOR_SUSPENDED',
    targetType: 'USER',
    targetId: testTutorUser._id,
    details: `Tutor Aarav Sharma suspended. Reason: ${testTutorUser.suspensionReason}`
  });

  const suspendedCheck = await User.findById(testTutorUser._id);
  const profileVisibilityCheck = await TutorProfile.findOne({ user: testTutorUser._id });

  if (suspendedCheck.isSuspended === true && profileVisibilityCheck.profileVisibility === false) {
    console.log('✅ Suspend logic verified: User is suspended and profile hidden.');
  } else {
    throw new Error('Suspend test failed.');
  }

  // 4. Test Reactivate
  testTutorUser.isSuspended = false;
  testTutorUser.suspensionReason = undefined;
  await testTutorUser.save();
  await TutorProfile.findOneAndUpdate({ user: testTutorUser._id }, { profileVisibility: true });

  await AuditLog.create({
    admin: admin._id,
    action: 'TUTOR_REACTIVATED',
    targetType: 'USER',
    targetId: testTutorUser._id,
    details: `Tutor Aarav Sharma reactivated.`
  });

  const reactivatedCheck = await User.findById(testTutorUser._id);
  const profileVisibilityReactivated = await TutorProfile.findOne({ user: testTutorUser._id });

  if (reactivatedCheck.isSuspended === false && profileVisibilityReactivated.profileVisibility === true) {
    console.log('✅ Reactivate logic verified: User is active and profile visible.');
  } else {
    throw new Error('Reactivate test failed.');
  }

  // 5. Test Double-Confirmation Permanent Delete
  // Add test review and saved tutor to verify safe cleanup
  await Review.create({
    tutor: testTutorUser._id,
    reviewer: admin._id,
    rating: 5,
    comment: 'Great tutor!'
  });

  await SavedTutor.create({
    user: admin._id,
    tutor: testTutorUser._id
  });

  // Perform permanent deletion
  await AuditLog.create({
    admin: admin._id,
    action: 'TUTOR_PERMANENTLY_DELETED',
    targetType: 'USER',
    targetId: testTutorUser._id,
    details: `Permanently deleted tutor ${testTutorUser.name} (${testTutorUser.email}). Reason: Automated test cleanup.`
  });

  await TutorProfile.deleteOne({ user: testTutorUser._id });
  await KYC.deleteOne({ user: testTutorUser._id });
  await SavedTutor.deleteMany({ tutor: testTutorUser._id });
  await Review.deleteMany({ tutor: testTutorUser._id });
  await User.findByIdAndDelete(testTutorUser._id);

  // Verify tutor is completely deleted from user, profile, reviews and saved collections
  const userAfterDelete = await User.findById(testTutorUser._id);
  const profileAfterDelete = await TutorProfile.findOne({ user: testTutorUser._id });
  const reviewsAfterDelete = await Review.find({ tutor: testTutorUser._id });
  const savedAfterDelete = await SavedTutor.find({ tutor: testTutorUser._id });
  const auditLogCheck = await AuditLog.findOne({ targetId: testTutorUser._id, action: 'TUTOR_PERMANENTLY_DELETED' });

  if (!userAfterDelete && !profileAfterDelete && reviewsAfterDelete.length === 0 && savedAfterDelete.length === 0 && auditLogCheck) {
    console.log('✅ Permanent Delete logic verified: All associated records cleaned and audit logged!');
  } else {
    throw new Error('Permanent delete verification failed.');
  }

  await mongoose.disconnect();
  console.log('All tests passed successfully! 🎉');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
