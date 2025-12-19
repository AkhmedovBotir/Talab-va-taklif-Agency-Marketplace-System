const Product = require('../models/Product');
const Category = require('../models/Category');
const Region = require('../models/Region');
const { cacheInvalidators } = require('../middleware/cache');

// Create product
const createProduct = async (req, res) => {
  try {
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
    } = req.body;

    const { userId } = req.user; // Contragent ID from auth middleware

    // Validate category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Kategoriya topilmadi',
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
      // Check if subcategory belongs to the category
      if (subcategoryDoc.parent?.toString() !== category.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya tanlangan kategoriyaga tegishli emas',
        });
      }
    }

    // Validate delivery regions
    if (deliveryRegions && Array.isArray(deliveryRegions)) {
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
          // Check if tuman belongs to viloyat
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
    } else if (deliveryRegions !== undefined && deliveryRegions !== null) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazib berish xududlari massiv ko\'rinishida bo\'lishi kerak',
      });
    }

    // Generate product code
    const productCode = await Product.generateProductCode(userId);

    // Create product
    const product = await Product.create({
      name,
      description: description || null,
      price,
      originalPrice,
      images: images || [],
      category,
      subcategory: subcategory || null,
      quantity,
      unit,
      unitSize: unitSize || null,
      length: length || null,
      width: width || null,
      weight: weight || null,
      status: status || 'active',
      contragent: userId,
      deliveryRegions: deliveryRegions || [],
      kpiBonusPercent,
      productCode,
    });

    // Populate references
    await product.populate('category', 'name slug');
    if (product.subcategory) {
      await product.populate('subcategory', 'name slug');
    }
    await product.populate('contragent', 'name inn phone');
    await product.populate('deliveryRegions.viloyat', 'name type code');
    await product.populate('deliveryRegions.tuman', 'name type code');

    // Invalidate cache
    await cacheInvalidators.invalidateProductCache();

    res.status(201).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli yaratildi',
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Maxsulot kodi allaqachon mavjud',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulot yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const {
      status,
      category,
      subcategory,
      contragent,
      viloyat,
      tuman,
      page = 1,
      limit = 10,
    } = req.query;

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

    if (contragent) {
      filter.contragent = contragent;
    }

    // Filter by delivery regions
    if (viloyat) {
      filter['deliveryRegions.viloyat'] = viloyat;
    }

    if (tuman) {
      filter['deliveryRegions.tuman'] = tuman;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone')
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
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get products by contragent (current user)
const getMyProducts = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID from auth middleware
    const { status, category, subcategory, page = 1, limit = 10 } = req.query;

    const filter = { contragent: userId };

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
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
    console.error('Error fetching my products:', error);
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone viloyat tuman mfy')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update product
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
    } = req.body;

    const { userId } = req.user; // Contragent ID from auth middleware

    // Check if product exists and belongs to this contragent
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (existingProduct.contragent.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu maxsulotni yangilash huquqiga ega emassiz',
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
    }

    // Validate subcategory if provided
    if (subcategory !== undefined) {
      if (subcategory === null || subcategory === '') {
        // Removing subcategory is allowed
      } else {
        const subcategoryDoc = await Category.findById(subcategory);
        if (!subcategoryDoc) {
          return res.status(400).json({
            success: false,
            message: 'Sub kategoriya topilmadi',
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

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    // Invalidate cache
    await cacheInvalidators.invalidateProductCache();

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

// Update product status
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { userId } = req.user; // Contragent ID from auth middleware

    if (!status || !['active', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status "active", "inactive" yoki "archived" bo\'lishi kerak',
      });
    }

    // Check if product exists and belongs to this contragent
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (existingProduct.contragent.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu maxsulotni yangilash huquqiga ega emassiz',
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    // Invalidate cache
    await cacheInvalidators.invalidateProductCache();

    res.status(200).json({
      success: true,
      message: 'Maxsulot statusi muvaffaqiyatli yangilandi',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulot statusini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user; // Contragent ID from auth middleware

    // Check if product exists and belongs to this contragent
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.contragent.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu maxsulotni o\'chirish huquqiga ega emassiz',
      });
    }

    await Product.findByIdAndDelete(id);

    // Invalidate cache
    await cacheInvalidators.invalidateProductCache();

    res.status(200).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};


