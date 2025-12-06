const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Authentication middleware for admin
const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.id).select('-parol');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin topilmadi',
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Attach admin info to request
    req.user = {
      userId: admin._id,
      userType: 'Admin',
      role: admin.role,
      username: admin.username,
      admin,
    };

    next();
  } catch (error) {
    console.error('Error in adminAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

// Authentication middleware for contragent
const contragentAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if token is for contragent
    if (decoded.type !== 'contragent') {
      return res.status(403).json({
        success: false,
        message: 'Bu token contragent uchun emas',
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.id,
      userType: 'Contragent',
      phone: decoded.phone,
      inn: decoded.inn,
    };

    next();
  } catch (error) {
    console.error('Error in contragentAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

// Authentication middleware for marketplace user
const marketplaceUserAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if token is for marketplace user
    if (decoded.type !== 'marketplace_user') {
      return res.status(403).json({
        success: false,
        message: 'Bu token marketplace user uchun emas',
      });
    }

    const MarketplaceUser = require('../models/MarketplaceUser');
    const user = await MarketplaceUser.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
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

    // Attach user info to request
    req.user = {
      userId: user._id,
      userType: 'MarketplaceUser',
      phone: user.phone,
    };

    next();
  } catch (error) {
    console.error('Error in marketplaceUserAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

// Authentication middleware for punkt
const punktAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if token is for punkt
    if (decoded.type !== 'punkt') {
      return res.status(403).json({
        success: false,
        message: 'Bu token punkt uchun emas',
      });
    }

    const Punkt = require('../models/Punkt');
    const punkt = await Punkt.findById(decoded.id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .select('-password');
    
    if (!punkt) {
      return res.status(401).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    if (punkt.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Attach punkt info to request
    req.user = {
      userId: punkt._id,
      userType: 'Punkt',
      phone: punkt.phone,
      viloyat: punkt.viloyat,
      tuman: punkt.tuman,
      punkt: punkt,
    };

    next();
  } catch (error) {
    console.error('Error in punktAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

// Authentication middleware for agent
const agentAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if token is for agent
    if (decoded.type !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Bu token agent uchun emas',
      });
    }

    const Agent = require('../models/Agent');
    const agent = await Agent.findById(decoded.id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');
    
    if (!agent) {
      return res.status(401).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    if (agent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Determine agent type
    const agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

    // Attach agent info to request
    req.user = {
      userId: agent._id,
      userType: 'Agent',
      phone: agent.phone,
      role: agentType, // role field
      viloyat: agent.viloyat,
      tuman: agent.tuman,
      mfy: agent.mfy,
      agent: agent,
    };

    next();
  } catch (error) {
    console.error('Error in agentAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

// Authentication middleware for vacancy applicant
const vacancyApplicantAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token topilmadi',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati tugagan',
      });
    }

    // Check if token is for vacancy applicant
    if (decoded.role !== 'vacancy_applicant') {
      return res.status(403).json({
        success: false,
        message: 'Bu token vakansiya nomzodi uchun emas',
      });
    }

    const VacancyApplicant = require('../models/VacancyApplicant');
    const applicant = await VacancyApplicant.findById(decoded.id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');
    
    if (!applicant) {
      return res.status(401).json({
        success: false,
        message: 'Nomzod topilmadi',
      });
    }

    if (applicant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Attach applicant info to request
    req.user = {
      userId: applicant._id,
      userType: 'VacancyApplicant',
      phone: applicant.phone,
      applicant: applicant,
    };

    next();
  } catch (error) {
    console.error('Error in vacancyApplicantAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Autentifikatsiya xatosi',
      error: error.message,
    });
  }
};

module.exports = {
  adminAuth,
  contragentAuth,
  marketplaceUserAuth,
  punktAuth,
  agentAuth,
  vacancyApplicantAuth,
};


