// ============================================================
// seeds/seedAdmin.js
// Creates default admin account and initial AdminConfig
// Run: npm run seed
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  const User = require('../models/User');
  const AdminConfig = require('../models/AdminConfig');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'TutorNearby Admin';

  if (!adminEmail || !adminPassword) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  // ---- Admin User ----
  let admin = await User.findOne({ email: adminEmail });

  if (admin) {
    admin.password = adminPassword;
    admin.role = 'ADMIN';
    admin.emailVerified = true;
    admin.isActive = true;
    await admin.save();
    console.log(`✅ Admin user updated with current .env credentials: ${adminEmail}`);
  } else {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Pre-save hook will hash it
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  }

  // ---- Default Admin Config ----
  const defaultConfigs = [
    {
      key: 'FREE_UNLOCK_COUNT',
      value: parseInt(process.env.DEFAULT_FREE_UNLOCKS) || 2,
      description: 'Number of free contact unlocks each student gets',
    },
    {
      key: 'UNLOCK_PRICE_INR',
      value: parseInt(process.env.DEFAULT_UNLOCK_PRICE) || 49,
      description: 'Price per contact unlock in INR (after free unlocks used)',
    },
    {
      key: 'MAX_REPORTS_BEFORE_REVIEW',
      value: 3,
      description: 'Number of reports a user receives before automatic risk review',
    },
    {
      key: 'ALLOW_REGISTRATIONS',
      value: true,
      description: 'Allow new user registrations',
    },
    {
      key: 'MAINTENANCE_MODE',
      value: false,
      description: 'Put platform in maintenance mode',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const config of defaultConfigs) {
    const existing = await AdminConfig.findOne({ key: config.key });
    if (!existing) {
      await AdminConfig.create({
        ...config,
        updatedBy: admin._id,
      });
      console.log(`✅ Config created: ${config.key} = ${config.value}`);
      created++;
    } else {
      console.log(`ℹ️  Config already exists: ${config.key} (skipped)`);
      skipped++;
    }
  }

  console.log(`\n📊 Seed Summary:`);
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Configs created: ${created}, skipped: ${skipped}`);
  console.log('\n🚀 Seed complete!');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
