import { extractUserRole, getRoleDashboard, normalizeRole } from './src/components/common/ProtectedRoute.jsx';

const userObj1 = { role: 'TUTOR' };
console.log('userObj1:', extractUserRole(userObj1)); // Should be TUTOR

const userObj2 = { user: { role: 'TUTOR' } };
console.log('userObj2:', extractUserRole(userObj2)); // Should be TUTOR

const userObj3 = { role: 'STUDENT' };
console.log('userObj3:', extractUserRole(userObj3)); // Should be STUDENT

const userObj4 = { role: 'tutor' };
console.log('userObj4:', extractUserRole(userObj4)); // Should be TUTOR

const userObj5 = { role: 'admin' };
console.log('userObj5:', extractUserRole(userObj5)); // Should be ADMIN

const emptyObj = {};
console.log('emptyObj:', extractUserRole(emptyObj)); // Should be ''

console.log('Dashboard for TUTOR:', getRoleDashboard('TUTOR'));
console.log('Dashboard for STUDENT:', getRoleDashboard('STUDENT'));
console.log('Dashboard for empty:', getRoleDashboard(''));
