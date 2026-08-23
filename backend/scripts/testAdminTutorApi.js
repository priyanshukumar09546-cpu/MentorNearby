// ============================================================
// scripts/testAdminTutorApi.js
// End-to-end HTTP API Verification for Admin Tutor Management
// ============================================================

require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');

async function testHttpApis() {
  const baseUrl = 'http://localhost:5000/api';

  // 1. Get Admin user & create token
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);

  let admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    throw new Error('Admin user not found');
  }

  const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  console.log(`Admin token generated for: ${admin.email}`);

  // 2. Fetch Tutors list via API
  const listRes = await fetch(`${baseUrl}/admin/tutors`, { headers: adminHeaders });
  const listData = await listRes.json();
  console.log(`✅ GET /api/admin/tutors Response: Success=${listData.success}, Total=${listData.data?.total}`);

  // 3. Create a test tutor
  const uniqueId = Date.now();
  const testTutorUser = await User.create({
    name: `Api Test Tutor ${uniqueId}`,
    email: `apitest.${uniqueId}@tutornearby.com`,
    password: 'Password123!',
    role: 'TUTOR',
    phone: '9876543219',
    emailVerified: true
  });

  const testTutorProfile = await TutorProfile.create({
    user: testTutorUser._id,
    slug: `apitest-${uniqueId}`,
    bio: 'Experienced physics and math tutor for test suite.',
    subjects: ['Physics', 'Chemistry'],
    grades: ['Class 11', 'Class 12'],
    teachingModes: ['Online'],
    fees: { amount: 800, frequency: 'Hour' },
    location: { city: 'Mumbai', area: 'Andheri', pincode: '400053' },
    kycStatus: 'PENDING',
    profileVisibility: true
  });

  const tutorToken = jwt.sign({ id: testTutorUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const tutorHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tutorToken}`,
  };

  console.log(`✅ Test Tutor created: ID=${testTutorUser._id}`);

  // 4. Test Suspend API
  const suspendRes = await fetch(`${baseUrl}/admin/tutors/${testTutorUser._id}/suspend`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ reason: 'Suspicious profile information detected during review' }),
  });
  const suspendData = await suspendRes.json();
  console.log(`✅ POST /api/admin/tutors/:id/suspend: Success=${suspendData.success}, Message=${suspendData.message}`);

  // 5. Test Tutor Token rejection after suspension
  const tutorAuthCheck = await fetch(`${baseUrl}/tutors/dashboard`, { headers: tutorHeaders });
  const tutorAuthData = await tutorAuthCheck.json();
  console.log(`✅ Suspended tutor dashboard access check: HTTP ${tutorAuthCheck.status}, Success=${tutorAuthData.success}, Msg=${tutorAuthData.message}`);
  if (tutorAuthCheck.status !== 403) {
    throw new Error('Suspended tutor was not blocked with 403!');
  }

  // 6. Test Public Profile Hidden
  const publicProfileRes = await fetch(`${baseUrl}/tutors/${testTutorUser._id}`);
  console.log(`✅ Public profile check for suspended tutor: HTTP ${publicProfileRes.status}`);
  if (publicProfileRes.status !== 404) {
    throw new Error('Suspended tutor profile was still publicly accessible!');
  }

  // 7. Test Reactivate API
  const reactivateRes = await fetch(`${baseUrl}/admin/tutors/${testTutorUser._id}/reactivate`, {
    method: 'POST',
    headers: adminHeaders,
  });
  const reactivateData = await reactivateRes.json();
  console.log(`✅ POST /api/admin/tutors/:id/reactivate: Success=${reactivateData.success}, Message=${reactivateData.message}`);

  // 8. Test Tutor Token restored after reactivation
  const tutorAuthRestored = await fetch(`${baseUrl}/tutors/dashboard`, { headers: tutorHeaders });
  console.log(`✅ Reactivated tutor dashboard access check: HTTP ${tutorAuthRestored.status}`);
  if (tutorAuthRestored.status !== 200) {
    throw new Error('Reactivated tutor dashboard access failed!');
  }

  // 9. Test Permanent Delete validation (Wrong confirmation text)
  const invalidDeleteRes = await fetch(`${baseUrl}/admin/tutors/${testTutorUser._id}`, {
    method: 'DELETE',
    headers: adminHeaders,
    body: JSON.stringify({ confirmText: 'WRONG_TEXT', reason: 'Test' }),
  });
  console.log(`✅ Invalid confirmation DELETE check: HTTP ${invalidDeleteRes.status} (Expected 400)`);
  if (invalidDeleteRes.status !== 400) {
    throw new Error('Delete did not reject invalid confirmation text!');
  }

  // 10. Test Permanent Delete API with correct confirmation
  const deleteRes = await fetch(`${baseUrl}/admin/tutors/${testTutorUser._id}`, {
    method: 'DELETE',
    headers: adminHeaders,
    body: JSON.stringify({ confirmText: 'DELETE', reason: 'Test complete removal' }),
  });
  const deleteData = await deleteRes.json();
  console.log(`✅ DELETE /api/admin/tutors/:id: Success=${deleteData.success}, Message=${deleteData.message}`);

  // 11. Verify User is deleted
  const deletedCheck = await User.findById(testTutorUser._id);
  if (!deletedCheck) {
    console.log('✅ Tutor User permanently removed from MongoDB Atlas.');
  } else {
    throw new Error('Tutor User was not deleted from DB!');
  }

  // 12. Non-admin authorization test
  const nonAdminRes = await fetch(`${baseUrl}/admin/tutors`, { headers: tutorHeaders });
  console.log(`✅ Non-admin access check: HTTP ${nonAdminRes.status} (Expected 403/401)`);
  if (nonAdminRes.status !== 403 && nonAdminRes.status !== 401) {
    throw new Error('Non-admin user was not blocked from admin route!');
  }

  await mongoose.disconnect();
  console.log('\n🌟 ALL ADMIN TUTOR MANAGEMENT APIS VERIFIED AND WORKING PROPERLY! 🌟');
}

testHttpApis().catch((err) => {
  console.error('HTTP API Test Error:', err);
  process.exit(1);
});
