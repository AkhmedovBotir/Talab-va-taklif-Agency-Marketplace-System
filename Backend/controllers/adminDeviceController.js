const Device = require('../models/Device');
const Admin = require('../models/Admin');
const Contragent = require('../models/Contragent');
const Punkt = require('../models/Punkt');
const Agent = require('../models/Agent');

// ==================== ADMIN DEVICE MANAGEMENT ====================

// Get all devices (Admin)
const getAllDevices = async (req, res) => {
  try {
    const { userModel, userId, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (userModel) {
      const validModels = ['Admin', 'Contragent', 'Punkt', 'Agent'];
      if (!validModels.includes(userModel)) {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri foydalanuvchi modeli',
        });
      }
      filter.userModel = userModel;
    }

    if (userId) {
      filter.user = userId;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Device.countDocuments(filter);

    const devices = await Device.find(filter)
      .populate('user')
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: devices.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: devices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Qurilmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get device by ID (Admin)
const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id).populate('user');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Qurilma topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Qurilmani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get user's devices (Admin)
const getUserDevices = async (req, res) => {
  try {
    const { userId, userModel } = req.params;

    if (!userId || !userModel) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi ID va modeli kiritilishi shart',
      });
    }

    const validModels = ['Admin', 'Contragent', 'Punkt', 'Agent'];
    if (!validModels.includes(userModel)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri foydalanuvchi modeli',
      });
    }

    const devices = await Device.find({
      user: userId,
      userModel,
    })
      .sort({ lastActivityAt: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchi qurilmalarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Deactivate device (Admin)
const deactivateDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Qurilma topilmadi',
      });
    }

    device.isActive = false;
    device.lastActivityAt = new Date();
    await device.save();

    res.status(200).json({
      success: true,
      message: 'Qurilma muvaffaqiyatli deaktivatsiya qilindi',
      data: device,
    });
  } catch (error) {
    console.error('Error deactivating device:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Qurilmani deaktivatsiya qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Activate device (Admin)
const activateDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Qurilma topilmadi',
      });
    }

    // Deactivate all other devices for this user
    await Device.deactivateAllExcept(device.user, device.userModel, device.deviceId);

    device.isActive = true;
    device.lastLoginAt = new Date();
    device.lastActivityAt = new Date();
    await device.save();

    res.status(200).json({
      success: true,
      message: 'Qurilma muvaffaqiyatli aktivatsiya qilindi',
      data: device,
    });
  } catch (error) {
    console.error('Error activating device:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Qurilmani aktivatsiya qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete device (Admin)
const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Qurilma topilmadi',
      });
    }

    await Device.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Qurilma muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Qurilmani o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get device statistics (Admin)
const getDeviceStatistics = async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ isActive: true });
    const inactiveDevices = await Device.countDocuments({ isActive: false });

    const byUserModel = await Device.aggregate([
      {
        $group: {
          _id: '$userModel',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
        },
      },
    ]);

    const byDeviceType = await Device.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalDevices,
        active: activeDevices,
        inactive: inactiveDevices,
        byUserModel,
        byDeviceType,
      },
    });
  } catch (error) {
    console.error('Error fetching device statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Qurilma statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  getUserDevices,
  deactivateDevice,
  activateDevice,
  deleteDevice,
  getDeviceStatistics,
};


