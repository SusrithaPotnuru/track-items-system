require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Settings = require('../models/Settings.model');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Settings singleton
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({ companyName: 'My Company' });
      console.log('Settings singleton created');
    } else {
      console.log('Settings already exist — skipping');
    }

    // Default admin user
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@company.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        fullName: process.env.SEED_ADMIN_NAME || 'Administrator',
        email: adminEmail,
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
        role: 'admin',
        status: 'active',
      });
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin already exists (${adminEmail}) — skipping`);
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
