// ============================================================
// routes/admin.js — SaaS Admin Control Center Routes
// ============================================================

const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboardStats,
  getRecentUsers,
  getRecentActivities,
  getUserGrowth,
  getUserDistribution,
  getUsers,
  getUserDetail,
  suspendUser,
  unsuspendUser,
  getReports,
  updateReportStatus,
  getRiskFlags,
  getAdminConfig,
  updateAdminConfig,
  getRequirements,
  getConnections,
  getReviews,
  getContactUnlocks,
  getAuditLogs,
  getAnalytics,
  getStudents,
  getStudentDetail,
  approveStudent,
  unapproveStudent,
  suspendStudent,
  reactivateStudent,
  deleteStudentPermanently,
  getTutors,
  getTutorDetail,
  approveTutor,
  unapproveTutor,
  rejectTutor,
  suspendTutor,
  reactivateTutor,
  deleteTutorPermanently,
} = require('../controllers/adminController');
const {
  adminGetKycList,
  adminGetKycDetail,
  adminUpdateKycStatus
} = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/auth');

// Public admin route for login
router.post('/login', adminLogin);

// All other admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/stats', getDashboardStats);
router.get('/dashboard-stats', getDashboardStats);
router.get('/users/recent', getRecentUsers);
router.get('/recent-users', getRecentUsers);
router.get('/activities', getRecentActivities);
router.get('/recent-activities', getRecentActivities);
router.get('/activities/recent', getRecentActivities);
router.get('/user-growth', getUserGrowth);
router.get('/user-distribution', getUserDistribution);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/suspend', suspendUser);
router.post('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);

// Student specialized views & actions
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetail);
router.put('/students/:id/approve', approveStudent);
router.post('/students/:id/approve', approveStudent);
router.patch('/students/:id/approve', approveStudent);
router.put('/students/:id/unapprove', unapproveStudent);
router.post('/students/:id/unapprove', unapproveStudent);
router.patch('/students/:id/unapprove', unapproveStudent);
router.put('/students/:id/suspend', suspendStudent);
router.post('/students/:id/suspend', suspendStudent);
router.patch('/students/:id/suspend', suspendStudent);
router.put('/students/:id/reactivate', reactivateStudent);
router.post('/students/:id/reactivate', reactivateStudent);
router.patch('/students/:id/reactivate', reactivateStudent);
router.delete('/students/:id', deleteStudentPermanently);

// Tutor specialized views & actions
router.get('/tutors', getTutors);
router.get('/tutors/:id', getTutorDetail);
router.put('/tutors/:id/approve', approveTutor);
router.post('/tutors/:id/approve', approveTutor);
router.patch('/tutors/:id/approve', approveTutor);
router.put('/tutors/:id/unapprove', unapproveTutor);
router.post('/tutors/:id/unapprove', unapproveTutor);
router.patch('/tutors/:id/unapprove', unapproveTutor);
router.put('/tutors/:id/reject', rejectTutor);
router.post('/tutors/:id/reject', rejectTutor);
router.patch('/tutors/:id/reject', rejectTutor);
router.put('/tutors/:id/suspend', suspendTutor);
router.post('/tutors/:id/suspend', suspendTutor);
router.patch('/tutors/:id/suspend', suspendTutor);
router.put('/tutors/:id/reactivate', reactivateTutor);
router.post('/tutors/:id/reactivate', reactivateTutor);
router.patch('/tutors/:id/reactivate', reactivateTutor);
router.delete('/tutors/:id', deleteTutorPermanently);

// KYC Verification Center
router.get('/kyc', adminGetKycList);
router.get('/kyc-pending', adminGetKycList);
router.get('/kyc/:id', adminGetKycDetail);
router.put('/kyc/:id', adminUpdateKycStatus);
router.post('/kyc/:id', adminUpdateKycStatus);
router.put('/kyc-pending/:id', adminUpdateKycStatus);
router.post('/kyc-pending/:id', adminUpdateKycStatus);

// Reports & Safety
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);

// Risk flags
router.get('/risk-flags', getRiskFlags);

// Configuration & Pricing
router.get('/config', getAdminConfig);
router.put('/config/:key', updateAdminConfig);

// Market entities
router.get('/requirements', getRequirements);
router.get('/requests', getRequirements);
router.get('/connections', getConnections);
router.get('/reviews', getReviews);
router.get('/contact-unlocks', getContactUnlocks);
router.get('/payments', getContactUnlocks);

// NCERT Sync & Educational Resources Management
const {
  syncNcertContent,
  getSyncStatus,
  getContentHealth,
  validateLinks,
  adminGetResources,
  adminGetResourceById,
  adminCreateResource,
  adminUpdateResource,
  adminDeleteResource,
  adminRestoreResource,
} = require('../controllers/adminResourceController');

router.post('/ncert/sync', syncNcertContent);
router.get('/ncert/sync-status', getSyncStatus);
router.get('/ncert/health', getContentHealth);
router.post('/ncert/validate-links', validateLinks);

router.get('/resources', adminGetResources);
router.post('/resources', adminCreateResource);
router.get('/resources/:id', adminGetResourceById);
router.put('/resources/:id', adminUpdateResource);
router.delete('/resources/:id', adminDeleteResource);
router.put('/resources/:id/restore', adminRestoreResource);

module.exports = router;

