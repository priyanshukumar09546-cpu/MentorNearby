const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const TutorProfile = require('../models/TutorProfile');

dotenv.config({ path: path.join(__dirname, '../.env') });

const testSearchAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const totalTutors = await TutorProfile.countDocuments({ profileVisibility: true });
    console.log(`📊 Visible Tutor Profiles in DB: ${totalTutors}`);

    const sampleTutors = await TutorProfile.find({ profileVisibility: true })
      .populate('user', 'name role')
      .limit(3);

    console.log('🔍 Sample Tutors in DB:');
    sampleTutors.forEach(t => {
      console.log(`   - ${t.user?.name || 'Tutor'} [Role: ${t.user?.role}] | City: ${t.location?.city || 'N/A'} | Subjects: ${t.subjects?.join(', ')}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Search test failed:', err.message);
    process.exit(1);
  }
};

testSearchAPI();
