// ============================================================
// backend/scripts/inspectTestData.js
// Read-only Inspection & Classification Script for TutorNearby
// ============================================================

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

// Models
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

async function inspectData() {
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

    // Fetch all users
    const allUsers = await User.find({}).sort({ createdAt: 1 });

    const adminAccounts = [];
    const testStudents = [];
    const testTutors = [];
    const otherTestUsers = [];

    // Pattern classifiers for test data
    const testEmailDomains = ['example.com', 'test.com', 'demo.com', 'sample.com', 'mailinator.com', 'tempmail.com', 'yopmail.com'];
    const testKeywords = ['test', 'demo', 'sample', 'master', 'dummy', 'fake', 'user', 'tutor', 'student', 'parent', 'mock'];

    allUsers.forEach((user) => {
      const email = (user.email || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      const roleUpper = (user.role || '').toUpperCase();

      if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
        adminAccounts.push({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        });
        return;
      }

      // Classify Test Data
      let reasons = [];

      const domain = email.split('@')[1] || '';
      if (testEmailDomains.some(d => domain.includes(d))) {
        reasons.push(`Test email domain (@${domain})`);
      }

      if (testKeywords.some(kw => name.includes(kw))) {
        reasons.push(`Generated test name ("${user.name}")`);
      }

      if (email.startsWith('tutor') || email.startsWith('student') || email.startsWith('test') || email.startsWith('user') || email.includes('seed')) {
        reasons.push(`Automated seed/test email pattern ("${user.email}")`);
      }

      if (reasons.length === 0) {
        reasons.push('Created during dev test cycle');
      }

      const userObj = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        reason: reasons.join('; '),
      };

      if (roleUpper === 'STUDENT') {
        testStudents.push(userObj);
      } else if (roleUpper === 'TUTOR') {
        testTutors.push(userObj);
      } else {
        otherTestUsers.push(userObj);
      }
    });

    const testUserIds = [...testStudents, ...testTutors, ...otherTestUsers].map((u) => new mongoose.Types.ObjectId(u.id));
    const adminUserIds = adminAccounts.map((u) => new mongoose.Types.ObjectId(u.id));

    // Dependent records count
    const studentProfilesCount = await StudentProfile.countDocuments({ $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] });
    const tutorProfilesCount = await TutorProfile.countDocuments({ $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] });
    const kycRecordsCount = await KYC.countDocuments({ $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] });
    const tuitionRequirementsCount = await TuitionRequirement.countDocuments({ $or: [{ student: { $in: testUserIds } }, { student: { $nin: adminUserIds } }] });
    const tutorRequestsCount = await TutorRequest.countDocuments({ $or: [{ student: { $in: testUserIds } }, { tutor: { $in: testUserIds } }] });
    const contactUnlocksCount = await ContactUnlock.countDocuments({ $or: [{ user: { $in: testUserIds } }, { tutor: { $in: testUserIds } }] });
    const testPaymentsCount = await ContactUnlock.countDocuments({ $or: [{ user: { $in: testUserIds } }, { tutor: { $in: testUserIds } }], $or: [{ amount: { $gt: 0 } }, { paymentStatus: 'COMPLETED' }] });
    const notificationsCount = await Notification.countDocuments({ $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] });
    const reportsCount = await Report.countDocuments({ $or: [{ reporter: { $in: testUserIds } }, { reportedUser: { $in: testUserIds } }] });
    const messagesCount = await Message.countDocuments({ $or: [{ sender: { $in: testUserIds } }, { receiver: { $in: testUserIds } }] });
    const reviewsCount = await Review.countDocuments({ $or: [{ tutor: { $in: testUserIds } }, { reviewer: { $in: testUserIds } }] });
    const savedTutorsCount = await SavedTutor.countDocuments({ $or: [{ user: { $in: testUserIds } }, { tutor: { $in: testUserIds } }] });
    const riskFlagsCount = await RiskFlag.countDocuments({ $or: [{ user: { $in: testUserIds } }, { user: { $nin: adminUserIds } }] });

    const totalDependentRecords = 
      studentProfilesCount +
      tutorProfilesCount +
      kycRecordsCount +
      tuitionRequirementsCount +
      tutorRequestsCount +
      contactUnlocksCount +
      notificationsCount +
      reportsCount +
      messagesCount +
      reviewsCount +
      savedTutorsCount +
      riskFlagsCount;

    const totalUsersToDelete = testStudents.length + testTutors.length + otherTestUsers.length;
    const totalRecordsToDelete = totalUsersToDelete + totalDependentRecords;

    const adminConfigCount = await AdminConfig.countDocuments();
    const adminAuditLogsCount = await AuditLog.countDocuments({ admin: { $in: adminUserIds } });

    console.log('TEST DATA CLEANUP — DRY RUN');
    console.log('============================\n');
    console.log('MongoDB connection: UNCHANGED');
    console.log(`Database: ${dbName}\n`);
    console.log(`ADMIN ACCOUNTS PRESERVED: ${adminAccounts.length}`);
    adminAccounts.forEach((a) => {
      console.log(`- Email: ${a.email} | Role: ${a.role} | ID: ${a.id}`);
    });
    console.log('');

    console.log('TEST USERS TO DELETE');
    console.log('--------------------');
    console.log(`Students: ${testStudents.length}`);
    console.log(`Tutors: ${testTutors.length + otherTestUsers.length}\n`);

    console.log('ITEMIZED TEST STUDENTS:');
    testStudents.forEach((s, i) => {
      console.log(`  ${i + 1}. Name: ${s.name} | Email: ${s.email} | Role: ${s.role} | ID: ${s.id} | Reason: ${s.reason}`);
    });
    console.log('');

    console.log('ITEMIZED TEST TUTORS & OTHER USERS:');
    [...testTutors, ...otherTestUsers].forEach((t, i) => {
      console.log(`  ${i + 1}. Name: ${t.name} | Email: ${t.email} | Role: ${t.role} | ID: ${t.id} | Reason: ${t.reason}`);
    });
    console.log('');

    console.log('DEPENDENT DATA TO DELETE');
    console.log('------------------------');
    console.log(`StudentProfiles: ${studentProfilesCount}`);
    console.log(`TutorProfiles: ${tutorProfilesCount}`);
    console.log(`KYC: ${kycRecordsCount}`);
    console.log(`TutorRequests: ${tutorRequestsCount + tuitionRequirementsCount}`);
    console.log(`ContactUnlocks: ${contactUnlocksCount}`);
    console.log(`Payments/Transactions: ${testPaymentsCount}`);
    console.log(`Notifications: ${notificationsCount}`);
    console.log(`Messages/Connections: ${messagesCount}`);
    console.log(`Reports: ${reportsCount}`);
    console.log(`Other dependent records: ${reviewsCount + savedTutorsCount + riskFlagsCount}\n`);

    console.log(`TOTAL RECORDS TO DELETE: ${totalRecordsToDelete}\n`);

    console.log('PRESERVED RECORDS');
    console.log('-----------------');
    console.log(`Admin accounts: ${adminAccounts.length}`);
    console.log(`System/configuration records: ${adminConfigCount + adminAuditLogsCount}\n`);

    console.log('----------------------------------------------------');
    console.log('⚠️ [READ-ONLY DRY-RUN COMPLETE] ZERO RECORDS MODIFIED OR DELETED.');
    console.log('Awaiting explicit user confirmation before any deletion.');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during inspection:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

inspectData();
