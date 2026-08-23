const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const testAuthLogic = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Verify User Schema Role Enum
    const userRoleEnum = User.schema.path('role').enumValues;
    console.log('📋 User Schema Allowed Roles:', userRoleEnum);

    if (userRoleEnum.includes('PARENT') && userRoleEnum.includes('STUDENT') && userRoleEnum.includes('TUTOR') && userRoleEnum.includes('ADMIN')) {
      console.log('✅ Role Enum contains STUDENT, PARENT, TUTOR, ADMIN');
    } else {
      console.error('❌ Role Enum missing required roles!');
    }

    // 2. Inspect existing Admin accounts
    const admins = await User.find({ role: 'ADMIN' }).select('name email role');
    console.log(`🛡️ Preserved Admin Accounts (${admins.length}):`);
    admins.forEach(a => console.log(`   - ${a.name} (${a.email}) [Role: ${a.role}]`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Database inspection failed:', err.message);
    process.exit(1);
  }
};

testAuthLogic();
