require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const controller = require('../controllers/studyResourceController');
const StudyResource = require('../models/StudyResource');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  const resource = await StudyResource.findOne({
    classLevel: { $in: ['10', 'Class 10'] },
    subject: /Math/i,
    chapterNumber: 1,
    resourceType: 'FORMULA_SHEET',
  });

  console.log('Testing Read API for ID:', resource._id.toString());

  let apiRes = {};
  await controller.readStudyResource(
    { params: { id: resource._id.toString() }, user: null },
    { status: (s) => ({ json: (d) => { apiRes = { status: s, ...d }; } }) }
  );

  console.log('\n--- API RESPONSE ---');
  console.log(JSON.stringify(apiRes, null, 2));

  await mongoose.disconnect();
}

test().catch(console.error);
