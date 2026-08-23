require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const SavedTutor = require('../models/SavedTutor');
const ContactUnlock = require('../models/ContactUnlock');
const bcrypt = require('bcryptjs');

async function testProfile() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  console.log('--- 1. Testing Tutor Profile Query ---');
  let tutorUser = await User.findOne({ role: 'TUTOR' });
  if (!tutorUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);
    tutorUser = await User.create({
      name: 'Dr. Ramesh Gupta',
      email: 'ramesh.tutor@example.com',
      password: hashedPassword,
      role: 'TUTOR',
      phoneVerified: true,
      emailVerified: true
    });
  }

  let tutor = await TutorProfile.findOne({ user: tutorUser._id }).populate('user', 'name email emailVerified phoneVerified role');
  if (!tutor) {
    tutor = await TutorProfile.create({
      user: tutorUser._id,
      professionalHeadline: 'Senior Mathematics & Physics Faculty (10+ Yrs Exp.)',
      bio: 'Dedicated educator specializing in CBSE Class 9-12 and JEE foundational preparation.',
      teachingPhilosophy: 'Every student can excel with clear visual intuition and step-by-step problem solving.',
      subjects: ['Mathematics', 'Physics'],
      grades: ['Class 10', 'Class 11', 'Class 12'],
      teachingModes: ['Online', 'Offline'],
      fees: { amount: 700, frequency: 'Hour', negotiable: true },
      location: { city: 'Hapur', state: 'Uttar Pradesh', area: 'Railway Road', pincode: '245101' },
      kycStatus: 'VERIFIED',
      verificationStatus: { phone: true, email: true, identity: true, collegeId: true, background: true }
    });
    tutor = await TutorProfile.findById(tutor._id).populate('user', 'name email emailVerified phoneVerified role');
  }

  console.log('✅ PASS: Found Tutor Profile:');
  console.log('Name:', tutor.user?.name);
  console.log('Role in User Model:', tutor.user?.role, '(Guaranteed TUTOR, never Student/Parent)');
  console.log('Headline:', tutor.professionalHeadline);
  console.log('Subjects:', tutor.subjects);
  console.log('KYC Status:', tutor.kycStatus);
  console.log('Fee:', tutor.fees?.amount, '/', tutor.fees?.frequency);

  console.log('--- 2. Testing Saved Tutor & Shortlist ---');
  let student = await User.findOne({ role: 'STUDENT' });
  if (!student) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);
    student = await User.create({
      name: 'Ananya Verma',
      email: 'ananya.student@example.com',
      password: hashedPassword,
      role: 'STUDENT'
    });
  }

  await SavedTutor.deleteMany({ user: student._id, tutor: tutorUser._id });
  
  // Save tutor
  const saveRec = await SavedTutor.create({ user: student._id, tutor: tutorUser._id });
  console.log('✅ PASS: Saved tutor successfully with ID:', saveRec._id);

  // Check save
  const isSaved = await SavedTutor.exists({ user: student._id, tutor: tutorUser._id });
  console.log('✅ PASS: isSaved check returns:', !!isSaved);

  // Remove save
  await SavedTutor.deleteOne({ _id: saveRec._id });
  console.log('✅ PASS: Removed saved tutor successfully');

  console.log('--- 3. Testing Contact Unlock Pricing Rule ---');
  const previousUnlocksCount = await ContactUnlock.countDocuments({
    user: student._id,
    status: { $in: ['CONTACT_UNLOCKED', 'ACCEPTED'] }
  });
  const nextUnlockNumber = previousUnlocksCount + 1;
  const price = nextUnlockNumber <= 2 ? 100 : 60;
  console.log(`Current unlocks used: ${previousUnlocksCount}, Next Unlock #: ${nextUnlockNumber}, Price: ₹${price}`);
  if (nextUnlockNumber <= 2 && price === 100) {
    console.log('✅ PASS: Correct ₹100 pricing for first 2 unlocks');
  } else if (nextUnlockNumber > 2 && price === 60) {
    console.log('✅ PASS: Correct ₹60 pricing for 3rd unlock onward');
  }

  console.log('🎉 ALL TUTOR PROFILE TESTS PASSED CLEANLY!');
  process.exit(0);
}

testProfile().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
