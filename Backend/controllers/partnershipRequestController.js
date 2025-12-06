const PartnershipRequest = require('../models/PartnershipRequest');
const Region = require('../models/Region');
const Contragent = require('../models/Contragent');

// Marketplace: Create partnership request
const createPartnershipRequest = async (req, res) => {
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

    // Check if user already has a pending request
    const existingRequest = await PartnershipRequest.findOne({
      marketplaceUser: req.user.userId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Sizda allaqachon ko\'rib chiqilayotgan hamkorlik so\'rovi mavjud',
      });
    }

    const partnershipRequest = await PartnershipRequest.create({
      marketplaceUser: req.user.userId,
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
    });

    const populatedRequest = await PartnershipRequest.findById(partnershipRequest._id)
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
    console.error('Error creating partnership request:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovini yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Marketplace: Get user's partnership requests
const getMyPartnershipRequests = async (req, res) => {
  try {
    const requests = await PartnershipRequest.find({
      marketplaceUser: req.user.userId,
    })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching partnership requests:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin: Get all partnership requests
const getAllPartnershipRequests = async (req, res) => {
  try {
    const { status, contactStatus, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (contactStatus) {
      filter.contactStatus = contactStatus;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await PartnershipRequest.countDocuments(filter);

    const requests = await PartnershipRequest.find(filter)
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
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
    console.error('Error fetching partnership requests:', error);
    res.status(500).json({
      success: false,
      message: 'Hamkorlik so\'rovlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin: Get partnership request by ID
const getPartnershipRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await PartnershipRequest.findById(id)
      .populate('marketplaceUser', 'firstName lastName phone viloyat tuman mfy')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

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
    console.error('Error fetching partnership request:', error);

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

// Admin: Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactStatus } = req.body;

    const request = await PartnershipRequest.findByIdAndUpdate(
      id,
      { contactStatus },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('marketplaceUser', 'firstName lastName phone')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Aloqa holati muvaffaqiyatli yangilandi',
      data: request,
    });
  } catch (error) {
    console.error('Error updating contact status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri so\'rov ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Aloqa holatini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin: Update request status
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const request = await PartnershipRequest.findByIdAndUpdate(
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
      .populate('mfy', 'name type code');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hamkorlik so\'rovi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'So\'rov holati muvaffaqiyatli yangilandi',
      data: request,
    });
  } catch (error) {
    console.error('Error updating request status:', error);

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

// Admin: Convert approved partnership request to Contragent
const convertPartnershipRequestToContragent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find partnership request
    const request = await PartnershipRequest.findById(id)
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

    // Default password - will be hashed by Contragent pre-save hook
    const defaultPassword = '12345678';

    // Create new contragent based on partnership data
    const contragent = await Contragent.create({
      name: request.companyName,
      inn: request.inn,
      viloyat: request.viloyat,
      tuman: request.tuman,
      mfy: request.mfy,
      phone: request.managerPhone,
      password: defaultPassword,
      // By default: isFeaturedForMarketplace = false, status = 'active'
    });

    // Optionally update partnership request status to approved (if not already)
    if (request.status !== 'approved') {
      request.status = 'approved';
      await request.save();
    }

    res.status(201).json({
      success: true,
      message: 'Hamkor muvaffaqiyatli contragentga aylantirildi',
      data: contragent,
    });
  } catch (error) {
    console.error('Error converting partnership request to contragent:', error);

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
  createPartnershipRequest,
  getMyPartnershipRequests,
  getAllPartnershipRequests,
  getPartnershipRequestById,
  updateContactStatus,
  updateRequestStatus,
  convertPartnershipRequestToContragent,
};




