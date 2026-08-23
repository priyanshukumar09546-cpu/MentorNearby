require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

async function cleanupAdminTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    require('../models/StudentProfile');
    require('../models/TutorProfile');
    require('../models/KYC');
    const testUsers = await User.find({ email: { $regex: /_admin_/ } });
    const userIds = testUsers.map(u => u._id);
    if (userIds.length > 0) {
      await mongoose.model('StudentProfile').deleteMany({ user: { $in: userIds } });
      await mongoose.model('TutorProfile').deleteMany({ user: { $in: userIds } });
      await mongoose.model('KYC').deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      console.log('Cleaned test users:', userIds.length);
    }
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}
cleanupAdminTestData();
