const BaseProduct = require('../models/BaseProduct');
const Category = require('../models/Category');

// Create base product
const createBaseProduct = async (req, res) => {
  try {
    const { name, description, images, category, subcategory, unit, unitSize, status } = req.body;
    const adminId = req.user.userId;

    // Validate category exists and is active
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    if (categoryDoc.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Kategoriya faol emas',
      });
    }

    // Check if category is created by Admin
    if (categoryDoc.createdByModel !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriya foydalanish uchun ruxsat berilmagan',
      });
    }

    // Check if category is top-level (has no parent)
    if (categoryDoc.parent) {
      return res.status(400).json({
        success: false,
        message: 'Kategoriya top-level bo\'lishi kerak (sub kategoriya tanlash mumkin emas)',
      });
    }

    // Validate subcategory if provided
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya topilmadi',
        });
      }

      if (subcategoryDoc.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya faol emas',
        });
      }

      if (subcategoryDoc.parent?.toString() !== category) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya tanlangan kategoriyaga tegishli emas',
        });
      }
    }

    // Validate images format (base64)
    if (images && images.length > 0) {
      const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      for (const image of images) {
        if (!base64Pattern.test(image)) {
          return res.status(400).json({
            success: false,
            message: 'Rasmlar base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
          });
        }
      }
    }

    // Create base product
    const baseProduct = await BaseProduct.create({
      name,
      description: description || null,
      images: images || [],
      category,
      subcategory: subcategory || null,
      unit,
      unitSize: unitSize || null,
      status: status || 'active',
      createdBy: adminId,
    });

    // Populate references
    await baseProduct.populate('category', 'name slug');
    if (baseProduct.subcategory) {
      await baseProduct.populate('subcategory', 'name slug');
    }
    await baseProduct.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Asosiy maxsulot muvaffaqiyatli yaratildi',
      data: baseProduct,
    });
  } catch (error) {
    console.error('Error creating base product:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Asosiy maxsulot yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all base products
const getAllBaseProducts = async (req, res) => {
  try {
    const { status, category, subcategory, search, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const baseProducts = await BaseProduct.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await BaseProduct.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: baseProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting base products:', error);
    res.status(500).json({
      success: false,
      message: 'Asosiy maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get base product by ID
const getBaseProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const baseProduct = await BaseProduct.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email');

    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Asosiy maxsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: baseProduct,
    });
  } catch (error) {
    console.error('Error getting base product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri asosiy maxsulot ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Asosiy maxsulotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update base product
const updateBaseProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, images, category, subcategory, unit, unitSize, status } = req.body;

    // Find base product
    const baseProduct = await BaseProduct.findById(id);
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Asosiy maxsulot topilmadi',
      });
    }

    // Validate category if provided
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Kategoriya topilmadi',
        });
      }

      if (categoryDoc.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Kategoriya faol emas',
        });
      }

      if (categoryDoc.createdByModel !== 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Bu kategoriya foydalanish uchun ruxsat berilmagan',
        });
      }

      if (categoryDoc.parent) {
        return res.status(400).json({
          success: false,
          message: 'Kategoriya top-level bo\'lishi kerak',
        });
      }
    }

    // Validate subcategory if provided
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya topilmadi',
        });
      }

      if (subcategoryDoc.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya faol emas',
        });
      }

      const finalCategory = category || baseProduct.category;
      if (subcategoryDoc.parent?.toString() !== finalCategory.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya tanlangan kategoriyaga tegishli emas',
        });
      }
    }

    // Validate images format if provided
    if (images && images.length > 0) {
      const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      for (const image of images) {
        if (!base64Pattern.test(image)) {
          return res.status(400).json({
            success: false,
            message: 'Rasmlar base64 formatida bo\'lishi kerak',
          });
        }
      }
    }

    // Update base product
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory || null;
    if (unit !== undefined) updateData.unit = unit;
    if (unitSize !== undefined) updateData.unitSize = unitSize || null;
    if (status !== undefined) updateData.status = status;

    const updated = await BaseProduct.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Asosiy maxsulot yangilandi',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating base product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri asosiy maxsulot ID',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Asosiy maxsulotni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete base product
const deleteBaseProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const baseProduct = await BaseProduct.findById(id);
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Asosiy maxsulot topilmadi',
      });
    }

    // Check if base product is used by any maxalla products
    const MaxallaProduct = require('../models/MaxallaProduct');
    const maxallaProductsCount = await MaxallaProduct.countDocuments({ baseProduct: id });

    if (maxallaProductsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu asosiy maxsulot ${maxallaProductsCount} ta maxalla dokonida ishlatilmoqda. Avval ularni o'chiring`,
      });
    }

    await BaseProduct.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Asosiy maxsulot o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting base product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri asosiy maxsulot ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Asosiy maxsulotni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createBaseProduct,
  getAllBaseProducts,
  getBaseProductById,
  updateBaseProduct,
  deleteBaseProduct,
};
