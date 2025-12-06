const ReviewContact = require('../models/ReviewContact');
const Review = require('../models/Review');

// Get all contacts (Admin only)
const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, isPositive } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isPositive !== undefined) query.isPositive = isPositive === 'true';

    const contacts = await ReviewContact.find(query)
      .populate({
        path: 'review',
        populate: [
          { path: 'order', select: 'orderNumber' },
          { path: 'product', select: 'name images' },
          { path: 'user', select: 'firstName lastName phone' },
        ],
      })
      .populate('resolvedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ReviewContact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Aloqalarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get positive contacts (Admin only)
const getPositiveContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { isPositive: true };
    if (status) query.status = status;

    const contacts = await ReviewContact.find(query)
      .populate({
        path: 'review',
        populate: [
          { path: 'order', select: 'orderNumber' },
          { path: 'product', select: 'name images' },
          { path: 'user', select: 'firstName lastName phone' },
        ],
      })
      .populate('resolvedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ReviewContact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get positive contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Ijobiy aloqalarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get negative contacts (Admin only)
const getNegativeContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { isPositive: false };
    if (status) query.status = status;

    const contacts = await ReviewContact.find(query)
      .populate({
        path: 'review',
        populate: [
          { path: 'order', select: 'orderNumber' },
          { path: 'product', select: 'name images' },
          { path: 'user', select: 'firstName lastName phone' },
        ],
      })
      .populate('resolvedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ReviewContact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get negative contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Salbiy aloqalarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get contact by ID
const getContactById = async (req, res) => {
  try {
    const contact = await ReviewContact.findById(req.params.id)
      .populate({
        path: 'review',
        populate: [
          { path: 'order', select: 'orderNumber' },
          { path: 'product', select: 'name images' },
          { path: 'user', select: 'firstName lastName phone' },
        ],
      })
      .populate('resolvedBy', 'name username');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Aloqa topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Aloqani olishda xatolik',
      error: error.message,
    });
  }
};

// Update contact status (Admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const adminId = req.user.userId;

    const contact = await ReviewContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Aloqa topilmadi',
      });
    }

    contact.status = status || contact.status;
    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }

    if (status === 'resolved') {
      contact.resolvedAt = new Date();
      contact.resolvedBy = adminId;
    }

    await contact.save();

    await contact.populate({
      path: 'review',
      populate: [
        { path: 'order', select: 'orderNumber' },
        { path: 'product', select: 'name images' },
        { path: 'user', select: 'firstName lastName phone' },
      ],
    });
    await contact.populate('resolvedBy', 'name username');

    res.status(200).json({
      success: true,
      message: 'Aloqa holati yangilandi',
      data: contact,
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Aloqa holatini yangilashda xatolik',
      error: error.message,
    });
  }
};

// Get contact statistics (Admin only)
const getContactStatistics = async (req, res) => {
  try {
    const stats = await ReviewContact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          positive: {
            $sum: { $cond: ['$isPositive', 1, 0] },
          },
          negative: {
            $sum: { $cond: [{ $eq: ['$isPositive', false] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      positive: 0,
      negative: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get contact statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik',
      error: error.message,
    });
  }
};

module.exports = {
  getAllContacts,
  getPositiveContacts,
  getNegativeContacts,
  getContactById,
  updateContactStatus,
  getContactStatistics,
};





