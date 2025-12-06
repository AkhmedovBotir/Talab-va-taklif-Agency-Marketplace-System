const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Create new admin
const createAdmin = async (req, res) => {
  try {
    const { name, role, telefonRaqam, username, parol } = req.body;

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

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
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

    res.status(200).json({
      success: true,
      data: admin,
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

    res.status(200).json({
      success: true,
      message: 'Admin muvaffaqiyatli yangilandi',
      data: admin,
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

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      }
    );

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
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
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

