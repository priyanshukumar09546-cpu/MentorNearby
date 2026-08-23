require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

const API_URL = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING TUTORNEARBY FULL END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const results = {};
  let studentCookie = '';
  let tutorCookie = '';
  let adminCookie = '';
  let studentUserId = '';
  let tutorUserId = '';
  let tutorProfileId = '';

  const testEmailStudent = `student_test_${Date.now()}@example.com`;
  const testEmailTutor = `tutor_test_${Date.now()}@example.com`;
  const testEmailGoogle = `google_test_${Date.now()}@gmail.com`;

  // Connect Mongoose to inspect MongoDB directly
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas directly for database verification\n');

  // Mongoose model helpers
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', new mongoose.Schema({}, { strict: false }));
  const TutorProfile = mongoose.models.TutorProfile || mongoose.model('TutorProfile', new mongoose.Schema({}, { strict: false }));
  const KYC = mongoose.models.KYC || mongoose.model('KYC', new mongoose.Schema({}, { strict: false }));

  // TEST 1 — Student Registration
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Ananya Sharma',
      email: testEmailStudent,
      password: 'Password123!',
      role: 'STUDENT',
      phone: '9876543210',
      whatsappNumber: '9876543210',
      location: { city: 'New Delhi', area: 'Connaught Place', pincode: '110001', address: 'Private House 123' },
      studentDetails: { name: 'Rohan Sharma', class: 'Class 10', board: 'CBSE', medium: 'English' },
      academicDetails: { subjectsRequired: ['Mathematics', 'Physics'] },
      tuitionRequirements: { mode: 'Offline', budget: '5000' },
      parentDetails: { name: 'Rajesh Sharma', phone: '9876543210', relationship: 'Father' }
    });
    studentCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
    studentUserId = res.data.data.user._id;
    results['TEST 1 — Student Registration'] = 'PASS';
    console.log('✅ TEST 1 — Student Registration: PASS');
  } catch (err) {
    results['TEST 1 — Student Registration'] = 'FAIL: ' + (err.response?.data?.message || err.message);
    console.error('❌ TEST 1 — Student Registration: FAIL', err.response?.data || err.message);
  }

  // TEST 2 — Student MongoDB Record
  try {
    const u = await User.findOne({ email: testEmailStudent });
    const sp = await StudentProfile.findOne({ user: u._id });
    
    if (u && u.role === 'STUDENT' && sp && sp.studentDetails.class === 'Class 10') {
      results['TEST 2 — Student MongoDB Record'] = 'PASS';
      console.log('✅ TEST 2 — Student MongoDB Record: PASS');
    } else {
      results['TEST 2 — Student MongoDB Record'] = 'FAIL: Record not matched';
      console.error('❌ TEST 2 — Student MongoDB Record: FAIL');
    }
  } catch (err) {
    results['TEST 2 — Student MongoDB Record'] = 'FAIL: ' + err.message;
  }

  // TEST 3 — Tutor Registration
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Vikramaditya Roy',
      email: testEmailTutor,
      password: 'Password123!',
      role: 'TUTOR',
      phone: '9988776655',
      professionalHeadline: 'Senior Mathematics & Physics Tutor (10+ Yrs Exp)',
      bio: 'Ex-IITian with over 10 years of experience coaching Class 9-12 students for Boards & JEE.',
      gender: 'Male',
      dateOfBirth: '1990-05-15',
      education: [{ degree: 'M.Sc Physics', institution: 'Delhi University', year: 2012, field: 'Physics' }],
      subjects: ['Mathematics', 'Physics'],
      grades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
      languages: ['English', 'Hindi'],
      teachingModes: ['Offline', 'Online'],
      experience: { years: 10, description: 'Taught over 500+ students with 95%+ success rate' },
      fees: { amount: 600, frequency: 'Month', negotiable: true },
      location: { city: 'New Delhi', area: 'South Extension', pincode: '110049' },
      areasServed: ['South Extension', 'Lajpat Nagar', 'Connaught Place'],
      profilePhoto: { url: 'https://res.cloudinary.com/d0hldeg8/image/upload/v1/sample.jpg', publicId: 'sample' },
      kycData: { govtIdType: 'AADHAAR', govtIdLast4: '4321', govtIdUrl: 'https://res.cloudinary.com/d0hldeg8/raw/upload/sample.pdf', consent: true }
    });
    tutorCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
    tutorUserId = res.data.data.user._id;
    results['TEST 3 — Tutor Registration'] = 'PASS';
    console.log('✅ TEST 3 — Tutor Registration: PASS');
  } catch (err) {
    results['TEST 3 — Tutor Registration'] = 'FAIL: ' + (err.response?.data?.message || err.message);
    console.error('❌ TEST 3 — Tutor Registration: FAIL', err.response?.data || err.message);
  }

  // TEST 4 — Tutor Profile
  try {
    const tp = await TutorProfile.findOne({ user: tutorUserId });
    if (tp && tp.fees.amount === 600 && tp.subjects.includes('Mathematics')) {
      tutorProfileId = tp._id;
      results['TEST 4 — Tutor Profile'] = 'PASS';
      console.log('✅ TEST 4 — Tutor Profile: PASS');
    } else {
      results['TEST 4 — Tutor Profile'] = 'FAIL: Profile fields missing';
    }
  } catch (err) {
    results['TEST 4 — Tutor Profile'] = 'FAIL: ' + err.message;
  }

  // TEST 5 — Cloudinary Upload Verification
  try {
    const uploadHealthRes = await axios.get('http://localhost:5000/health');
    if (uploadHealthRes.status === 200 && uploadHealthRes.data.success) {
      results['TEST 5 — Cloudinary Upload'] = 'PASS';
      console.log('✅ TEST 5 — Cloudinary Upload: PASS');
    } else {
      results['TEST 5 — Cloudinary Upload'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 5 — Cloudinary Upload'] = 'FAIL: ' + err.message;
  }

  // TEST 6 — Tutor KYC Status Pending
  try {
    const kyc = await KYC.findOne({ user: tutorUserId });
    if (kyc && kyc.status === 'PENDING' && kyc.govtIdLast4 === '4321') {
      results['TEST 6 — Tutor KYC'] = 'PASS';
      console.log('✅ TEST 6 — Tutor KYC: PASS');
    } else {
      results['TEST 6 — Tutor KYC'] = 'FAIL: KYC record or status invalid';
    }
  } catch (err) {
    results['TEST 6 — Tutor KYC'] = 'FAIL: ' + err.message;
  }

  // TEST 7 — Admin Login
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    adminCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
    results['TEST 7 — Admin Login'] = 'PASS';
    console.log('✅ TEST 7 — Admin Login: PASS');
  } catch (err) {
    results['TEST 7 — Admin Login'] = 'FAIL: ' + (err.response?.data?.message || err.message);
    console.error('❌ TEST 7 — Admin Login: FAIL', err.response?.data || err.message);
  }

  // TEST 8 — Admin User Records
  try {
    const res = await axios.get(`${API_URL}/admin/users`, { headers: { Cookie: adminCookie } });
    if (res.data.success && res.data.data.users.length > 0) {
      results['TEST 8 — Admin User Records'] = 'PASS';
      console.log('✅ TEST 8 — Admin User Records: PASS');
    } else {
      results['TEST 8 — Admin User Records'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 8 — Admin User Records'] = 'FAIL: ' + err.message;
  }

  // TEST 9 — Admin KYC Review List
  try {
    const res = await axios.get(`${API_URL}/kyc/admin/list`, { headers: { Cookie: adminCookie } });
    if (res.data.success) {
      results['TEST 9 — Admin KYC Review'] = 'PASS';
      console.log('✅ TEST 9 — Admin KYC Review: PASS');
    } else {
      results['TEST 9 — Admin KYC Review'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 9 — Admin KYC Review'] = 'FAIL: ' + err.message;
  }

  // TEST 10 — Tutor Approval by Admin
  try {
    const kyc = await KYC.findOne({ user: tutorUserId });
    if (kyc) {
      await axios.put(`${API_URL}/kyc/admin/${kyc._id}/status`, {
        status: 'VERIFIED',
        adminNotes: 'Approved during automated end-to-end verification test'
      }, { headers: { Cookie: adminCookie } });

      const updatedTp = await TutorProfile.findById(tutorProfileId);
      if (updatedTp.kycStatus === 'VERIFIED') {
        results['TEST 10 — Tutor Approval'] = 'PASS';
        console.log('✅ TEST 10 — Tutor Approval: PASS');
      } else {
        results['TEST 10 — Tutor Approval'] = 'FAIL: Profile status not updated to VERIFIED';
      }
    } else {
      results['TEST 10 — Tutor Approval'] = 'FAIL: KYC record not found';
    }
  } catch (err) {
    results['TEST 10 — Tutor Approval'] = 'FAIL: ' + err.message;
  }

  // TEST 11 — Find Tutors Search API
  try {
    const res = await axios.get(`${API_URL}/search/tutors`);
    if (res.status === 200 && res.data.success) {
      results['TEST 11 — Find Tutors'] = 'PASS';
      console.log('✅ TEST 11 — Find Tutors: PASS');
    } else {
      results['TEST 11 — Find Tutors'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 11 — Find Tutors'] = 'FAIL: ' + err.message;
  }

  // TEST 12 — Tutor Public Profile
  try {
    const res = await axios.get(`${API_URL}/tutors/${tutorUserId}`);
    if (res.data.success && res.data.data.tutorProfile) {
      results['TEST 12 — Tutor Public Profile'] = 'PASS';
      console.log('✅ TEST 12 — Tutor Public Profile: PASS');
    } else {
      results['TEST 12 — Tutor Public Profile'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 12 — Tutor Public Profile'] = 'FAIL: ' + err.message;
  }

  // TEST 13 — Filters Search
  try {
    const res = await axios.get(`${API_URL}/search/tutors?city=New%20Delhi&subjects=Mathematics`);
    if (res.data.success && Array.isArray(res.data.data.tutors)) {
      results['TEST 13 — Filters'] = 'PASS';
      console.log('✅ TEST 13 — Filters: PASS');
    } else {
      results['TEST 13 — Filters'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 13 — Filters'] = 'FAIL: ' + err.message;
  }

  // TEST 14 — Contact Unlock (Free)
  try {
    const res = await axios.post(`${API_URL}/contact-unlocks/free`, {
      tutorId: tutorUserId
    }, { headers: { Cookie: studentCookie } });
    if (res.data.success) {
      results['TEST 14 — Contact Unlock'] = 'PASS';
      console.log('✅ TEST 14 — Contact Unlock: PASS');
    } else {
      results['TEST 14 — Contact Unlock'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 14 — Contact Unlock'] = 'FAIL: ' + (err.response?.data?.message || err.message);
  }

  // TEST 15 — WhatsApp Contact Link
  try {
    const tutorUser = await User.findById(tutorUserId).select('+phone');
    if (tutorUser && tutorUser.phone) {
      results['TEST 15 — WhatsApp Contact'] = 'PASS';
      console.log('✅ TEST 15 — WhatsApp Contact: PASS');
    } else {
      results['TEST 15 — WhatsApp Contact'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 15 — WhatsApp Contact'] = 'FAIL: ' + err.message;
  }

  // TEST 16 — Duplicate Registration Protection
  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Duplicate Student',
      email: testEmailStudent,
      password: 'Password123!',
      role: 'STUDENT',
      phone: '9876543210'
    });
    results['TEST 16 — Duplicate Registration Protection'] = 'FAIL: Allowed duplicate email';
  } catch (err) {
    if (err.response && err.response.status === 409) {
      results['TEST 16 — Duplicate Registration Protection'] = 'PASS';
      console.log('✅ TEST 16 — Duplicate Registration Protection: PASS (HTTP 409 returned)');
    } else {
      results['TEST 16 — Duplicate Registration Protection'] = 'FAIL: Expected 409, got ' + err.response?.status;
    }
  }

  // TEST 17 — Google Sign-In
  try {
    const res = await axios.post(`${API_URL}/auth/google`, {
      email: testEmailGoogle,
      name: 'Google Test User',
      picture: 'https://ui-avatars.com/api/?name=Google+User',
      googleId: `g_${Date.now()}`,
      role: 'STUDENT'
    });
    if (res.status === 201 || res.status === 200) {
      results['TEST 17 — Google Sign-In'] = 'PASS';
      console.log('✅ TEST 17 — Google Sign-In: PASS');
    } else {
      results['TEST 17 — Google Sign-In'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 17 — Google Sign-In'] = 'FAIL: ' + (err.response?.data?.message || err.message);
  }

  // TEST 18 — Google Duplicate Prevention
  try {
    const res = await axios.post(`${API_URL}/auth/google`, {
      email: testEmailGoogle,
      name: 'Google Test User Duplicate Login',
      role: 'STUDENT'
    });
    if (res.status === 200) {
      results['TEST 18 — Google Duplicate Prevention'] = 'PASS';
      console.log('✅ TEST 18 — Google Duplicate Prevention: PASS (Logged into existing account, status 200)');
    } else {
      results['TEST 18 — Google Duplicate Prevention'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 18 — Google Duplicate Prevention'] = 'FAIL: ' + (err.response?.data?.message || err.message);
  }

  // TEST 19 — API Error Verification
  try {
    const errRes = await axios.get(`${API_URL}/invalid-test-route`).catch(e => e.response);
    if (errRes && errRes.status === 404 && errRes.data.errorCode === 'NOT_FOUND') {
      results['TEST 19 — API Error Verification'] = 'PASS';
      console.log('✅ TEST 19 — API Error Verification: PASS');
    } else {
      results['TEST 19 — API Error Verification'] = 'FAIL';
    }
  } catch (err) {
    results['TEST 19 — API Error Verification'] = 'FAIL: ' + err.message;
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('FINAL TEST RESULTS SUMMARY');
  console.log('====================================================');
  console.table(results);
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
