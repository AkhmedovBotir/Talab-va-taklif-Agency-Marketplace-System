const Device = require('../models/Device');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const Admin = require('../models/Admin');
const Contragent = require('../models/Contragent');
const Punkt = require('../models/Punkt');
const Agent = require('../models/Agent');

// ==================== DEVICE VERIFICATION ====================

// Step 1: Request device verification code
const requestDeviceVerificationCode = async (req, res) => {
  try {
    const { phone, deviceId, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location, username, adminId } = req.body;
    const { userModel } = req.params; // 'admin', 'contragent', 'punkt', 'agent'

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    // Validate userModel
    const validModels = ['admin', 'contragent', 'punkt', 'agent'];
    if (!validModels.includes(userModel.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri foydalanuvchi turi',
      });
    }

    const modelName = userModel.charAt(0).toUpperCase() + userModel.slice(1).toLowerCase();
    let UserModel;
    let phoneField;
    let user;

    switch (modelName) {
      case 'Admin':
        UserModel = Admin;
        phoneField = 'telefonRaqam';
        // Admin uchun username yoki adminId orqali topish
        if (username) {
          user = await UserModel.findOne({ username });
        } else if (adminId) {
          user = await UserModel.findById(adminId);
        } else if (phone) {
          user = await UserModel.findOne({ [phoneField]: phone });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Admin uchun username, adminId yoki telefon raqami kiritilishi shart',
          });
        }
        break;
      case 'Contragent':
        UserModel = Contragent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Punkt':
        UserModel = Punkt;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Agent':
        UserModel = Agent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri foydalanuvchi turi',
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi yoki faol emas',
      });
    }

    // Get phone number from user (for Admin, get from user object)
    const userPhone = modelName === 'Admin' ? user.telefonRaqam : phone;

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi telefon raqami topilmadi',
      });
    }

    // Check if device is already registered and active
    const existingDevice = await Device.findOne({
      user: user._id,
      userModel: modelName,
      deviceId,
      isActive: true,
    });

    if (existingDevice) {
      return res.status(200).json({
        success: true,
        message: 'Qurilma allaqachon tasdiqlangan',
        data: {
          deviceId: existingDevice.deviceId,
          isVerified: true,
        },
      });
    }

    // Check if SMS was sent recently (within last 30 seconds) to prevent duplicate SMS
    const recentSMS = await SmsVerification.findOne({
      phone: userPhone,
      deviceId,
      type: 'device_verification',
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) }, // Last 30 seconds
    }).sort({ createdAt: -1 });

    if (recentSMS && !recentSMS.isUsed) {
      // SMS was sent recently, return existing code info without sending new SMS
      return res.status(200).json({
        success: true,
        message: 'Tasdiqlash kodi yaqinda yuborilgan. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring',
        data: {
          phone: userPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4'), // Masked phone
          expiresAt: recentSMS.expiresAt,
          canResendAfter: new Date(recentSMS.createdAt.getTime() + 30 * 1000),
        },
      });
    }

    // Generate verification code
    const code = eskizService.generateCode();

    // Set expiration (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Delete old unused codes for this phone and device
    await SmsVerification.deleteMany({
      phone: userPhone,
      deviceId,
      type: 'device_verification',
      isUsed: false,
    });

    // Create new verification code
    const smsVerification = await SmsVerification.create({
      phone: userPhone,
      code,
      type: 'device_verification',
      deviceId,
      userModel: modelName,
      expiresAt,
    });

    // Send SMS (only once)
    try {
      await eskizService.sendDeviceVerificationCode(userPhone, code);
    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
      // Don't fail the request if SMS fails, but log it
    }

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi yuborildi',
      data: {
        phone: userPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4'), // Masked phone
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error requesting device verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Tasdiqlash kodini yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 2: Verify device with code
const verifyDevice = async (req, res) => {
  try {
    const { phone, deviceId, code, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location, username, adminId } = req.body;
    const { userModel } = req.params;

    if (!deviceId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID va kod kiritilishi shart',
      });
    }

    // Validate userModel
    const validModels = ['admin', 'contragent', 'punkt', 'agent'];
    if (!validModels.includes(userModel.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri foydalanuvchi turi',
      });
    }

    const modelName = userModel.charAt(0).toUpperCase() + userModel.slice(1).toLowerCase();
    let UserModel;
    let phoneField;
    let user;

    switch (modelName) {
      case 'Admin':
        UserModel = Admin;
        phoneField = 'telefonRaqam';
        // Admin uchun username yoki adminId orqali topish
        if (username) {
          user = await UserModel.findOne({ username });
        } else if (adminId) {
          user = await UserModel.findById(adminId);
        } else if (phone) {
          user = await UserModel.findOne({ [phoneField]: phone });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Admin uchun username, adminId yoki telefon raqami kiritilishi shart',
          });
        }
        break;
      case 'Contragent':
        UserModel = Contragent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Punkt':
        UserModel = Punkt;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Agent':
        UserModel = Agent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri foydalanuvchi turi',
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Get phone number from user (for Admin, get from user object)
    const userPhone = modelName === 'Admin' ? user.telefonRaqam : phone;

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi telefon raqami topilmadi',
      });
    }

    // Verify code
    const smsVerification = await SmsVerification.findOne({
      phone: userPhone,
      deviceId,
      code,
      type: 'device_verification',
      userModel: modelName,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!smsVerification) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kod yoki kod muddati tugagan',
      });
    }

    // Mark code as used
    smsVerification.isUsed = true;
    await smsVerification.save();

    // Check if user has any active devices
    const activeDevices = await Device.getUserActiveDevices(user, modelName);

    // If user has active devices, deactivate them (only one device allowed)
    if (activeDevices.length > 0) {
      await Device.deactivateAllExcept(user, modelName, deviceId);
    }

    // Check if device already exists (inactive)
    let device = await Device.findOne({
      user: user._id,
      userModel: modelName,
      deviceId,
    });

    let isNew = false;

    if (device) {
      // Reactivate existing device
      device.isActive = true;
      device.isPrimary = activeDevices.length === 0;
      device.lastLoginAt = new Date();
      device.lastActivityAt = new Date();
      if (deviceName) device.deviceName = deviceName;
      if (deviceType) device.deviceType = deviceType;
      if (platform) device.platform = platform;
      if (os) device.os = os;
      if (browser) device.browser = browser;
      if (ipAddress) device.ipAddress = ipAddress;
      if (userAgent) device.userAgent = userAgent;
      if (location) device.location = location;
      await device.save();
    } else {
      // Create new device
      const deviceData = {
        deviceId,
        deviceName,
        deviceType,
        platform,
        os,
        browser,
        ipAddress,
        userAgent,
        location,
      };

      const result = await Device.findOrCreateDevice(user, modelName, deviceData);
      device = result.device;
      isNew = result.isNew;

      // If this is the first device, make it primary
      if (isNew && activeDevices.length === 0) {
        device.isPrimary = true;
        await device.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Qurilma muvaffaqiyatli tasdiqlandi',
      data: {
        device: {
          _id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          isPrimary: device.isPrimary,
          lastLoginAt: device.lastLoginAt,
        },
        isNew,
      },
    });
  } catch (error) {
    console.error('Error verifying device:', error);
    res.status(500).json({
      success: false,
      message: 'Qurilmani tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Resend verification code
const resendDeviceVerificationCode = async (req, res) => {
  try {
    const { phone, deviceId, username, adminId } = req.body;
    const { userModel } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    // Validate userModel
    const validModels = ['admin', 'contragent', 'punkt', 'agent'];
    if (!validModels.includes(userModel.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri foydalanuvchi turi',
      });
    }

    const modelName = userModel.charAt(0).toUpperCase() + userModel.slice(1).toLowerCase();
    let UserModel;
    let phoneField;
    let user;

    switch (modelName) {
      case 'Admin':
        UserModel = Admin;
        phoneField = 'telefonRaqam';
        // Admin uchun username yoki adminId orqali topish
        if (username) {
          user = await UserModel.findOne({ username });
        } else if (adminId) {
          user = await UserModel.findById(adminId);
        } else if (phone) {
          user = await UserModel.findOne({ [phoneField]: phone });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Admin uchun username, adminId yoki telefon raqami kiritilishi shart',
          });
        }
        break;
      case 'Contragent':
        UserModel = Contragent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Punkt':
        UserModel = Punkt;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      case 'Agent':
        UserModel = Agent;
        phoneField = 'phone';
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'Telefon raqami kiritilishi shart',
          });
        }
        user = await UserModel.findOne({
          [phoneField]: phone,
          status: 'active',
          isDeleted: { $ne: true },
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri foydalanuvchi turi',
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Get phone number from user (for Admin, get from user object)
    const userPhone = modelName === 'Admin' ? user.telefonRaqam : phone;

    if (!userPhone) {
      return res.status(400).json({
        success: false,
        message: 'Foydalanuvchi telefon raqami topilmadi',
      });
    }

    // Check if device is already verified
    const existingDevice = await Device.findOne({
      user: user._id,
      userModel: modelName,
      deviceId,
      isActive: true,
    });

    if (existingDevice) {
      return res.status(200).json({
        success: true,
        message: 'Qurilma allaqachon tasdiqlangan',
        data: {
          deviceId: existingDevice.deviceId,
          isVerified: true,
        },
      });
    }

    // Check if SMS was sent recently (within last 30 seconds) to prevent duplicate SMS
    const recentSMS = await SmsVerification.findOne({
      phone: userPhone,
      deviceId,
      type: 'device_verification',
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) }, // Last 30 seconds
    }).sort({ createdAt: -1 });

    if (recentSMS && !recentSMS.isUsed) {
      // SMS was sent recently, return existing code info without sending new SMS
      return res.status(200).json({
        success: true,
        message: 'Tasdiqlash kodi yaqinda yuborilgan. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring',
        data: {
          phone: userPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4'), // Masked phone
          expiresAt: recentSMS.expiresAt,
          canResendAfter: new Date(recentSMS.createdAt.getTime() + 30 * 1000),
        },
      });
    }

    // Generate new code
    const code = eskizService.generateCode();

    // Set expiration (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Delete old unused codes
    await SmsVerification.deleteMany({
      phone: userPhone,
      deviceId,
      type: 'device_verification',
      isUsed: false,
    });

    // Create new verification code
    const smsVerification = await SmsVerification.create({
      phone: userPhone,
      code,
      type: 'device_verification',
      deviceId,
      userModel: modelName,
      expiresAt,
    });

    // Send SMS (only once)
    try {
      await eskizService.sendDeviceVerificationCode(userPhone, code);
    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
      return res.status(500).json({
        success: false,
        message: 'SMS yuborishda xatolik yuz berdi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi qayta yuborildi',
      data: {
        phone: userPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4'), // Masked phone
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error resending device verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Tasdiqlash kodini qayta yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  requestDeviceVerificationCode,
  verifyDevice,
  resendDeviceVerificationCode,
};

