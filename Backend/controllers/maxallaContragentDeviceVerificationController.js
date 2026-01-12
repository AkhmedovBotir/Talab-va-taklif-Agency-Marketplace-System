const Device = require('../models/Device');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const Contragent = require('../models/Contragent');

// ==================== MAXALLA CONTRAGENT DEVICE VERIFICATION ====================

// Step 1: Request device verification code for Maxalla Contragent
const requestDeviceVerificationCode = async (req, res) => {
  try {
    const { phone, deviceId, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami kiritilishi shart',
      });
    }

    // Find maxalla contragent only
    const contragent = await Contragent.findOne({
      phone,
      contragentLevel: 'mfy',
      status: 'active',
      isDeleted: { $ne: true },
    });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragent topilmadi yoki faol emas',
      });
    }

    // Check if device is already registered and active
    const existingDevice = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
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
      phone,
      deviceId,
      type: 'device_verification',
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) }, // Last 30 seconds
    }).sort({ createdAt: -1 });

    if (recentSMS && !recentSMS.isUsed) {
      return res.status(429).json({
        success: false,
        message: 'SMS kod yaqinda yuborilgan. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring',
      });
    }

    // Generate verification code
    const code = eskizService.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused codes for this phone and device
    await SmsVerification.updateMany(
      { phone, deviceId, type: 'device_verification', isUsed: false },
      { isUsed: true }
    );

    // Save verification code
    await SmsVerification.create({
      phone,
      code,
      type: 'device_verification',
      deviceId,
      expiresAt,
    });

    // Send SMS
    await eskizService.sendDeviceVerificationCode(phone, code);

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi telefon raqamingizga yuborildi',
      data: {
        phone,
        deviceId,
        expiresIn: 600, // 10 minutes in seconds
      },
    });
  } catch (error) {
    console.error('Error requesting maxalla contragent device verification code:', error);
    res.status(500).json({
      success: false,
      message: 'SMS kod yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 2: Verify device with code for Maxalla Contragent
const verifyDevice = async (req, res) => {
  try {
    const { phone, deviceId, code, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location } = req.body;

    if (!deviceId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID va kod kiritilishi shart',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami kiritilishi shart',
      });
    }

    // Find maxalla contragent only
    const contragent = await Contragent.findOne({
      phone,
      contragentLevel: 'mfy',
      status: 'active',
      isDeleted: { $ne: true },
    });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragent topilmadi yoki faol emas',
      });
    }

    // Verify SMS code
    const verification = await SmsVerification.findOne({
      phone,
      deviceId,
      code,
      type: 'device_verification',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Kod noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Mark code as used
    verification.isUsed = true;
    await verification.save();

    // Check if device already exists
    let device = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
      deviceId,
    });

    if (device) {
      // Update existing device
      device.isActive = true;
      device.deviceName = deviceName || device.deviceName;
      device.deviceType = deviceType || device.deviceType;
      device.platform = platform || device.platform;
      device.os = os || device.os;
      device.browser = browser || device.browser;
      device.ipAddress = ipAddress || device.ipAddress;
      device.userAgent = userAgent || device.userAgent;
      device.location = location || device.location;
      device.verifiedAt = new Date();
      device.lastActivityAt = new Date();
      await device.save();
    } else {
      // Create new device
      const deviceData = {
        user: contragent._id,
        userModel: 'Contragent',
        deviceId,
        deviceName: deviceName || 'Unknown Device',
        deviceType: deviceType || 'unknown',
        platform: platform || 'unknown',
        os: os || 'unknown',
        browser: browser || 'unknown',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        location: location || null,
        isActive: true,
        verifiedAt: new Date(),
        lastActivityAt: new Date(),
      };

      // Check if this is the first device for this user
      const activeDeviceCount = await Device.countDocuments({
        user: contragent._id,
        userModel: 'Contragent',
        isActive: true,
      });

      if (activeDeviceCount === 0) {
        deviceData.isPrimary = true;
      }

      device = await Device.create(deviceData);
    }

    res.status(200).json({
      success: true,
      message: 'Qurilma muvaffaqiyatli tasdiqlandi',
      data: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        isPrimary: device.isPrimary,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('Error verifying maxalla contragent device:', error);
    res.status(500).json({
      success: false,
      message: 'Qurilma tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Resend device verification code for Maxalla Contragent
const resendDeviceVerificationCode = async (req, res) => {
  try {
    const { phone, deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami kiritilishi shart',
      });
    }

    // Find maxalla contragent only
    const contragent = await Contragent.findOne({
      phone,
      contragentLevel: 'mfy',
      status: 'active',
      isDeleted: { $ne: true },
    });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragent topilmadi yoki faol emas',
      });
    }

    // Check if device is already verified
    const existingDevice = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
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

    // Check if SMS was sent recently (within last 30 seconds)
    const recentSMS = await SmsVerification.findOne({
      phone,
      deviceId,
      type: 'device_verification',
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentSMS && !recentSMS.isUsed) {
      return res.status(429).json({
        success: false,
        message: 'SMS kod yaqinda yuborilgan. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring',
      });
    }

    // Generate new verification code
    const code = eskizService.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused codes
    await SmsVerification.updateMany(
      { phone, deviceId, type: 'device_verification', isUsed: false },
      { isUsed: true }
    );

    // Save new verification code
    await SmsVerification.create({
      phone,
      code,
      type: 'device_verification',
      deviceId,
      expiresAt,
    });

    // Send SMS
    await eskizService.sendDeviceVerificationCode(phone, code);

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi qayta yuborildi',
      data: {
        phone,
        deviceId,
        expiresIn: 600, // 10 minutes in seconds
      },
    });
  } catch (error) {
    console.error('Error resending maxalla contragent device verification code:', error);
    res.status(500).json({
      success: false,
      message: 'SMS kod yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  requestDeviceVerificationCode,
  verifyDevice,
  resendDeviceVerificationCode,
};
