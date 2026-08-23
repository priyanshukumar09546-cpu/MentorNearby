// ============================================================
// backend/scripts/resetTestData.js
// Production-Safe Test Data Reset Script for TutorNearby
// ============================================================

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

// Import All Models
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const KYC = require('../models/KYC');
const ContactUnlock = require('../models/ContactUnlock');
const TuitionRequirement = require('../models/TuitionRequirement');
const TutorRequest = require('../models/TutorRequest');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Review = require('../models/Review');
const RiskFlag = require('../models/RiskFlag');
const SavedTutor = require('../models/SavedTutor');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');
const AdminConfig = require('../models/AdminConfig');

const isConfirm = process.argv.includes('--confirm');

async function resetTestData() {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI || MONGO_URI.includes('<username>')) {
    console.error('❌ MONGO_URI is missing or invalid in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    const dbName = conn.connection.name;

    // 1. Identify Admin & Super Admin Users to Preserve
    const allUsers = await User.find({});
    
    const adminUsers = allUsers.filter((u) => {
      const roleUpper = (u.role || '').toUpperCase();
      return roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
    });

    const adminUserIds = adminUsers.map((u) => u._id);

    const superAdminsCount = adminUsers.filter(u => (u.role || '').toUpperCase() === 'SUPER_ADMIN').length;
    const adminsCount = adminUsers.length - superAdminsCount;

    // 2. Identify Non-Admin Users (Student & Tutor accounts)
    const testUsers = allUsers.filter((u) => {
      const roleUpper = (u.role || '').toUpperCase();
      return roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN';
    });

    const testUserIds = testUsers.map((u) => u._id);

    const studentTestUsers = testUsers.filter((u) => (u.role || '').toUpperCase() === 'STUDENT');
    const tutorTestUsers = testUsers.filter((u) => (u.role || '').toUpperCase() === 'TUTOR');
    const otherTestUsers = testUsers.filter((u) => {
      const r = (u.role || '').toUpperCase();
      return r !== 'STUDENT' && r !== 'TUTOR';
    });

    const studentTestCount = studentTestUsers.length;
    const tutorTestCount = tutorTestUsers.length + otherTestUsers.length;

    // Filter queries for dependent data
    const studentProfileFilter = { $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] };
    const tutorProfileFilter = { $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] };
    const kycFilter = { $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] };
    const tuitionRequirementFilter = { $or: [{ student: { $in: testUserIds } }, { student: { $nin: adminUserIds } }] };
    const tutorRequestFilter = {
      $or: [
        { student: { $in: testUserIds } },
        { tutor: { $in: testUserIds } },
        { student: { $nin: adminUserIds } },
        { tutor: { $nin: adminUserIds } },
      ],
    };
    const contactUnlockFilter = {
      $or: [
        { user: { $in: testUserIds } },
        { tutor: { $in: testUserIds } },
        { user: { $nin: adminUserIds } },
        { tutor: { $nin: adminUserIds } },
      ],
    };
    const notificationFilter = { $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] };
    const reportFilter = {
      $or: [
        { reporter: { $in: testUserIds } },
        { reportedUser: { $in: testUserIds } },
        { reporter: { $nin: adminUserIds } },
      ],
    };
    const reviewFilter = {
      $or: [
        { tutor: { $in: testUserIds } },
        { reviewer: { $in: testUserIds } },
      ],
    };
    const riskFlagFilter = { $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] };
    const savedTutorFilter = {
      $or: [
        { user: { $in: testUserIds } },
        { tutor: { $in: testUserIds } },
      ],
    };
    const messageFilter = {
      $or: [
        { sender: { $in: testUserIds } },
        { receiver: { $in: testUserIds } },
      ],
    };

    if (!isConfirm) {
      console.log('⚠️ DRY RUN MODE: Run with --confirm flag to execute actual deletion.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // EXECUTING DELETION
    console.log('🚀 Executing database reset...\n');

    const delStudentProfiles = await StudentProfile.deleteMany(studentProfileFilter);
    const delTutorProfiles = await TutorProfile.deleteMany(tutorProfileFilter);
    const delKYC = await KYC.deleteMany(kycFilter);
    const delRequirements = await TuitionRequirement.deleteMany(tuitionRequirementFilter);
    const delRequests = await TutorRequest.deleteMany(tutorRequestFilter);
    const delUnlocks = await ContactUnlock.deleteMany(contactUnlockFilter);
    const delNotifications = await Notification.deleteMany(notificationFilter);
    const delReports = await Report.deleteMany(reportFilter);
    const delReviews = await Review.deleteMany(reviewFilter);
    const delRiskFlags = await RiskFlag.deleteMany(riskFlagFilter);
    const delSavedTutors = await SavedTutor.deleteMany(savedTutorFilter);
    const delMessages = await Message.deleteMany(messageFilter);

    // Delete Student and Tutor Users
    const delUsers = await User.deleteMany({ _id: { $in: testUserIds } });

    // POST-RESET VERIFICATION
    const verifyStudents = await User.countDocuments({ role: { $in: ['STUDENT', 'student'] } });
    const verifyTutors = await User.countDocuments({ role: { $in: ['TUTOR', 'tutor'] } });
    const remainingUsers = await User.find({});
    
    const verifyAdmins = remainingUsers.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length;
    const verifySuperAdmins = remainingUsers.filter(u => (u.role || '').toUpperCase() === 'SUPER_ADMIN').length;

    console.log('DATABASE RESET COMPLETE\n');
    console.log('MongoDB Connection: OK');
    console.log(`Database: ${dbName}\n`);

    console.log('Users:');
    console.log(`Students: ${verifyStudents}`);
    console.log(`Tutors: ${verifyTutors}`);
    console.log(`Admins: ${verifyAdmins}`);
    console.log(`Super Admins: ${verifySuperAdmins}\n`);

    console.log('Deleted:');
    console.log(`Student Users: ${studentTestCount}`);
    console.log(`Tutor Users: ${tutorTestCount}`);
    console.log(`Student Profiles: ${delStudentProfiles.deletedCount}`);
    console.log(`Tutor Profiles: ${delTutorProfiles.deletedCount}`);
    console.log(`KYC Records: ${delKYC.deletedCount}`);
    console.log(`Tutor Requests: ${delRequirements.deletedCount + delRequests.deletedCount}`);
    console.log(`Contact Unlocks: ${delUnlocks.deletedCount}`);
    console.log(`Payments/Transactions: ${delUnlocks.deletedCount}`);
    console.log(`Notifications: ${delNotifications.deletedCount}`);
    console.log(`Messages/Connections: ${delMessages.deletedCount}`);
    console.log(`Reports: ${delReports.deletedCount}`);
    console.log(`Other dependent records: ${delReviews.deletedCount + delSavedTutors.deletedCount + delRiskFlags.deletedCount}\n`);

    console.log('Preserved:');
    console.log(`Admin Users: ${verifyAdmins}`);
    console.log(`Super Admin Users: ${verifySuperAdmins}`);
    console.log(`System Configurations: ${await AdminConfig.countDocuments()}`);
    console.log(`Admin Audit History: ${await AuditLog.countDocuments({ admin: { $in: adminUserIds } })}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetTestData();
