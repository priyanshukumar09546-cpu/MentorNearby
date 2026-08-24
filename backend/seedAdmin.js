// ============================================================
// seedAdmin.js — Automated Admin Seeder for MentorNearby
// ============================================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️ [SEED_ADMIN] MONGODB_URI not found in environment.');
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@tutornearby.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminMobile = process.env.ADMIN_MOBILE || '7668016628';
    const hashed = await bcrypt.hash(adminPassword, 10);

    // Upsert admin user with direct hashed password to guarantee exact bcrypt match
    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: 'Admin',
          password: hashed,
          phone: adminMobile,
          role: 'ADMIN',
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          isSuspended: false,
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ [SEED_ADMIN] Admin created/reset successfully: ${adminEmail} / ${adminPassword} (Role: ${adminUser.role}, ID: ${adminUser._id})`);
    return adminUser;
  } catch (err) {
    console.error('❌ [SEED_ADMIN ERROR]:', err.message);
  }
};

// If run directly from CLI (e.g. node seedAdmin.js)
if (require.main === module) {
  seedAdmin().then(() => {
    console.log('Seeding completed. Exiting...');
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = seedAdmin;
