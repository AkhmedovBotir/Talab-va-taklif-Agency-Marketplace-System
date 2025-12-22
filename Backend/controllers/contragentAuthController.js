const Contragent = require('../models/Contragent');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Step 1: Request phone number for password setup
const passwordSetupStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find contragent by phone
    const contragent = await Contragent.findOne({ phone });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Check if contragent is active
    if (contragent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if password is already set (if password exists and passwordSetupAllowed is false)
    const contragentWithPassword = await Contragent.findOne({ phone }).select('+password');
    if (contragentWithPassword && contragentWithPassword.password && !contragentWithPassword.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol allaqachon o\'rnatilgan',
      });
    }

    // Check if password setup is allowed (if passwordSetupAllowed is false, password is already set)
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
    console.error('Error in password setup step 1:', error);
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

    // Find contragent
    const contragent = await Contragent.findOne({ phone });

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
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
    console.error('Error in password setup step 2:', error);
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

    // Find contragent
    const contragent = await Contragent.findOne({ phone }).select('+password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
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
    console.error('Error in password setup step 3:', error);
    res.status(500).json({
      success: false,
      message: 'Parol o\'rnatishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 3: Login with phone and password
const loginContragent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find contragent with password field included
    const contragent = await Contragent.findOne({ phone }).select('+password');

    if (!contragent) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if contragent is active
    if (contragent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if password is set
    if (!contragent.password) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatilmagan. Iltimos, avval parol o\'rnating',
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

    // Generate JWT token (24 hours)
    const token = jwt.sign(
      {
        id: contragent._id,
        phone: contragent.phone,
        inn: contragent.inn,
        type: 'contragent',
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '24h',
      }
    );

    // Populate regions
    await contragent.populate('viloyat', 'name type code');
    await contragent.populate('tuman', 'name type code');
    await contragent.populate('mfy', 'name type code');

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
          status: contragent.status,
          createdAt: contragent.createdAt,
          updatedAt: contragent.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in contragent:', error);
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
  loginContragent,
};


