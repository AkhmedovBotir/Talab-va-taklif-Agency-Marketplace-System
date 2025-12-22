const MarketplacePartnershipRequest = require('../models/MarketplacePartnershipRequest');
const Region = require('../models/Region');
const Contragent = require('../models/Contragent');

// ==================== MARKETPLACE USER ENDPOINTS ====================

// Create partnership request (Marketplace User)
const createMarketplacePartnershipRequest = async (req, res) => {
  try {
    const {
      companyName,
      inn,
      mfo,
      accountNumber,
      viloyat,
      tuman,
      mfy,
      activity,
      managerFirstName,
      managerLastName,
      managerPhone,
    } = req.body;

    const userId = req.user.userId;

    // Validate that regions exist and have correct types
    const viloyatRegion = await Region.findById(viloyat);
    if (!viloyatRegion || viloyatRegion.type !== 'region') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri viloyat tanlandi',
      });
    }

    const tumanRegion = await Region.findById(tuman);
    if (!tumanRegion || tumanRegion.type !== 'district') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri tuman tanlandi',
      });
    }

    const mfyRegion = await Region.findById(mfy);
    if (!mfyRegion || mfyRegion.type !== 'mfy') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri MFY tanlandi',
      });
    }

    // Check if user already has a pending or reviewing request
    const existingRequest = await MarketplacePartnershipRequest.findOne({
      marketplaceUser: userId,
      status: { $in: ['pending', 'reviewing'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Sizda allaqachon ko\'rib chiqilayotgan hamkorlik so\'rovi mavjud',
      });
    }

    const partnershipRequest = await MarketplacePartnershipRequest.create({
      marketplaceUser: userId,
      companyName,
      inn,
      mfo,
      accountNumber,
      viloyat,
      tuman,
      mfy,
      activity,
      managerFirstName,
      managerLastName,
      managerPhone,
      status: 'pending',
    });

    const populatedRequest = await MarketplacePartnershipRequest.findById(partnershipRequest._id)
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    res.status(201).json({
      success: true,
      message: 'Hamkorlik so\'rovi muvaffaqiyatli yuborildi',
      data: populatedRequest,
    });
  } catch (error) {
    console.error('Error creating marketplace partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovini yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get user's partnership requests (Marketplace User)
const getMyMarketplacePartnershipRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const filter = { marketplaceUser: userId };

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await MarketplacePartnershipRequest.countDocuments(filter);

    const requests = await MarketplacePartnershipRequest.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching marketplace partnership requests:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get partnership request by ID (Marketplace User - only own requests)
const getMyMarketplacePartnershipRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const request = await MarketplacePartnershipRequest.findOne({
      _id: id,
      marketplaceUser: userId,
    })
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching marketplace partnership request:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Get all marketplace partnership requests (Admin)
const getAllMarketplacePartnershipRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await MarketplacePartnershipRequest.countDocuments(filter);

    const requests = await MarketplacePartnershipRequest.find(filter)
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching marketplace partnership requests:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get marketplace partnership request by ID (Admin)
const getMarketplacePartnershipRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await MarketplacePartnershipRequest.findById(id)
      .populate('marketplaceUser', 'firstName lastName phone viloyat tuman mfy')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching marketplace partnership request:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update status to reviewing (Admin)
const updateStatusToReviewing = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const request = await MarketplacePartnershipRequest.findByIdAndUpdate(
      id,
      {
        status: 'reviewing',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'So\'rov ko\'rib chiqilmoqda deb belgilandi',
      data: request,
    });
  } catch (error) {
    console.error('Error updating status to reviewing:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'So\'rov holatini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update status to contacted (Admin)
const updateStatusToContacted = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const updateData = {
      status: 'contacted',
      contactedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const request = await MarketplacePartnershipRequest.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'So\'rov gaplashilgan deb belgilandi',
      data: request,
    });
  } catch (error) {
    console.error('Error updating status to contacted:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'So\'rov holatini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Approve partnership request (Admin)
const approveMarketplacePartnershipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const updateData = {
      status: 'approved',
      approvedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const request = await MarketplacePartnershipRequest.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hamkorlik so\'rovi tasdiqlandi',
      data: request,
    });
  } catch (error) {
    console.error('Error approving marketplace partnership request:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'So\'rovni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Reject partnership request (Admin)
const rejectMarketplacePartnershipRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes || adminNotes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rad etish sababi (adminNotes) kiritilishi shart',
      });
    }

    const updateData = {
      status: 'rejected',
      rejectedAt: new Date(),
      adminNotes: adminNotes.trim(),
    };

    const request = await MarketplacePartnershipRequest.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('reviewedBy', 'firstName lastName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hamkorlik so\'rovi rad etildi',
      data: request,
    });
  } catch (error) {
    console.error('Error rejecting marketplace partnership request:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'So\'rovni rad etishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Convert approved partnership request to Contragent (Admin)
const convertMarketplacePartnershipRequestToContragent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find partnership request
    const request = await MarketplacePartnershipRequest.findById(id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    // Only approved requests can be converted
    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Faqat tasdiqlangan (approved) hamkorlik so\'rovlari contragentga aylantirilishi mumkin',
      });
    }

    // Check if contragent with this INN already exists
    const existingByInn = await Contragent.findOne({ inn: request.inn });
    if (existingByInn) {
      return res.status(400).json({
        success: false,
        message: 'Ushbu INN bilan contragent allaqachon mavjud',
      });
    }

    // Check if contragent with this phone already exists
    const existingByPhone = await Contragent.findOne({ phone: request.managerPhone });
    if (existingByPhone) {
      return res.status(400).json({
        success: false,
        message: 'Ushbu telefon raqami bilan contragent allaqachon mavjud',
      });
    }

    // Create new contragent without password (passwordSetupAllowed = true)
    const contragent = await Contragent.create({
      name: request.companyName,
      inn: request.inn,
      viloyat: request.viloyat,
      tuman: request.tuman,
      mfy: request.mfy,
      phone: request.managerPhone,
      passwordSetupAllowed: true,
    });

    res.status(201).json({
      success: true,
      message: 'Hamkor muvaffaqiyatli contragentga aylantirildi. Parol o\'rnatish uchun telefon raqam orqali kirish kerak.',
      data: {
        contragent: {
          _id: contragent._id,
          name: contragent.name,
          inn: contragent.inn,
          phone: contragent.phone,
          passwordSetupAllowed: contragent.passwordSetupAllowed,
        },
      },
    });
  } catch (error) {
    console.error('Error converting marketplace partnership request to contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Hamkorni contragentga aylantirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  // Marketplace User
  createMarketplacePartnershipRequest,
  getMyMarketplacePartnershipRequests,
  getMyMarketplacePartnershipRequestById,
  // Admin
  getAllMarketplacePartnershipRequests,
  getMarketplacePartnershipRequestById,
  updateStatusToReviewing,
  updateStatusToContacted,
  approveMarketplacePartnershipRequest,
  rejectMarketplacePartnershipRequest,
  convertMarketplacePartnershipRequestToContragent,
};

