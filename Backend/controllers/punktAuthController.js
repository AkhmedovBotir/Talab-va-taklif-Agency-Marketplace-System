const Punkt = require('../models/Punkt');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Step 1: Request phone number for password setup
const passwordSetupStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find punkt by phone - only active and non-deleted punkts
    const punkt = await Punkt.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    });

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    // Check if password is already set
    const punktWithPassword = await Punkt.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    }).select('+password');
    
    if (punktWithPassword && punktWithPassword.password && !punktWithPassword.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol allaqachon o\'rnatilgan',
      });
    }

    // Check if password setup is allowed
    if (!punkt.passwordSetupAllowed) {
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
      { phone, type: 'punkt_password_setup', isUsed: false },
      { isUsed: true }
    );

    // Save new verification code
    await SmsVerification.create({
      phone,
      code,
      type: 'punkt_password_setup',
      expiresAt,
    });

    // Send SMS
    await eskizService.sendPunktPasswordSetupCode(phone, code);

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
      type: 'punkt_password_setup',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Kod noto\'g\'ri yoki muddati tugagan',
      });
    }

    const punkt = await Punkt.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    });
    
    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    if (!punkt.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Mark verification as used
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
      message: 'Kodni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Step 3: Set password after code verification
const passwordSetupStep3 = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      });
    }

    const punkt = await Punkt.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    }).select('+password');

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    if (!punkt.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Check if a valid (recently used) verification code exists for this phone
    const recentVerification = await SmsVerification.findOne({
      phone,
      type: 'punkt_password_setup',
      isUsed: true, // Should be marked as used from step 2
      expiresAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }, // Used within last 10 minutes
    }).sort({ createdAt: -1 });

    if (!recentVerification) {
      return res.status(400).json({
        success: false,
        message: 'Avval kodni tasdiqlashingiz kerak yoki kod muddati tugagan',
      });
    }

    // Set password and disable password setup
    punkt.password = newPassword;
    punkt.passwordSetupAllowed = false;
    await punkt.save();

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

// Login punkt (standard login)
const loginPunkt = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find punkt with password
    const punkt = await Punkt.findOne({ phone }).select('+password');

    if (!punkt) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if punkt is active
    if (punkt.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if punkt is deleted
    if (punkt.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz o\'chirilgan',
      });
    }

    // Check if password is set
    if (!punkt.password) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatilmagan. Iltimos, avval parol o\'rnating',
      });
    }

    // Compare password
    const isPasswordValid = await punkt.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: punkt._id.toString(), phone: punkt.phone, role: 'punkt' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Populate regions
    await punkt.populate([
      { path: 'viloyat', select: 'name type code' },
      { path: 'tuman', select: 'name type code' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        punkt: {
          _id: punkt._id,
          name: punkt.name,
          phone: punkt.phone,
          viloyat: punkt.viloyat,
          tuman: punkt.tuman,
          status: punkt.status,
          createdAt: punkt.createdAt,
          updatedAt: punkt.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in punkt:', error);
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
  loginPunkt,
};

