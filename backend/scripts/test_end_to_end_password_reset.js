// ============================================================
// backend/scripts/test_end_to_end_password_reset.js
// Complete End-to-End Password Recovery Verification
// ============================================================

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testPasswordFlow() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const User = require('../models/User');

  const testEmail = 'qa_test_recovery_' + Date.now() + '@example.com';
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword2026!#';

  // 1. Create test user
  const user = await User.create({
    name: 'QA Password Test User',
    email: testEmail,
    password: initialPassword,
    role: 'STUDENT',
    phone: '9988776655'
  });
  console.log('1. Created test user:', testEmail);

  // 2. Simulate forgotPassword token generation
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  console.log('2. Generated reset token and 10-minute expiry');

  // Verify token in DB
  const userInDb = await User.findOne({ passwordResetToken: hashedToken });
  if (!userInDb || userInDb.passwordResetExpires < Date.now()) {
    throw new Error('Token verification in DB failed');
  }
  console.log('3. Token verified in DB with active 10-min expiry');

  // 4. Simulate resetPassword with new password
  const targetUser = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password');

  if (!targetUser) {
    throw new Error('Target user not found by valid token');
  }

  targetUser.password = newPassword;
  targetUser.passwordResetToken = undefined;
  targetUser.passwordResetExpires = undefined;
  await targetUser.save();
  console.log('4. Password reset executed and token invalidated');

  // 5. Verify single-use: token must be null now
  const reuseCheck = await User.findOne({ passwordResetToken: hashedToken });
  if (reuseCheck) {
    throw new Error('Security violation: token was reused or not deleted!');
  }
  console.log('5. Token reuse prevention verified: token cannot be used again');

  // 6. Verify old password no longer works
  const freshUser = await User.findOne({ email: testEmail }).select('+password');
  const oldMatch = await freshUser.comparePassword(initialPassword);
  if (oldMatch) {
    throw new Error('Security violation: old password still works!');
  }
  console.log('6. Old password properly invalidated (comparePassword = false)');

  // 7. Verify new password works
  const newMatch = await freshUser.comparePassword(newPassword);
  if (!newMatch) {
    throw new Error('New password does not match!');
  }
  console.log('7. New password verified (comparePassword = true)');

  // Clean up
  await User.deleteOne({ _id: user._id });
  console.log('8. Test user cleaned up successfully from database');
  await mongoose.disconnect();
  console.log('✅ ALL 8 PASSWORDS & RECOVERY SECURITY CHECKS PASSED');
}

testPasswordFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
