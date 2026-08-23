require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Please provide ADMIN_EMAIL and ADMIN_PASSWORD in .env');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'ADMIN';
      existingAdmin.emailVerified = true;
      await existingAdmin.save();
      console.log('Admin user updated successfully');
    } else {
      const admin = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
        phone: '0000000000'
      });
      await admin.save();
      console.log('Admin user created successfully');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
