require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const StudyResource = require('../models/StudyResource');
const { detectStudyFileType } = require('../../frontend/src/utils/studyResourceAccess');

async function testProps() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const resource = await StudyResource.findById('6a7f72ab8e69e3dea68cbee6').lean();
  console.log('Testing detectStudyFileType with resource:');
  console.log(resource);

  const fileInfo = detectStudyFileType(resource);
  console.log('\nResult from detectStudyFileType:');
  console.log(fileInfo);

  // Test empty object
  const emptyInfo = detectStudyFileType({});
  console.log('\nResult from detectStudyFileType({}):');
  console.log(emptyInfo);

  // Test null
  const nullInfo = detectStudyFileType(null);
  console.log('\nResult from detectStudyFileType(null):');
  console.log(nullInfo);

  await mongoose.disconnect();
}

testProps().catch(console.error);
