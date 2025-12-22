const Product = require('../models/Product');
const Category = require('../models/Category');

// Get all pending products for moderation
const getPendingProducts = async (req, res) => {
  try {
    const { contragent, category, page = 1, limit = 50 } = req.query;

    const filter = { moderationStatus: 'pending' };

    if (contragent) {
      filter.contragent = contragent;
    }

    if (category) {
      filter.category = category;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name slug status image censored')
      .populate('subcategory', 'name slug status image censored')
      .populate('contragent', 'name inn phone viloyat tuman mfy')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    console.error('Error fetching pending products:', error);
    res.status(500).json({
      success: false,
      message: 'Kutilayotgan maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get pending product by ID
const getPendingProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      moderationStatus: 'pending',
    })
      .populate('category', 'name slug status image censored')
      .populate('subcategory', 'name slug status image censored')
      .populate('contragent', 'name inn phone viloyat tuman mfy')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Kutilayotgan maxsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching pending product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kutilayotgan maxsulotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Approve product
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.moderationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Maxsulot allaqachon ${product.moderationStatus === 'approved' ? 'tasdiqlangan' : 'rad etilgan'}`,
      });
    }

    product.moderationStatus = 'approved';
    product.moderatedBy = adminId;
    product.moderatedAt = new Date();
    product.rejectionReason = null;

    await product.save();

    await product.populate('category', 'name slug status image censored');
    if (product.subcategory) {
      await product.populate('subcategory', 'name slug status image censored');
    }
    await product.populate('contragent', 'name inn phone');
    await product.populate('moderatedBy', 'name username telefonRaqam');

    res.status(200).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli tasdiqlandi va marketplace ga qo\'shildi',
      data: product,
    });
  } catch (error) {
    console.error('Error approving product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Reject product
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.userId;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rad etish sababi kiritilishi shart',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.moderationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Maxsulot allaqachon ${product.moderationStatus === 'approved' ? 'tasdiqlangan' : 'rad etilgan'}`,
      });
    }

    product.moderationStatus = 'rejected';
    product.moderatedBy = adminId;
    product.moderatedAt = new Date();
    product.rejectionReason = rejectionReason.trim();

    await product.save();

    await product.populate('category', 'name slug status image censored');
    if (product.subcategory) {
      await product.populate('subcategory', 'name slug status image censored');
    }
    await product.populate('contragent', 'name inn phone');
    await product.populate('moderatedBy', 'name username telefonRaqam');

    res.status(200).json({
      success: true,
      message: 'Maxsulot rad etildi',
      data: product,
    });
  } catch (error) {
    console.error('Error rejecting product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotni rad etishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all products with moderation status filter
const getAllProductsForModeration = async (req, res) => {
  try {
    const {
      moderationStatus,
      contragent,
      category,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (moderationStatus) {
      filter.moderationStatus = moderationStatus;
    }

    if (contragent) {
      filter.contragent = contragent;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name slug status image censored')
      .populate('subcategory', 'name slug status image censored')
      .populate('contragent', 'name inn phone viloyat tuman mfy')
      .populate('moderatedBy', 'name username telefonRaqam')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products for moderation:', error);
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getPendingProducts,
  getPendingProductById,
  approveProduct,
  rejectProduct,
  getAllProductsForModeration,
};

