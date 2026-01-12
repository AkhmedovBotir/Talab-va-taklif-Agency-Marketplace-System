const MaxallaProduct = require('../models/MaxallaProduct');
const BaseProduct = require('../models/BaseProduct');
const Contragent = require('../models/Contragent');

// Create maxalla product
const createMaxallaProduct = async (req, res) => {
  try {
    const { baseProductId, quantity, price, originalPrice, status } = req.body;
    const contragentId = req.user.userId;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Validate base product exists and is active
    const baseProduct = await BaseProduct.findById(baseProductId);
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Asosiy maxsulot topilmadi',
      });
    }

    if (baseProduct.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Asosiy maxsulot faol emas',
      });
    }

    // Check if maxalla product already exists for this contragent and base product
    const existingProduct = await MaxallaProduct.findOne({
      baseProduct: baseProductId,
      contragent: contragentId,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot allaqachon qo\'shilgan',
      });
    }

    // Create maxalla product
    const maxallaProduct = await MaxallaProduct.create({
      baseProduct: baseProductId,
      contragent: contragentId,
      quantity,
      price,
      originalPrice,
      status: status || 'active',
    });

    // Populate references
    await maxallaProduct.populate({
      path: 'baseProduct',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
      ],
    });
    await maxallaProduct.populate('contragent', 'name inn phone');

    res.status(201).json({
      success: true,
      message: 'Maxalla maxsuloti muvaffaqiyatli yaratildi',
      data: maxallaProduct,
    });
  } catch (error) {
    console.error('Error creating maxalla product:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot allaqachon qo\'shilgan',
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
      message: 'Maxalla maxsulotini yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all maxalla products for current contragent
const getAllMaxallaProducts = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { status, category, subcategory, search, page = 1, limit = 20 } = req.query;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Build filter
    const filter = { contragent: contragentId };
    if (status) {
      filter.status = status;
    }

    // Build base product filter for category/subcategory/search
    const baseProductFilter = {};
    if (category) {
      baseProductFilter.category = category;
    }
    if (subcategory) {
      baseProductFilter.subcategory = subcategory;
    }
    if (search) {
      baseProductFilter.name = { $regex: search, $options: 'i' };
    }

    // Get base product IDs that match the filter
    let baseProductIds = [];
    if (Object.keys(baseProductFilter).length > 0) {
      const baseProducts = await BaseProduct.find(baseProductFilter).select('_id');
      baseProductIds = baseProducts.map((bp) => bp._id);
      if (baseProductIds.length === 0) {
        // No base products match, return empty result
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
      filter.baseProduct = { $in: baseProductIds };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get maxalla products
    const maxallaProducts = await MaxallaProduct.find(filter)
      .populate({
        path: 'baseProduct',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .populate('contragent', 'name inn phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await MaxallaProduct.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: maxallaProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting maxalla products:', error);
    res.status(500).json({
      success: false,
      message: 'Maxalla maxsulotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla product by ID
const getMaxallaProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const contragentId = req.user.userId;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    const maxallaProduct = await MaxallaProduct.findOne({
      _id: id,
      contragent: contragentId,
    })
      .populate({
        path: 'baseProduct',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .populate('contragent', 'name inn phone');

    if (!maxallaProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: maxallaProduct,
    });
  } catch (error) {
    console.error('Error getting maxalla product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Maxalla maxsulotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update maxalla product
const updateMaxallaProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price, originalPrice, status } = req.body;
    const contragentId = req.user.userId;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Find maxalla product
    const maxallaProduct = await MaxallaProduct.findOne({
      _id: id,
      contragent: contragentId,
    });

    if (!maxallaProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
      });
    }

    // Update maxalla product
    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (status !== undefined) updateData.status = status;

    const updated = await MaxallaProduct.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: 'baseProduct',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .populate('contragent', 'name inn phone');

    res.status(200).json({
      success: true,
      message: 'Maxalla maxsuloti yangilandi',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating maxalla product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
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
      message: 'Maxalla maxsulotni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete maxalla product
const deleteMaxallaProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const contragentId = req.user.userId;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    const maxallaProduct = await MaxallaProduct.findOne({
      _id: id,
      contragent: contragentId,
    });

    if (!maxallaProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
      });
    }

    await MaxallaProduct.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Maxalla maxsuloti o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting maxalla product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Maxalla maxsulotni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get available base products (for selection)
const getAvailableBaseProducts = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { category, subcategory, search, page = 1, limit = 20 } = req.query;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Build filter
    const filter = { status: 'active' };
    if (category) {
      filter.category = category;
    }
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Get base products that are already added by this contragent
    const existingMaxallaProducts = await MaxallaProduct.find({
      contragent: contragentId,
    }).select('baseProduct');

    const existingBaseProductIds = existingMaxallaProducts.map((mp) => mp.baseProduct.toString());

    // Exclude already added products
    if (existingBaseProductIds.length > 0) {
      filter._id = { $nin: existingBaseProductIds };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get base products
    const baseProducts = await BaseProduct.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
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
    console.error('Error getting available base products:', error);
    res.status(500).json({
      success: false,
      message: 'Mavjud asosiy maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createMaxallaProduct,
  getAllMaxallaProducts,
  getMaxallaProductById,
  updateMaxallaProduct,
  deleteMaxallaProduct,
  getAvailableBaseProducts,
};
