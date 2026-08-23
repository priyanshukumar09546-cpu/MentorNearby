require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

async function cleanupTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for cleanup');

    const User = require('../models/User');
    const StudentProfile = require('../models/StudentProfile');
    const TutorProfile = require('../models/TutorProfile');
    const KYC = require('../models/KYC');
    const TuitionRequirement = require('../models/TuitionRequirement');
    const TutorRequest = require('../models/TutorRequest');
    const ContactUnlock = require('../models/ContactUnlock');

    // Find test users
    const testUsers = await User.find({
      $or: [
        { email: { $regex: /student_final_/ } },
        { email: { $regex: /tutor_final_/ } },
        { email: { $regex: /google_final_/ } },
        { email: { $regex: /@example.com/ } }
      ]
    });

    const userIds = testUsers.map(u => u._id);

    if (userIds.length > 0) {
      console.log(`Found ${userIds.length} test users to delete.`);

      await StudentProfile.deleteMany({ user: { $in: userIds } });
      await TutorProfile.deleteMany({ user: { $in: userIds } });
      await KYC.deleteMany({ user: { $in: userIds } });
      await TuitionRequirement.deleteMany({ student: { $in: userIds } });
      await TutorRequest.deleteMany({ $or: [{ student: { $in: userIds } }, { tutor: { $in: userIds } }] });
      await ContactUnlock.deleteMany({ $or: [{ user: { $in: userIds } }, { tutor: { $in: userIds } }] });
      
      const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
      console.log(`✅ Deleted ${deletedUsers.deletedCount} test users and all associated profiles/records.`);
    } else {
      console.log('No test users found to clean up.');
    }

  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

cleanupTestData();
