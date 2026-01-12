const MaxallaProduct = require('../models/MaxallaProduct');
const BaseProduct = require('../models/BaseProduct');
const Contragent = require('../models/Contragent');

// Get all maxalla products (for admin)
const getAllMaxallaProducts = async (req, res) => {
  try {
    const {
      status,
      category,
      subcategory,
      contragent,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (contragent) {
      filter.contragent = contragent;
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
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy contragentLevel status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
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
    console.error('Error getting maxalla products for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Maxalla maxsulotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla product by ID (for admin)
const getMaxallaProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const maxallaProduct = await MaxallaProduct.findById(id)
      .populate({
        path: 'baseProduct',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
        ],
      })
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy contragentLevel status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      });

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
    console.error('Error getting maxalla product for admin:', error);
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

module.exports = {
  getAllMaxallaProducts,
  getMaxallaProductById,
};
