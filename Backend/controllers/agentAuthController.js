const Agent = require('../models/Agent');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Step 1: Request phone number for password setup
const passwordSetupStep1 = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find agent by phone - only active and non-deleted agents
    const agent = await Agent.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    // Check if password is already set
    const agentWithPassword = await Agent.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    }).select('+password');
    
    if (agentWithPassword && agentWithPassword.password && !agentWithPassword.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol allaqachon o\'rnatilgan',
      });
    }

    // Check if password setup is allowed
    if (!agent.passwordSetupAllowed) {
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
      { phone, type: 'agent_password_setup', isUsed: false },
      { isUsed: true }
    );

    // Save new verification code
    await SmsVerification.create({
      phone,
      code,
      type: 'agent_password_setup',
      expiresAt,
    });

    // Send SMS
    await eskizService.sendAgentPasswordSetupCode(phone, code);

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
      type: 'agent_password_setup',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Kod noto\'g\'ri yoki muddati tugagan',
      });
    }

    const agent = await Agent.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    if (!agent.passwordSetupAllowed) {
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

    const agent = await Agent.findOne({ 
      phone,
      status: 'active',
      isDeleted: { $ne: true }
    }).select('+password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    if (!agent.passwordSetupAllowed) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatish ruxsati berilmagan',
      });
    }

    // Check if a valid (recently used) verification code exists for this phone
    const recentVerification = await SmsVerification.findOne({
      phone,
      type: 'agent_password_setup',
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
    agent.password = newPassword;
    agent.passwordSetupAllowed = false;
    await agent.save();

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

// Login agent (standard login)
const loginAgent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find agent with password
    const agent = await Agent.findOne({ phone }).select('+password');

    if (!agent) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if agent is deleted
    if (agent.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz o\'chirilgan',
      });
    }

    // Check if password is set
    if (!agent.password) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatilmagan. Iltimos, avval parol o\'rnating',
      });
    }

    // Compare password
    const isPasswordValid = await agent.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: agent._id.toString(), phone: agent.phone, type: 'agent' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Populate regions
    await agent.populate('viloyat', 'name type code');
    if (agent.tuman) {
      await agent.populate('tuman', 'name type code');
    }
    if (agent.mfy) {
      await agent.populate('mfy', 'name type code');
    }

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        agent: {
          _id: agent._id,
          name: agent.name,
          phone: agent.phone,
          viloyat: agent.viloyat,
          tuman: agent.tuman,
          mfy: agent.mfy,
          status: agent.status,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in agent:', error);
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
  loginAgent,
};

