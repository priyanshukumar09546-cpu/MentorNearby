require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const controller = require('../controllers/studyResourceController');
const StudyResource = require('../models/StudyResource');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const resource = await StudyResource.findById('6a7f72ab8e69e3dea68cbee6');
  console.log('Resource found:', resource.title);
  console.log('isFreeDemo in DB:', resource.isFreeDemo);
  console.log('accessType in DB:', resource.accessType);
  console.log('fileUrl in DB:', resource.fileUrl);
  console.log('fileReference in DB:', resource.fileReference);

  let apiRes = {};
  await controller.readStudyResource(
    { params: { id: '6a7f72ab8e69e3dea68cbee6' }, user: null },
    { status: (s) => ({ json: (d) => { apiRes = { status: s, ...d }; } }) }
  );

  console.log('\n--- API Response ---');
  console.log(JSON.stringify(apiRes, null, 2));

  await mongoose.disconnect();
}

test().catch(console.error);
