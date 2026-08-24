// ============================================================
// backend/resetAdmin.js — Standalone Admin Password Reset
// ============================================================
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const connectDB = require('./config/db');

const resetAdmin = async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@tutornearby.in').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const hashed = await bcrypt.hash(password, 10);

  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        password: hashed,
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isSuspended: false,
        name: 'Admin',
        phone: '7668016628'
      }
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Admin reset done: ${email} / ${password} (Role: ${updatedUser.role})`);
  process.exit(0);
};

resetAdmin().catch((err) => {
  console.error('❌ Admin reset failed:', err.message);
  process.exit(1);
});
