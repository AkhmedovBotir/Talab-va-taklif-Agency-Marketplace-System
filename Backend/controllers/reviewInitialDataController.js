const ReviewCommentTemplate = require('../models/ReviewCommentTemplate');

// Create initial comment templates
const createInitialTemplates = async (req, res) => {
  try {
    // Check if templates already exist
    const existingTemplates = await ReviewCommentTemplate.countDocuments();
    if (existingTemplates > 0) {
      return res.status(400).json({
        success: false,
        message: 'Boshlang\'ich shablonlar allaqachon mavjud. Iltimos, mavjud shablonlarni o\'chiring yoki yangilang.',
      });
    }

    const templates = [
      { text: 'Yaxshi', order: 1 },
      { text: 'Yetkazish tez', order: 2 },
      { text: 'Boshqa', order: 3 },
    ];

    const createdTemplates = await ReviewCommentTemplate.insertMany(templates);

    res.status(201).json({
      success: true,
      message: 'Boshlang\'ich shablonlar yaratildi',
      data: createdTemplates,
    });
  } catch (error) {
    console.error('Create initial templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Boshlang\'ich shablonlarni yaratishda xatolik',
      error: error.message,
    });
  }
};

// Get active comment templates for marketplace users
const getActiveTemplates = async (req, res) => {
  try {
    const templates = await ReviewCommentTemplate.find({ isActive: true })
      .select('text order')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Get active templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Shablonlarni olishda xatolik',
      error: error.message,
    });
  }
};

module.exports = {
  createInitialTemplates,
  getActiveTemplates,
};





