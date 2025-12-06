require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/database');

const createGeneralAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Admin data
    const adminData = {
      name: process.env.ADMIN_NAME || 'General Admin',
      role: 'general',
      telefonRaqam: process.env.ADMIN_PHONE || '+998901234567',
      username: process.env.ADMIN_USERNAME || 'generaladmin',
      parol: process.env.ADMIN_PASSWORD || 'admin123',
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [
        { username: adminData.username },
        { telefonRaqam: adminData.telefonRaqam },
      ],
    });

    if (existingAdmin) {
      console.log('❌ Admin with this username or phone number already exists');
      console.log('Existing admin:', {
        id: existingAdmin._id,
        name: existingAdmin.name,
        username: existingAdmin.username,
        role: existingAdmin.role,
      });
      process.exit(1);
    }

    // Create admin
    const admin = await Admin.create(adminData);

    console.log('✅ General admin created successfully!');
    console.log('Admin details:');
    console.log({
      id: admin._id,
      name: admin.name,
      username: admin.username,
      role: admin.role,
      telefonRaqam: admin.telefonRaqam,
      createdAt: admin.createdAt,
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating general admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createGeneralAdmin();



