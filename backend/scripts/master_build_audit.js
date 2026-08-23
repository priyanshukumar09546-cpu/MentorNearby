const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API = 'http://localhost:5000/api';

const extractCookie = (res) => {
  if (res.headers['set-cookie']) {
    return res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }
  return '';
};

async function runMasterAudit() {
  console.log('====================================================');
  console.log('TUTORNEARBY — MASTER PRODUCTION BUILD AUDIT');
  console.log('====================================================\n');

  const results = {};

  // 1. Student Registration
  const studentEmail = `student_master_${Date.now()}@example.com`;
  let studentCookie = '';
  try {
    const res = await axios.post(`${API}/auth/register`, {
      name: 'Master Student',
      email: studentEmail,
      password: 'Password123!',
      phone: '9876543210',
      role: 'STUDENT'
    });
    studentCookie = extractCookie(res);
    results['1. Student Registration'] = res.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['1. Student Registration'] = 'FAIL: ' + (e.response?.data?.message || e.message);
  }

  // 2. Student Profile & Settings Update
  try {
    const resProf = await axios.get(`${API}/users/profile`, { headers: { Cookie: studentCookie } });
    if (!resProf.data.success) throw new Error('Failed getProfile');

    const resUp = await axios.put(`${API}/users/profile`, { name: 'Master Student Updated', phone: '9876543210' }, { headers: { Cookie: studentCookie } });
    if (!resUp.data.success) throw new Error('Failed updateProfile');

    const resStudUp = await axios.put(`${API}/users/student-profile`, {
      studentDetails: { class: 'Class 10', board: 'CBSE', medium: 'English' },
      academicDetails: { subjectsRequired: ['Mathematics', 'Physics'] }
    }, { headers: { Cookie: studentCookie } });

    results['2. Student Profile & Settings'] = resStudUp.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['2. Student Profile & Settings'] = 'FAIL: ' + (e.response?.data?.message || e.message);
  }

  // 3. Tutor Registration
  const tutorEmail = `tutor_master_${Date.now()}@example.com`;
  let tutorCookie = '';
  try {
    const res = await axios.post(`${API}/auth/register`, {
      name: 'Master Tutor',
      email: tutorEmail,
      password: 'Password123!',
      phone: '9876543210',
      role: 'TUTOR',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      professionalHeadline: 'Master Math Educator',
      bio: 'Experienced educator with 5+ years experience.',
      education: [{ degree: 'B.Sc Mathematics', institution: 'Mumbai University', year: 2015 }],
      subjects: ['Mathematics', 'Physics'],
      grades: ['Class 9', 'Class 10'],
      teachingModes: ['Online', 'Offline'],
      fees: { amount: 500, frequency: 'Hour' },
      location: { city: 'Mumbai', area: 'Andheri', pincode: '400053' }
    });
    tutorCookie = extractCookie(res);
    results['3. Tutor Registration'] = res.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['3. Tutor Registration'] = 'FAIL: ' + (e.response?.data?.message || e.message);
  }

  // 4. Tutor Profile Update
  try {
    const resUp = await axios.put(`${API}/tutors/profile`, {
      professionalHeadline: 'Master Math & Physics Educator',
      bio: 'Expert tutor with 5+ years experience.',
      subjects: ['Mathematics', 'Physics'],
      grades: ['Class 9', 'Class 10', 'Class 11'],
      fees: { amount: 500, frequency: 'Hour' }
    }, { headers: { Cookie: tutorCookie } });

    results['4. Tutor Profile Update'] = resUp.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['4. Tutor Profile Update'] = 'FAIL: ' + (e.response?.data?.message || e.message);
  }

  // 5. Tutor Search API
  try {
    const resSearch = await axios.get(`${API}/search/tutors?subject=Mathematics`);
    results['5. Tutor Search API'] = resSearch.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['5. Tutor Search API'] = 'FAIL: ' + e.message;
  }

  // 6. Admin Authentication & Overview Stats
  let adminCookie = '';
  try {
    const resAdmin = await axios.post(`${API}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    adminCookie = extractCookie(resAdmin);
    const resStats = await axios.get(`${API}/admin/dashboard`, { headers: { Cookie: adminCookie } });
    results['6. Admin Auth & Dashboard Stats'] = (resAdmin.data.success && resStats.data.success) ? 'PASS' : 'FAIL';
  } catch (e) {
    results['6. Admin Auth & Dashboard Stats'] = 'FAIL: ' + (e.response?.data?.message || e.message);
  }

  // 7. Non-Admin 403 Security Check
  try {
    await axios.get(`${API}/admin/dashboard`, { headers: { Cookie: studentCookie } });
    results['7. Non-Admin 403 Security'] = 'FAIL: Accessed admin endpoint';
  } catch (e) {
    results['7. Non-Admin 403 Security'] = e.response?.status === 403 ? 'PASS' : 'FAIL: ' + e.response?.status;
  }

  // 8. Logout Session Invalidation
  try {
    const resOut = await axios.post(`${API}/auth/logout`, {}, { headers: { Cookie: studentCookie } });
    const outCookie = extractCookie(resOut);
    try {
      await axios.get(`${API}/users/profile`, { headers: { Cookie: outCookie } });
      results['8. Logout Session Invalidation'] = 'FAIL: Session still valid';
    } catch (e2) {
      results['8. Logout Session Invalidation'] = e2.response?.status === 401 ? 'PASS' : 'FAIL: ' + e2.response?.status;
    }
  } catch (e) {
    results['8. Logout Session Invalidation'] = 'FAIL: ' + e.message;
  }

  console.log('\n====================================================');
  console.log('FINAL MASTER AUDIT RESULTS');
  console.log('====================================================');
  console.table(results);
}

runMasterAudit();
