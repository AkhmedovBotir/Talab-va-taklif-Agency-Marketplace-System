const Product = require('../models/Product');
const Category = require('../models/Category');
const Region = require('../models/Region');

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

// Admin: Update product (can update any product, no contragent check)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      originalPrice,
      images,
      category,
      subcategory,
      quantity,
      unit,
      unitSize,
      length,
      width,
      weight,
      status,
      deliveryRegions,
      kpiBonusPercent,
      moderationStatus,
    } = req.body;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    // Determine censored status - start with existing product's censored value
    let productCensored = existingProduct.censored;

    // Validate category if provided
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Kategoriya topilmadi',
        });
      }

      // Check if category is active and created by Admin
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

      // Update censored from category
      productCensored = categoryDoc.censored || false;
    }

    // Validate subcategory if provided
    if (subcategory !== undefined) {
      if (subcategory === null || subcategory === '') {
        // Removing subcategory - use category's censored
        if (category) {
          const categoryDoc = await Category.findById(category);
          productCensored = categoryDoc.censored || false;
        } else {
          const currentCategoryDoc = await Category.findById(existingProduct.category);
          productCensored = currentCategoryDoc.censored || false;
        }
      } else {
        const subcategoryDoc = await Category.findById(subcategory);
        if (!subcategoryDoc) {
          return res.status(400).json({
            success: false,
            message: 'Sub kategoriya topilmadi',
          });
        }

        // Check if subcategory is active and created by Admin
        if (subcategoryDoc.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: 'Sub kategoriya faol emas',
          });
        }

        if (subcategoryDoc.createdByModel !== 'Admin') {
          return res.status(400).json({
            success: false,
            message: 'Bu sub kategoriya foydalanish uchun ruxsat berilmagan',
          });
        }

        // Check if subcategory belongs to the category
        const catId = category || existingProduct.category;
        if (subcategoryDoc.parent?.toString() !== catId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Sub kategoriya tanlangan kategoriyaga tegishli emas',
          });
        }

        // Update censored from subcategory (which inherits from parent)
        productCensored = subcategoryDoc.censored || false;
      }
    }

    // Validate delivery regions if provided
    if (deliveryRegions !== undefined) {
      if (!Array.isArray(deliveryRegions)) {
        return res.status(400).json({
          success: false,
          message: 'Yetkazib berish xududlari massiv ko\'rinishida bo\'lishi kerak',
        });
      }

      if (deliveryRegions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kamida bitta yetkazib berish xududi kiritilishi shart',
        });
      }

      for (let i = 0; i < deliveryRegions.length; i++) {
        const region = deliveryRegions[i];
        
        if (!region.viloyat) {
          return res.status(400).json({
            success: false,
            message: `${i + 1}-yetkazib berish xududida viloyat kiritilishi shart`,
          });
        }

        const viloyatDoc = await Region.findById(region.viloyat);
        if (!viloyatDoc || viloyatDoc.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: `${i + 1}-yetkazib berish xududida viloyat topilmadi yoki noto'g'ri tur`,
          });
        }

        // Tuman null yoki ID bo'lishi mumkin
        if (region.tuman !== null && region.tuman !== undefined && region.tuman !== '') {
          const tumanDoc = await Region.findById(region.tuman);
          if (!tumanDoc || tumanDoc.type !== 'district') {
            return res.status(400).json({
              success: false,
              message: `${i + 1}-yetkazib berish xududida tuman topilmadi yoki noto'g'ri tur`,
            });
          }
          if (tumanDoc.parent?.toString() !== region.viloyat.toString()) {
            return res.status(400).json({
              success: false,
              message: `${i + 1}-yetkazib berish xududida tuman tanlangan viloyatga tegishli emas`,
            });
          }
        } else {
          // Ensure tuman is explicitly null
          region.tuman = null;
        }
      }
    }

    // Validate moderationStatus if provided
    if (moderationStatus !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(moderationStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Moderation status "pending", "approved" yoki "rejected" bo\'lishi kerak',
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description === '' ? null : description;
    if (price !== undefined) updateData.price = price;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory === '' ? null : subcategory;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (unitSize !== undefined) updateData.unitSize = unitSize === '' ? null : unitSize;
    if (length !== undefined) updateData.length = length === '' ? null : length;
    if (width !== undefined) updateData.width = width === '' ? null : width;
    if (weight !== undefined) updateData.weight = weight === '' ? null : weight;
    if (status !== undefined) updateData.status = status;
    if (deliveryRegions !== undefined) updateData.deliveryRegions = deliveryRegions;
    if (kpiBonusPercent !== undefined) updateData.kpiBonusPercent = kpiBonusPercent;
    if (moderationStatus !== undefined) updateData.moderationStatus = moderationStatus;
    
    // Always update censored based on category/subcategory
    updateData.censored = productCensored;
    
    // If category or subcategory changed, reset moderation status to pending (unless explicitly set)
    if ((category !== undefined || subcategory !== undefined) && moderationStatus === undefined) {
      updateData.moderationStatus = 'pending';
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug status image censored')
      .populate('subcategory', 'name slug status image censored')
      .populate('contragent', 'name inn phone viloyat tuman mfy')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli yangilandi',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotni yangilashda xatolik yuz berdi',
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
  updateProduct,
};

