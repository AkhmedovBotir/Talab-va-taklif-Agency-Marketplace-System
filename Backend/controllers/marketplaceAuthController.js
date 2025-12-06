const MarketplaceUser = require('../models/MarketplaceUser');
const SmsVerification = require('../models/SmsVerification');
const Region = require('../models/Region');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'marketplace_user' },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '30d' }
  );
};

// Send SMS code
const sendSMSCode = async (phone, type) => {
  // Generate 5-digit code
  const code = eskizService.generateCode();

  // Set expiration time (5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalidate previous codes for this phone and type
  await SmsVerification.updateMany(
    { phone, type, isUsed: false },
    { isUsed: true }
  );

  // Save new verification code
  await SmsVerification.create({
    phone,
    code,
    type,
    expiresAt,
  });

  // Send SMS based on type
  try {
    if (type === 'register') {
      await eskizService.sendRegistrationCode(phone, code);
    } else if (type === 'login') {
      await eskizService.sendLoginCode(phone, code);
    } else if (type === 'forgot_password') {
      await eskizService.sendForgotPasswordCode(phone, code);
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('SMS yuborishda xatolik yuz berdi');
  }

  return { success: true, message: 'SMS kodi yuborildi' };
};

// Verify SMS code
const verifySMSCode = async (phone, code, type) => {
  const verification = await SmsVerification.findOne({
    phone,
    code,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!verification) {
    return {
      success: false,
      message: 'Kod noto\'g\'ri yoki muddati tugagan',
    };
  }

  // Mark code as used
  verification.isUsed = true;
  await verification.save();

  return { success: true, message: 'Kod tasdiqlandi' };
};

// Register - Step 1: Send SMS code
const registerStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if phone already exists
    const existingUser = await MarketplaceUser.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan',
      });
    }

    // Send SMS code
    await sendSMSCode(phone, 'register');

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi telefon raqamingizga yuborildi',
    });
  } catch (error) {
    console.error('Error in register step 1:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Register - Step 2: Verify code and create user
const registerStep2 = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      gender,
      viloyat,
      tuman,
      mfy,
      birthDate,
      password,
      code,
    } = req.body;

    // Verify SMS code
    const codeVerification = await verifySMSCode(phone, code, 'register');
    if (!codeVerification.success) {
      return res.status(400).json({
        success: false,
        message: codeVerification.message,
      });
    }

    // Check if phone already exists
    const existingUser = await MarketplaceUser.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan',
      });
    }

    // Validate regions
    const viloyatDoc = await Region.findById(viloyat);
    if (!viloyatDoc || viloyatDoc.type !== 'region') {
      return res.status(400).json({
        success: false,
        message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
      });
    }

    const tumanDoc = await Region.findById(tuman);
    if (!tumanDoc || tumanDoc.type !== 'district') {
      return res.status(400).json({
        success: false,
        message: 'Tuman topilmadi yoki noto\'g\'ri tur',
      });
    }

    if (tumanDoc.parent?.toString() !== viloyat.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Tuman tanlangan viloyatga tegishli emas',
      });
    }

    const mfyDoc = await Region.findById(mfy);
    if (!mfyDoc || mfyDoc.type !== 'mfy') {
      return res.status(400).json({
        success: false,
        message: 'MFY topilmadi yoki noto\'g\'ri tur',
      });
    }

    if (mfyDoc.parent?.toString() !== tuman.toString()) {
      return res.status(400).json({
        success: false,
        message: 'MFY tanlangan tumanga tegishli emas',
      });
    }

    // Validate birth date
    const birthDateObj = new Date(birthDate);
    if (isNaN(birthDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Tug\'ilgan sana noto\'g\'ri formatda',
      });
    }

    // Create user
    const user = await MarketplaceUser.create({
      firstName,
      lastName,
      phone,
      gender,
      viloyat,
      tuman,
      mfy,
      birthDate: birthDateObj,
      password,
      isPhoneVerified: true,
    });

    // Populate regions
    await user.populate('viloyat', 'name type code');
    await user.populate('tuman', 'name type code');
    await user.populate('mfy', 'name type code');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Ro\'yxatdan muvaffaqiyatli o\'tdingiz',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          gender: user.gender,
          viloyat: user.viloyat,
          tuman: user.tuman,
          mfy: user.mfy,
          birthDate: user.birthDate,
          isPhoneVerified: user.isPhoneVerified,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error in register step 2:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ro\'yxatdan o\'tishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login - Step 1: Verify phone and password, send SMS code
const loginStep1 = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user with password
    const user = await MarketplaceUser.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Send SMS code
    await sendSMSCode(phone, 'login');

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi telefon raqamingizga yuborildi',
    });
  } catch (error) {
    console.error('Error in login step 1:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login - Step 2: Verify SMS code and return token
const loginStep2 = async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Verify SMS code
    const codeVerification = await verifySMSCode(phone, code, 'login');
    if (!codeVerification.success) {
      return res.status(400).json({
        success: false,
        message: codeVerification.message,
      });
    }

    // Find user
    const user = await MarketplaceUser.findOne({ phone })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          gender: user.gender,
          viloyat: user.viloyat,
          tuman: user.tuman,
          mfy: user.mfy,
          birthDate: user.birthDate,
          isPhoneVerified: user.isPhoneVerified,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error in login step 2:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Forgot Password - Step 1: Send SMS code
const forgotPasswordStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user exists
    const user = await MarketplaceUser.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu telefon raqami bilan foydalanuvchi topilmadi',
      });
    }

    // Send SMS code
    await sendSMSCode(phone, 'forgot_password');

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi telefon raqamingizga yuborildi',
    });
  } catch (error) {
    console.error('Error in forgot password step 1:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Parolni tiklashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Forgot Password - Step 2: Verify code and reset password
const forgotPasswordStep2 = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    // Verify SMS code
    const codeVerification = await verifySMSCode(phone, code, 'forgot_password');
    if (!codeVerification.success) {
      return res.status(400).json({
        success: false,
        message: codeVerification.message,
      });
    }

    // Find user
    const user = await MarketplaceUser.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  } catch (error) {
    console.error('Error in forgot password step 2:', error);
    res.status(500).json({
      success: false,
      message: 'Parolni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Normalize phone number (extract only digits, ensure starts with 998)
const normalizePhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Ensure starts with 998
  if (!digits.startsWith('998')) {
    if (digits.startsWith('8')) {
      digits = '998' + digits.substring(1);
    } else {
      digits = '998' + digits;
    }
  }
  return digits;
};

// Check if phone number exists
const checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami kiritilishi shart',
      });
    }

    // Normalize the phone number for searching
    const normalizedPhone = normalizePhone(phone);
    const phoneWithout998 = normalizedPhone.replace(/^998/, '');
    
    // Search for phone in various formats
    // Try exact match first
    let existingUser = await MarketplaceUser.findOne({ phone: phone.trim() });
    
    // If not found, try normalized version (only digits)
    if (!existingUser) {
      existingUser = await MarketplaceUser.findOne({ 
        phone: { $regex: `^\\+?998?${phoneWithout998}$|^998${phoneWithout998}$|^${normalizedPhone}$`, $options: 'i' } 
      });
    }
    
    // If still not found, get all users and check normalized phones
    if (!existingUser) {
      const allUsers = await MarketplaceUser.find({});
      existingUser = allUsers.find(user => {
        if (!user.phone) return false;
        const userPhoneNormalized = normalizePhone(user.phone);
        return userPhoneNormalized === normalizedPhone || 
               userPhoneNormalized.replace(/^998/, '') === phoneWithout998;
      });
    }

    res.status(200).json({
      success: true,
      status: existingUser ? 'bor' : 'yoq',
      message: existingUser ? 'Bu telefon raqami bazada mavjud' : 'Bu telefon raqami bazada mavjud emas',
    });
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({
      success: false,
      message: 'Telefon raqamni tekshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Resend SMS code
const resendSMSCode = async (req, res) => {
  try {
    const { phone, type } = req.body;

    // Validate type
    if (!['login', 'register', 'forgot_password'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kod turi',
      });
    }

    // For register, check if phone already exists
    if (type === 'register') {
      const existingUser = await MarketplaceUser.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan',
        });
      }
    }

    // For login and forgot_password, check if user exists
    if (type === 'login' || type === 'forgot_password') {
      const user = await MarketplaceUser.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Foydalanuvchi topilmadi',
        });
      }
    }

    // Send SMS code
    await sendSMSCode(phone, type);

    res.status(200).json({
      success: true,
      message: 'Tasdiqlash kodi qayta yuborildi',
    });
  } catch (error) {
    console.error('Error resending SMS code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Kodni qayta yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  registerStep1,
  registerStep2,
  loginStep1,
  loginStep2,
  forgotPasswordStep1,
  forgotPasswordStep2,
  resendSMSCode,
  checkPhoneExists,
};

