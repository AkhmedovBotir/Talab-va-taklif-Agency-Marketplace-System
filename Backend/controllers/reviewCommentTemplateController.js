const ReviewCommentTemplate = require('../models/ReviewCommentTemplate');

// Create comment template (Admin only)
const createCommentTemplate = async (req, res) => {
  try {
    const { text, order } = req.body;

    // Check if order number already exists
    const existingOrder = await ReviewCommentTemplate.findOne({ order });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bu tartib raqami allaqachon mavjud',
      });
    }

    const template = await ReviewCommentTemplate.create({
      text,
      order,
    });

    res.status(201).json({
      success: true,
      message: 'Kommentariya shabloni yaratildi',
      data: template,
    });
  } catch (error) {
    console.error('Create comment template error:', error);
    res.status(500).json({
      success: false,
      message: 'Kommentariya shablonini yaratishda xatolik',
      error: error.message,
    });
  }
};

// Get all comment templates (Admin only)
const getAllCommentTemplates = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const templates = await ReviewCommentTemplate.find(query)
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Get comment templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Kommentariya shablonlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get comment template by ID
const getCommentTemplateById = async (req, res) => {
  try {
    const template = await ReviewCommentTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Kommentariya shabloni topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get comment template error:', error);
    res.status(500).json({
      success: false,
      message: 'Kommentariya shablonini olishda xatolik',
      error: error.message,
    });
  }
};

// Update comment template
const updateCommentTemplate = async (req, res) => {
  try {
    const { text, order, isActive } = req.body;

    // Check if order number already exists (if being updated)
    if (order) {
      const existingOrder = await ReviewCommentTemplate.findOne({
        order,
        _id: { $ne: req.params.id },
      });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Bu tartib raqami allaqachon mavjud',
        });
      }
    }

    const template = await ReviewCommentTemplate.findByIdAndUpdate(
      req.params.id,
      { text, order, isActive },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Kommentariya shabloni topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kommentariya shabloni yangilandi',
      data: template,
    });
  } catch (error) {
    console.error('Update comment template error:', error);
    res.status(500).json({
      success: false,
      message: 'Kommentariya shablonini yangilashda xatolik',
      error: error.message,
    });
  }
};

// Delete comment template
const deleteCommentTemplate = async (req, res) => {
  try {
    const template = await ReviewCommentTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Kommentariya shabloni topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kommentariya shabloni o\'chirildi',
    });
  } catch (error) {
    console.error('Delete comment template error:', error);
    res.status(500).json({
      success: false,
      message: 'Kommentariya shablonini o\'chirishda xatolik',
      error: error.message,
    });
  }
};

module.exports = {
  createCommentTemplate,
  getAllCommentTemplates,
  getCommentTemplateById,
  updateCommentTemplate,
  deleteCommentTemplate,
};





