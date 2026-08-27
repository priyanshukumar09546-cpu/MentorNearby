// ============================================================
// removeFakeCourseVideos.js
// Clears all fake YouTube video URLs from courses & course papers
// Keeps titles, years, durations, descriptions, and PPTs completely intact.
// ============================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI / MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const CoursePaper = mongoose.connection.collection('coursepapers');
    const Course = mongoose.connection.collection('courses');

    // 1. Update all CoursePaper documents to blank out fake video URLs
    const paperResult = await CoursePaper.updateMany(
      {},
      {
        $set: {
          youtubeUrl: '',
          youtubeVideoId: '',
          'video.url': '',
          'video.youtubeUrl': '',
          'video.youtubeVideoId': '',
        }
      }
    );
    console.log(`Updated ${paperResult.modifiedCount} CoursePapers — cleared all fake video URLs.`);

    // 2. Update all Course documents to blank out promotional / course-level fake video URLs
    const courseResult = await Course.updateMany(
      {},
      {
        $set: {
          youtubeUrl: '',
          youtubeVideoId: '',
          'promoVideo.url': '',
        }
      }
    );
    console.log(`Updated ${courseResult.modifiedCount} Courses — cleared all fake video URLs.`);

    console.log('All course video URLs cleared. PPTs, metadata, and subjects intact.');
    process.exit(0);
  } catch (err) {
    console.error('Error removing fake course videos:', err);
    process.exit(1);
  }
};

run();
