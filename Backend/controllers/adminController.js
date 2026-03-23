const Admin = require('../models/Admin');
const Device = require('../models/Device');
const { extractDeviceInfo } = require('../utils/deviceHelper');
const jwt = require('jsonwebtoken');

// Default permissions for admin (must match frontend PERMISSION_MAP / ALL_PERMISSIONS)
const DEFAULT_PERMISSIONS = [
  'dashboard',
  'admins',
  'regions',
  'counterparties',
  'counterparties_types',
  'counterparties_tuman',
  'counterparties_mfy',
  'agents',
  'points',
  'managers',
  'archive',
  'archive_punkts',
  'archive_agents',
  'warehouse',
  'warehouse_categories',
  'warehouse_products',
  'warehouse_maxalla_products',
  'marketplace_clients',
  'messages',
  'orders',
  'kpi_bonuses',
  'kpi_statistics',
  'kpi_transactions',
  'kpi_agents',
  'kpi_punkts',
  'kpi_managers',
  'area_statistics',
  'area_statistics_summary',
  'area_statistics_viloyats',
  'sms',
  'finance',
  'finance_admin_payments',
  'finance_balance',
  'finance_reports',
  'finance_kpi_payments',
  'finance_transactions',
  'finance_statistics',
  'finance_contragent_payments',
  'pricing',
  'pricing_reviews',
  'pricing_contacts',
  'partnership_requests',
  'vacancies',
  'settings',
  'settings_kpi',
  'settings_comment_templates',
  'settings_featured_contragents',
  'settings_devices',
  'certificate_assignment',
];

// Create new admin
const createAdmin = async (req, res) => {
  try {
    const { name, role, telefonRaqam, username, parol, permissions } = req.body;

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Bu foydalanuvchi nomi allaqachon mavjud',
      });
    }

    // Check if phone number already exists
    const existingPhone = await Admin.findOne({ telefonRaqam });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    const admin = await Admin.create({
      name,
      role: role || 'general',
      telefonRaqam,
      username,
      parol,
      status: req.body.status || 'active',
      permissions: permissions || DEFAULT_PERMISSIONS,
    });

    res.status(201).json({
      success: true,
      message: 'Admin muvaffaqiyatli yaratildi',
      data: admin,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Admin yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-parol').sort({ createdAt: -1 });

    // Ensure all admins have permissions
    const adminsWithPermissions = admins.map(admin => {
      const adminObj = admin.toObject();
      if (!adminObj.permissions || adminObj.permissions.length === 0) {
        adminObj.permissions = DEFAULT_PERMISSIONS;
      }
      return adminObj;
    });

    res.status(200).json({
      success: true,
      count: adminsWithPermissions.length,
      data: adminsWithPermissions,
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Adminlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select('-parol');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin topilmadi',
      });
    }

    // Ensure admin has permissions
    const adminObj = admin.toObject();
    if (!adminObj.permissions || adminObj.permissions.length === 0) {
      adminObj.permissions = DEFAULT_PERMISSIONS;
    }

    res.status(200).json({
      success: true,
      data: adminObj,
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri admin ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Adminni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If password is being updated, it will be hashed by the pre-save hook
    // If username or phone is being updated, check for duplicates
    if (updateData.username) {
      const existingUsername = await Admin.findOne({
        username: updateData.username,
        _id: { $ne: id },
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Bu foydalanuvchi nomi allaqachon mavjud',
        });
      }
    }

    if (updateData.telefonRaqam) {
      const existingPhone = await Admin.findOne({
        telefonRaqam: updateData.telefonRaqam,
        _id: { $ne: id },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud',
        });
      }
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-parol');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin topilmadi',
      });
    }

    // Ensure admin has permissions
    const adminObj = admin.toObject();
    if (!adminObj.permissions || adminObj.permissions.length === 0) {
      adminObj.permissions = DEFAULT_PERMISSIONS;
      // Update in database if permissions were missing
      await Admin.findByIdAndUpdate(id, { permissions: DEFAULT_PERMISSIONS });
    }

    res.status(200).json({
      success: true,
      message: 'Admin muvaffaqiyatli yangilandi',
      data: adminObj,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri admin ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Adminni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login admin
const loginAdmin = async (req, res) => {
  try {
    const { username, parol } = req.body;

    // Find admin with password field included
    const admin = await Admin.findOne({ username }).select('+parol');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri',
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(parol);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri',
      });
    }

    // Extract device information (deviceId is required for admin)
    const deviceInfo = extractDeviceInfo(req);

    // Check if deviceId is provided
    if (!deviceInfo.deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    // Check if device exists (active or inactive)
    const existingDevice = await Device.findOne({
      user: admin._id,
      userModel: 'Admin',
      deviceId: deviceInfo.deviceId,
    });

    // If device exists but is inactive, reject login immediately
    if (existingDevice && !existingDevice.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
      });
    }

    // Check if user has any active devices
    const activeDevices = await Device.find({
      user: admin._id,
      userModel: 'Admin',
      isActive: true,
    });

    // If device exists and is active, update and proceed
    if (existingDevice && existingDevice.isActive) {
      existingDevice.lastLoginAt = new Date();
      existingDevice.lastActivityAt = new Date();
      if (deviceInfo.ipAddress) existingDevice.ipAddress = deviceInfo.ipAddress;
      if (deviceInfo.userAgent) existingDevice.userAgent = deviceInfo.userAgent;
      await existingDevice.save();
    } else if (!existingDevice) {
      // Device doesn't exist - check if this is first device or not
      // If no active devices, this is the first device - auto-create and activate
      if (activeDevices.length === 0) {
        const { device, isNew } = await Device.findOrCreateDevice(admin, 'Admin', deviceInfo);
        // Device is already active from findOrCreateDevice
      } else {
        // There are active devices, require device verification
        return res.status(403).json({
          success: false,
          message: 'Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak',
          requiresDeviceVerification: true,
          data: {
            phone: admin.telefonRaqam,
            username: admin.username,
            adminId: admin._id.toString(),
            deviceId: deviceInfo.deviceId,
          },
        });
      }
    }

    // Get the device (either existing or newly created) - MUST be active
    const device = await Device.findOne({
      user: admin._id,
      userModel: 'Admin',
      deviceId: deviceInfo.deviceId,
      isActive: true,
    });

    // Final check: if device is not found or not active, reject login
    if (!device || !device.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Qurilma topilmadi yoki nofaol. Iltimos, qurilmani tasdiqlang',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        deviceId: device.deviceId,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      }
    );

    // Ensure admin has permissions
    let adminPermissions = admin.permissions;
    if (!adminPermissions || adminPermissions.length === 0) {
      adminPermissions = DEFAULT_PERMISSIONS;
      // Update in database if permissions were missing
      admin.permissions = DEFAULT_PERMISSIONS;
      await admin.save();
    }

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        admin: {
          _id: admin._id,
          name: admin.name,
          role: admin.role,
          telefonRaqam: admin.telefonRaqam,
          username: admin.username,
          status: admin.status,
          permissions: adminPermissions,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          isPrimary: device.isPrimary,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri admin ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Adminni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
};

