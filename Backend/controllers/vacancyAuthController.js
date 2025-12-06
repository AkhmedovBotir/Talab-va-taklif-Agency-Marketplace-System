const jwt = require('jsonwebtoken');
const VacancyApplicant = require('../models/VacancyApplicant');
const VacancyApplicantCode = require('../models/VacancyApplicantCode');
const Region = require('../models/Region');
const eskizService = require('../services/eskizService');

const CODE_TTL_MINUTES = 5;

const generateJwt = (applicant) => {
  return jwt.sign(
    {
      id: applicant._id,
      phone: applicant.phone,
      role: 'vacancy_applicant',
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Utility: create or replace code
const upsertCode = async (phone, purpose, code) => {
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await VacancyApplicantCode.deleteMany({ phone, purpose });
  await VacancyApplicantCode.create({ phone, purpose, code, expiresAt });
};

// -------- Utilities for phone existence --------
// GET /register/check?phone=...
const checkPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Telefon raqami majburiy' });
    }
    const exists = await VacancyApplicant.exists({ phone });
    res.status(200).json({ success: true, exists: !!exists });
  } catch (error) {
    console.error('Error checkPhone:', error);
    res.status(500).json({ success: false, message: 'Telefonni tekshirishda xatolik', error: error.message });
  }
};

// -------- Regions list --------
// GET /regions?type=region|district|mfy&parentId=...
const getRegions = async (req, res) => {
  try {
    const { type, parentId } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (parentId) filter.parent = parentId;
    const regions = await Region.find(filter).select('name type code parent');
    res.status(200).json({ success: true, count: regions.length, data: regions });
  } catch (error) {
    console.error('Error getRegions:', error);
    res.status(500).json({ success: false, message: 'Hududlarni olishda xatolik', error: error.message });
  }
};

// -------- Register --------
// Step 1: send SMS code
const sendRegisterCode = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Telefon raqami majburiy' });
    }
    const existing = await VacancyApplicant.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu telefon raqamida allaqachon hisob mavjud' });
    }

    const code = eskizService.generateCode();
    await upsertCode(phone, 'register', code);
    await eskizService.sendRegistrationCode(phone, code);

    res.status(200).json({ success: true, message: 'Tasdiqlash kodi yuborildi' });
  } catch (error) {
    console.error('Error sendRegisterCode:', error);
    res.status(500).json({ success: false, message: 'Kod yuborishda xatolik', error: error.message });
  }
};

// Step 2: register with code + data
const registerApplicant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      gender,
      birthDate,
      viloyat,
      tuman,
      mfy,
      password,
      code,
    } = req.body;

    if (!firstName || !lastName || !phone || !birthDate || !viloyat || !tuman || !mfy || !password || !code) {
      return res.status(400).json({ success: false, message: 'Majburiy maydonlar to\'liq emas' });
    }

    // Verify regions
    const vil = await Region.findById(viloyat);
    const tum = await Region.findById(tuman);
    const mf = await Region.findById(mfy);
    if (!vil || vil.type !== 'region' || !tum || tum.type !== 'district' || !mf || mf.type !== 'mfy') {
      return res.status(400).json({ success: false, message: 'Hudud ma\'lumotlari noto\'g\'ri' });
    }

    // Check code
    const codeDoc = await VacancyApplicantCode.findOne({ phone, purpose: 'register' });
    if (!codeDoc || codeDoc.code !== code || codeDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Tasdiqlash kodi noto\'g\'ri yoki eskirgan' });
    }

    // Remove used code
    await VacancyApplicantCode.deleteMany({ phone, purpose: 'register' });

    // Create applicant
    const applicant = await VacancyApplicant.create({
      firstName,
      lastName,
      phone,
      gender,
      birthDate,
      viloyat,
      tuman,
      mfy,
      password,
    });

    const token = generateJwt(applicant);

    res.status(201).json({
      success: true,
      message: 'Ro\'yxatdan o\'tish muvaffaqiyatli',
      data: {
        token,
        applicant,
      },
    });
  } catch (error) {
    console.error('Error registerApplicant:', error);
    res.status(500).json({ success: false, message: 'Ro\'yxatdan o\'tishda xatolik', error: error.message });
  }
};

// Optional: verify register code without creating account
const verifyRegisterCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Telefon va kod majburiy' });
    }
    const codeDoc = await VacancyApplicantCode.findOne({ phone, purpose: 'register' });
    if (!codeDoc || codeDoc.code !== code || codeDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Tasdiqlash kodi noto\'g\'ri yoki eskirgan' });
    }
    res.status(200).json({ success: true, message: 'Kod tasdiqlandi' });
  } catch (error) {
    console.error('Error verifyRegisterCode:', error);
    res.status(500).json({ success: false, message: 'Kod tekshirishda xatolik', error: error.message });
  }
};

// -------- Login --------
// Step 1: password check + send code
const loginSendCode = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Telefon va parol majburiy' });
    }

    const applicant = await VacancyApplicant.findOne({ phone }).select('+password');
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
    }
    const ok = await applicant.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Parol noto\'g\'ri' });
    }

    const code = eskizService.generateCode();
    await upsertCode(phone, 'login', code);
    await eskizService.sendLoginCode(phone, code);

    res.status(200).json({ success: true, message: 'Tasdiqlash kodi yuborildi' });
  } catch (error) {
    console.error('Error loginSendCode:', error);
    res.status(500).json({ success: false, message: 'Kod yuborishda xatolik', error: error.message });
  }
};

// Step 2: verify code and issue token
const loginVerifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Telefon va kod majburiy' });
    }

    const codeDoc = await VacancyApplicantCode.findOne({ phone, purpose: 'login' });
    if (!codeDoc || codeDoc.code !== code || codeDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Tasdiqlash kodi noto\'g\'ri yoki eskirgan' });
    }

    const applicant = await VacancyApplicant.findOne({ phone });
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
    }

    await VacancyApplicantCode.deleteMany({ phone, purpose: 'login' });

    const token = generateJwt(applicant);
    res.status(200).json({
      success: true,
      message: 'Kirish muvaffaqiyatli',
      data: {
        token,
        applicant,
      },
    });
  } catch (error) {
    console.error('Error loginVerifyCode:', error);
    res.status(500).json({ success: false, message: 'Kirishda xatolik', error: error.message });
  }
};

// -------- Resend code (generic) --------
// Body: { phone, purpose, password? }
const resendCode = async (req, res) => {
  try {
    const { phone, purpose, password } = req.body;
    if (!phone || !purpose) {
      return res.status(400).json({ success: false, message: 'Telefon va purpose majburiy' });
    }
    const allowed = ['register', 'login', 'forgot_password'];
    if (!allowed.includes(purpose)) {
      return res.status(400).json({ success: false, message: 'purpose noto\'g\'ri' });
    }

    // For login, ensure password check
    if (purpose === 'login') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Login uchun parol majburiy' });
      }
      const applicant = await VacancyApplicant.findOne({ phone }).select('+password');
      if (!applicant) {
        return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
      }
      const ok = await applicant.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Parol noto\'g\'ri' });
      }
    } else {
      // register/forgot: just ensure applicant existence rules
      if (purpose === 'register') {
        const exists = await VacancyApplicant.findOne({ phone });
        if (exists) {
          return res.status(400).json({ success: false, message: 'Bu telefon raqamida allaqachon hisob mavjud' });
        }
      } else if (purpose === 'forgot_password') {
        const exists = await VacancyApplicant.findOne({ phone });
        if (!exists) {
          return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
        }
      }
    }

    const code = eskizService.generateCode();
    await upsertCode(phone, purpose, code);
    if (purpose === 'register') await eskizService.sendRegistrationCode(phone, code);
    else if (purpose === 'login') await eskizService.sendLoginCode(phone, code);
    else await eskizService.sendForgotPasswordCode(phone, code);

    res.status(200).json({ success: true, message: 'Kod qayta yuborildi' });
  } catch (error) {
    console.error('Error resendCode:', error);
    res.status(500).json({ success: false, message: 'Kod yuborishda xatolik', error: error.message });
  }
};

// -------- Forgot password --------
// Step 1: send code
const forgotPasswordSendCode = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Telefon majburiy' });
    }
    const applicant = await VacancyApplicant.findOne({ phone });
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
    }

    const code = eskizService.generateCode();
    await upsertCode(phone, 'forgot_password', code);
    await eskizService.sendForgotPasswordCode(phone, code);

    res.status(200).json({ success: true, message: 'Tasdiqlash kodi yuborildi' });
  } catch (error) {
    console.error('Error forgotPasswordSendCode:', error);
    res.status(500).json({ success: false, message: 'Kod yuborishda xatolik', error: error.message });
  }
};

// Step 2: verify code & set new password
const forgotPasswordConfirm = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Telefon, kod va yangi parol majburiy' });
    }

    const codeDoc = await VacancyApplicantCode.findOne({ phone, purpose: 'forgot_password' });
    if (!codeDoc || codeDoc.code !== code || codeDoc.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Tasdiqlash kodi noto\'g\'ri yoki eskirgan' });
    }

    const applicant = await VacancyApplicant.findOne({ phone }).select('+password');
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Hisob topilmadi' });
    }

    applicant.password = newPassword;
    await applicant.save();
    await VacancyApplicantCode.deleteMany({ phone, purpose: 'forgot_password' });

    res.status(200).json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (error) {
    console.error('Error forgotPasswordConfirm:', error);
    res.status(500).json({ success: false, message: 'Parolni tiklashda xatolik', error: error.message });
  }
};

module.exports = {
  checkPhone,
  getRegions,
  sendRegisterCode,
  registerApplicant,
  verifyRegisterCode,
  loginSendCode,
  loginVerifyCode,
  forgotPasswordSendCode,
  forgotPasswordConfirm,
  resendCode,
};


