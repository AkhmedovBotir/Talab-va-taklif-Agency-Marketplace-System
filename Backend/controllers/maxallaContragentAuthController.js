const Contragent = require('../models/Contragent');
const SmsVerification = require('../models/SmsVerification');
const Device = require('../models/Device');
const { extractDeviceInfo } = require('../utils/deviceHelper');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Step 1: Request phone number for password setup
const passwordSetupStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find contragent by phone and check if it's maxalla level
    const contragent = await Contragent.findOne({ phone, contragentLevel: 'mfy' });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragenti topilmadi',
      });
    }

    // Check if contragent is active
    if (contragent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if password is already set
    const contragentWithPassword = await Contragent.findOne({ phone, contragentLevel: 'mfy' }).select('+password');
    if (contragentWithPassword && contragentWithPassword.password && !contragentWithPassword.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol allaqachon o\'rnatilgan',
      });
    }

    // Check if password setup is allowed
    if (!contragent.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Generate and send SMS code
    const code = eskizService.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous codes for this phone and type
    await SmsVerification.updateMany(
      { phone, type: 'contragent_password_setup', isUsed: false },
      { isUsed: true }
    );

    // Save new verification code
    await SmsVerification.create({
      phone,
      code,
      type: 'contragent_password_setup',
      expiresAt,
    });

    // Send SMS
    await eskizService.sendContragentPasswordSetupCode(phone, code);

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi telefon raqamingizga yuborildi',
    });
  } catch (error) {
    console.error('Error in maxalla contragent password setup step 1:', error);
    res.status(500).json({
      success: false,
      message: 'SMS kod yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 2: Verify SMS code (without setting password)
const passwordSetupStep2 = async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Verify SMS code
    const verification = await SmsVerification.findOne({
      phone,
      code,
      type: 'contragent_password_setup',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Kod noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Find contragent and check if it's maxalla level
    const contragent = await Contragent.findOne({ phone, contragentLevel: 'mfy' });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragenti topilmadi',
      });
    }

    // Check if password setup is allowed
    if (!contragent.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Mark code as used (verified)
    verification.isUsed = true;
    await verification.save();

    res.status(200).json({
      success: true,
      message: 'Kod muvaffaqiyatli tasdiqlandi. Endi parol o\'rnatishingiz mumkin',
    });
  } catch (error) {
    console.error('Error in maxalla contragent password setup step 2:', error);
    res.status(500).json({
      success: false,
      message: 'Kod tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 3: Set password after code verification
const passwordSetupStep3 = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    // Find contragent and check if it's maxalla level
    const contragent = await Contragent.findOne({ phone, contragentLevel: 'mfy' }).select('+password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragenti topilmadi',
      });
    }

    // Check if password setup is allowed
    if (!contragent.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Check if a code was verified (recently used code exists)
    const recentVerification = await SmsVerification.findOne({
      phone,
      type: 'contragent_password_setup',
      isUsed: true,
      expiresAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }, // Code was used within last 10 minutes
    }).sort({ updatedAt: -1 });

    if (!recentVerification) {
      return res.status(400).json({
        success: false,
        message: 'Avval SMS kodini tasdiqlashingiz kerak',
      });
    }

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      });
    }

    // Set password and disable passwordSetupAllowed
    contragent.password = newPassword;
    contragent.passwordSetupAllowed = false;
    await contragent.save();

    res.status(200).json({
      success: true,
      message: 'Parol muvaffaqiyatli o\'rnatildi',
    });
  } catch (error) {
    console.error('Error in maxalla contragent password setup step 3:', error);
    res.status(500).json({
      success: false,
      message: 'Parol o\'rnatishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login maxalla contragent
const loginMaxallaContragent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find contragent with password field included - only maxalla level (non-deleted and active)
    const contragent = await Contragent.findOne({
      phone,
      contragentLevel: 'mfy',
      isDeleted: { $ne: true },
      status: 'active',
    }).select('+password');

    if (!contragent) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Compare password
    const isPasswordValid = await contragent.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Extract device information
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
      user: contragent._id,
      userModel: 'Contragent',
      deviceId: deviceInfo.deviceId,
    });

    // If device exists but is inactive, reject login immediately
    if (existingDevice && !existingDevice.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
        requiresDeviceVerification: true,
      });
    }

    // Check if user has any active devices
    const activeDevices = await Device.find({
      user: contragent._id,
      userModel: 'Contragent',
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
        const { device, isNew } = await Device.findOrCreateDevice(contragent, 'Contragent', deviceInfo);
        // Device is already active from findOrCreateDevice
      } else {
        // There are active devices, require device verification
        return res.status(403).json({
          success: false,
          message: 'Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak',
          requiresDeviceVerification: true,
          data: {
            phone: contragent.phone,
            deviceId: deviceInfo.deviceId,
          },
        });
      }
    }

    // Get the device (either existing or newly created) - MUST be active
    const device = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
      deviceId: deviceInfo.deviceId,
      isActive: true,
    });

    // Final check: if device is not found or not active, reject login
    if (!device || !device.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Qurilma topilmadi yoki nofaol. Iltimos, qurilmani tasdiqlang',
        requiresDeviceVerification: true,
      });
    }

    // Generate JWT token (24 hours)
    const token = jwt.sign(
      {
        id: contragent._id,
        phone: contragent.phone,
        inn: contragent.inn,
        type: 'contragent',
        contragentLevel: 'mfy',
        deviceId: device.deviceId,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '24h',
      }
    );

    // Populate regions, activityType, and serviceAreas
    await contragent.populate([
      { path: 'viloyat', select: 'name type code' },
      { path: 'tuman', select: 'name type code' },
      { path: 'mfy', select: 'name type code' },
      { path: 'activityType', select: 'name icon' },
      { path: 'serviceAreas.tuman', select: 'name type code' },
      { path: 'serviceAreas.mfys', select: 'name type code' },
    ]);

    // Ensure workingHours and serviceAreas are always present (even if null/empty)
    const workingHours = contragent.workingHours || { open: null, close: null };
    let serviceAreas = contragent.serviceAreas;
    if (!serviceAreas || !serviceAreas.tuman) {
      serviceAreas = {
        tuman: null,
        mfys: [],
      };
    } else if (!serviceAreas.mfys) {
      serviceAreas.mfys = [];
    }

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        contragent: {
          _id: contragent._id,
          name: contragent.name,
          inn: contragent.inn,
          viloyat: contragent.viloyat,
          tuman: contragent.tuman,
          mfy: contragent.mfy,
          phone: contragent.phone,
          logo: contragent.logo,
          activityType: contragent.activityType,
          contragentLevel: contragent.contragentLevel,
          workingHours: workingHours,
          serviceAreas: serviceAreas,
          status: contragent.status,
          createdAt: contragent.createdAt,
          updatedAt: contragent.updatedAt,
        },
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          isPrimary: device.isPrimary,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in maxalla contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  passwordSetupStep1,
  passwordSetupStep2,
  passwordSetupStep3,
  loginMaxallaContragent,
};
