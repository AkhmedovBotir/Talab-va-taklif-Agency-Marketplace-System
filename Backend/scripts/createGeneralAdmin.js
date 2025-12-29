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
      name: process.env.ADMIN_NAME,
      role: 'general',
      telefonRaqam: process.env.ADMIN_PHONE,
      username: process.env.ADMIN_USERNAME,
      parol: process.env.ADMIN_PASSWORD,
      permissions: ['dashboard', 'admins', 'regions', 'counterparties', 'agents', 'points', 'archive', 'warehouse', 'marketplace_clients', 'messages', 'orders', 'kpi_bonuses', 'area_statistics', 'sms', 'finance', 'pricing', 'partnership_requests', 'vacancies', 'settings'],
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
        permissions: existingAdmin.permissions,
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
      permissions: admin.permissions,
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating general admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createGeneralAdmin();



