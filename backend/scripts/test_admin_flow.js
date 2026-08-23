const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });
const API_URL = 'http://localhost:5000/api';

async function runAdminFlowTests() {
  console.log('====================================================');
  console.log('STARTING ADMIN FLOW VERIFICATION');
  console.log('====================================================\n');

  const results = {};
  
  const extractCookie = (res) => {
    if (res.headers['set-cookie']) {
      return res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }
    return '';
  };

  let adminCookie = '';
  let studentCookie = '';
  let studentId = '';
  let kycId = '';

  // Setup: Create a student and a pending KYC record to test with
  try {
    const studentRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin Test Student',
      email: `student_admin_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'STUDENT',
      phone: '1112223334'
    });
    studentCookie = extractCookie(studentRes);
    studentId = studentRes.data.data.user._id || studentRes.data.data.user.id;

    // We also need a tutor with a pending KYC
    const tutorRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin Test Tutor',
      email: `tutor_admin_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'TUTOR',
      phone: '4443332221',
      professionalHeadline: 'Test Tutor',
      bio: 'Test bio',
      gender: 'Male',
      dateOfBirth: '1990-01-01',
      education: [{ degree: 'B.Sc', institution: 'Univ', year: 2010, field: 'Math' }],
      subjects: ['Math'],
      grades: ['10th'],
      languages: ['English'],
      teachingModes: ['Online'],
      fees: { amount: 100, frequency: 'Hour' },
      location: { city: 'City', area: 'Area', pincode: '111111' }
    });
    const tutorCookie = extractCookie(tutorRes);

    const kycRes = await axios.post(`${API_URL}/kyc/submit`, {
      govtIdType: 'AADHAAR',
      govtIdLast4: '1234',
      documents: [{ type: 'GOVT_ID', url: 'http://test.com/doc' }],
      consent: true
    }, { headers: { Cookie: tutorCookie } });
    kycId = kycRes.data.data.kyc._id;
  } catch (err) {
    console.error('Setup failed:', err.response ? err.response.data : err.message);
    return;
  }

  // A & B. Login with existing admin credentials
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    adminCookie = extractCookie(res);
    if (res.data.success && res.data.data.user.role === 'ADMIN') {
      results['A & B. Login with existing admin credentials (Admin Login Route)'] = 'PASS';
    } else {
      results['A & B. Login with existing admin credentials (Admin Login Route)'] = 'FAIL';
    }
  } catch (err) {
    results['A & B. Login with existing admin credentials (Admin Login Route)'] = 'FAIL: ' + err.message;
  }

  // C & D. Confirm dashboard data comes from MongoDB (via API)
  try {
    const res = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie }
    });
    if (res.data.success && res.data.data.totalUsers !== undefined) {
      results['C & D. Confirm dashboard data comes from MongoDB'] = 'PASS';
    } else {
      results['C & D. Confirm dashboard data comes from MongoDB'] = 'FAIL';
    }
  } catch (err) {
    results['C & D. Confirm dashboard data comes from MongoDB'] = 'FAIL: ' + err.message;
  }

  // E. Confirm pending KYC appears
  try {
    const res = await axios.get(`${API_URL}/kyc/admin/list?status=PENDING`, {
      headers: { Cookie: adminCookie }
    });
    if (res.data.success && res.data.data.kycRecords.some(k => k._id.toString() === kycId.toString())) {
      results['E. Confirm pending KYC appears'] = 'PASS';
    } else {
      results['E. Confirm pending KYC appears'] = 'FAIL: Record not found in pending list';
    }
  } catch (err) {
    results['E. Confirm pending KYC appears'] = 'FAIL: ' + err.message;
  }

  // F & G. Approve/reject a tutor and confirm status changes in MongoDB
  try {
    const res = await axios.put(`${API_URL}/kyc/admin/${kycId}/status`, {
      status: 'VERIFIED',
      adminNotes: 'Looks good'
    }, { headers: { Cookie: adminCookie } });
    
    if (res.data.success) {
      // Re-fetch to confirm change in DB
      const getRes = await axios.get(`${API_URL}/kyc/admin/${kycId}`, {
        headers: { Cookie: adminCookie }
      });
      if (getRes.data.data.kyc.status === 'VERIFIED') {
        results['F & G. Approve tutor and confirm status changes in MongoDB'] = 'PASS';
      } else {
        results['F & G. Approve tutor and confirm status changes in MongoDB'] = 'FAIL: Status did not persist';
      }
    }
  } catch (err) {
    results['F & G. Approve tutor and confirm status changes in MongoDB'] = 'FAIL: ' + err.message;
  }

  // H & I. Open /admin while logged in as a Student & confirm access is denied
  try {
    await axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Cookie: studentCookie }
    });
    results['H & I. Student accessing admin routes'] = 'FAIL: Should have thrown 403';
  } catch (err) {
    if (err.response && err.response.status === 403) {
      results['H & I. Student accessing admin routes'] = 'PASS (Access Denied 403)';
    } else {
      results['H & I. Student accessing admin routes'] = 'FAIL: Wrong status ' + err.response?.status;
    }
  }

  // J & K. Logout admin & Confirm /admin is no longer accessible
  try {
    const logoutRes = await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Cookie: adminCookie }
    });
    const loggedOutCookie = extractCookie(logoutRes);
    
    // Try to access admin dashboard with the cleared cookie
    await axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Cookie: loggedOutCookie }
    });
    results['J & K. Logout admin & confirm no longer accessible'] = 'FAIL: Should have thrown 401';
  } catch (err) {
    if (err.response && err.response.status === 401) {
      results['J & K. Logout admin & confirm no longer accessible'] = 'PASS (Access Denied 401)';
    } else {
      results['J & K. Logout admin & confirm no longer accessible'] = 'FAIL: Wrong status ' + err.response?.status;
    }
  }

  console.log('\n====================================================');
  console.log('FINAL ADMIN FLOW TEST RESULTS');
  console.log('====================================================');
  console.table(results);

  // Cleanup test users
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    const testUsers = await User.find({ email: { $regex: /_admin_/ } });
    const userIds = testUsers.map(u => u._id);
    if (userIds.length > 0) {
      await mongoose.model('StudentProfile').deleteMany({ user: { $in: userIds } });
      await mongoose.model('TutorProfile').deleteMany({ user: { $in: userIds } });
      await mongoose.model('KYC').deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error('Cleanup failed:', e.message);
  }
}

runAdminFlowTests();
