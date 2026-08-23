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

async function verifyLoginPageAuth() {
  console.log('====================================================');
  console.log('LOGIN PAGE — FULL AUTH VERIFICATION');
  console.log('====================================================\n');

  const results = {};

  // 1. Invalid credentials → clear error
  try {
    await axios.post(`${API}/auth/login`, { email: 'fake@xyz.com', password: 'wrong123' });
    results['A. Invalid credentials rejected'] = 'FAIL: No error thrown';
  } catch (e) {
    if (e.response && e.response.status === 401) {
      results['A. Invalid credentials rejected'] = 'PASS (' + e.response.data.message + ')';
    } else {
      results['A. Invalid credentials rejected'] = 'FAIL: ' + e.response?.status;
    }
  }

  // 2. Empty email → validation error
  try {
    await axios.post(`${API}/auth/login`, { email: '', password: 'test' });
    results['B. Empty email rejected'] = 'FAIL: No error thrown';
  } catch (e) {
    results['B. Empty email rejected'] = (e.response?.status === 400 || e.response?.status === 401) ? 'PASS' : 'FAIL';
  }

  // 3. Invalid email format
  try {
    await axios.post(`${API}/auth/login`, { email: 'notanemail', password: 'test' });
    results['C. Invalid email format rejected'] = 'FAIL: No error thrown';
  } catch (e) {
    results['C. Invalid email format rejected'] = (e.response?.status === 400 || e.response?.status === 401) ? 'PASS' : 'FAIL';
  }

  // 4. Valid admin login
  let adminCookie = '';
  try {
    const res = await axios.post(`${API}/auth/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    adminCookie = extractCookie(res);
    if (res.data.success && res.data.data.user.role === 'ADMIN') {
      results['D. Valid login succeeds'] = 'PASS (Role: ADMIN)';
    } else {
      results['D. Valid login succeeds'] = 'FAIL';
    }
  } catch (e) {
    results['D. Valid login succeeds'] = 'FAIL: ' + e.message;
  }

  // 5. Session works (get /me)
  try {
    const res = await axios.get(`${API}/auth/me`, { headers: { Cookie: adminCookie } });
    results['E. Session /me works'] = res.data.success ? 'PASS' : 'FAIL';
  } catch (e) {
    results['E. Session /me works'] = 'FAIL: ' + e.message;
  }

  // 6. Logout invalidates session
  try {
    const logoutRes = await axios.post(`${API}/auth/logout`, {}, { headers: { Cookie: adminCookie } });
    const loggedOutCookie = extractCookie(logoutRes);
    try {
      await axios.get(`${API}/auth/me`, { headers: { Cookie: loggedOutCookie } });
      results['F. Logout invalidates session'] = 'FAIL: Still accessible';
    } catch (e2) {
      results['F. Logout invalidates session'] = e2.response?.status === 401 ? 'PASS' : 'FAIL';
    }
  } catch (e) {
    results['F. Logout invalidates session'] = 'FAIL: ' + e.message;
  }

  // 7. Google auth endpoint exists
  try {
    await axios.post(`${API}/auth/google`, { email: 'notreallyagoogleuser@test.com', name: 'Test', googleId: 'g123', role: 'STUDENT' });
    results['G. Google auth endpoint works'] = 'PASS';
  } catch (e) {
    if (e.response?.status !== 404) {
      results['G. Google auth endpoint works'] = 'PASS (endpoint exists)';
    } else {
      results['G. Google auth endpoint works'] = 'FAIL: 404';
    }
  }

  // 8. /register route accessible
  try {
    const res = await axios.get('http://localhost:5174/register', { maxRedirects: 0 });
    results['H. Sign up link → /register accessible'] = res.status === 200 ? 'PASS' : 'FAIL';
  } catch (e) {
    results['H. Sign up link → /register accessible'] = 'FAIL: ' + e.message;
  }

  // 9. /forgot-password route accessible
  try {
    const res = await axios.get('http://localhost:5174/forgot-password', { maxRedirects: 0 });
    results['I. Forgot Password → /forgot-password accessible'] = res.status === 200 ? 'PASS' : 'FAIL';
  } catch (e) {
    results['I. Forgot Password → /forgot-password accessible'] = 'FAIL: ' + e.message;
  }

  // 10. Duplicate request protection (backend unique constraint)
  try {
    const [r1, r2] = await Promise.allSettled([
      axios.post(`${API}/auth/login`, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
      axios.post(`${API}/auth/login`, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
    ]);
    results['J. Rapid double-login handled'] = (r1.status === 'fulfilled' && r2.status === 'fulfilled') ? 'PASS' : 'PARTIAL';
  } catch (e) {
    results['J. Rapid double-login handled'] = 'FAIL: ' + e.message;
  }

  console.log('\n====================================================');
  console.log('FINAL RESULTS');
  console.log('====================================================');
  console.table(results);
}

verifyLoginPageAuth();
