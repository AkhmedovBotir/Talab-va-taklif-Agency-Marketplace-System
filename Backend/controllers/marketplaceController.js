const Product = require('../models/Product');
const Category = require('../models/Category');
const Contragent = require('../models/Contragent');
const Region = require('../models/Region');

// Get all products for marketplace (without kpiBonusPercent)
// This endpoint returns only TUMAN products (contragentLevel: 'tuman')
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      contragent,
      status,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter for tuman products only
    const filter = { 
      status: 'active',
      moderationStatus: 'approved' // Only approved products for marketplace
    };

    // Filter by contragent level - only tuman contragents
    const Contragent = require('../models/Contragent');
    const tumanContragents = await Contragent.find({ 
      contragentLevel: 'tuman',
      status: 'active' 
    }).select('_id');
    const tumanContragentIds = tumanContragents.map(c => c._id);
    
    if (tumanContragentIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: 0,
        data: [],
      });
    }
    
    filter.contragent = { $in: tumanContragentIds };

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (contragent) {
      // Verify that the contragent is a tuman contragent
      const contragentDoc = await Contragent.findById(contragent);
      if (!contragentDoc || contragentDoc.contragentLevel !== 'tuman') {
        return res.status(400).json({
          success: false,
          message: 'Bu kontragent tuman kontragenti emas',
        });
      }
      filter.contragent = contragent;
    }

    if (status) {
      filter.status = status;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
          {
            path: 'mfy',
            select: 'name type code',
          },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from products
    const productsWithoutKpi = products.map((product) => {
      const productObj = product.toObject();
      delete productObj.kpiBonusPercent;
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: productsWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching products for marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get product by ID for marketplace (without kpiBonusPercent)
// This endpoint returns TUMAN products (contragentLevel: 'tuman'). Tasdiqlanmagan yoki inactive bo'lsa ham ID bo'yicha topilsa qaytariladi — sahifada ko'rinsin.
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const Contragent = require('../models/Contragent');
    const product = await Product.findOne({ _id: id }).populate('contragent', 'contragentLevel');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi yoki hali tasdiqlanmagan',
      });
    }

    // Check if contragent is tuman level
    if (!product.contragent || product.contragent.contragentLevel !== 'tuman') {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi yoki hali tasdiqlanmagan',
      });
    }

    // Re-fetch with full population (ID bo'yicha, status/moderationStatus filtersiz — tasdiqlanmagan ham qaytariladi)
    const fullProduct = await Product.findOne({ _id: id })
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    if (!fullProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi yoki hali tasdiqlanmagan',
      });
    }

    // Remove kpiBonusPercent
    const productObj = fullProduct.toObject();
    delete productObj.kpiBonusPercent;

    res.status(200).json({
      success: true,
      data: productObj,
    });
  } catch (error) {
    console.error('Error fetching product for marketplace:', error);

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

// Get all categories with subcategories for marketplace
const getAllCategories = async (req, res) => {
  try {
    const { status, includeSubcategories } = req.query;

    const filter = { parent: null }; // Only parent categories

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active'; // Default to active
    }

    let categories = await Category.find(filter)
      .populate('parent', 'name slug status')
      .sort({ createdAt: -1 });

    // Include subcategories if requested
    if (includeSubcategories === 'true') {
      categories = await Category.populate(categories, {
        path: 'subcategories',
        match: status ? { status } : { status: 'active' },
        select: 'name slug status createdAt updatedAt',
      });
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories for marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get category by ID with subcategories for marketplace
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeSubcategories } = req.query;

    const category = await Category.findById(id).populate('parent', 'name slug status');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    // Include subcategories if requested
    if (includeSubcategories === 'true') {
      await category.populate({
        path: 'subcategories',
        match: { status: 'active' },
        select: 'name slug status createdAt updatedAt',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category for marketplace:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriyani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get products by category ID
const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subcategory,
      contragent,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Filter for tuman products only
    const Contragent = require('../models/Contragent');
    const tumanContragents = await Contragent.find({ 
      contragentLevel: 'tuman',
      status: 'active' 
    }).select('_id');
    const tumanContragentIds = tumanContragents.map(c => c._id);
    
    if (tumanContragentIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: 0,
        data: [],
      });
    }

    const filter = {
      category: id,
      status: 'active',
      moderationStatus: 'approved', // Only approved products for marketplace
      contragent: { $in: tumanContragentIds }, // Only tuman products
    };

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (contragent) {
      // Verify that the contragent is a tuman contragent
      const contragentDoc = await Contragent.findById(contragent);
      if (!contragentDoc || contragentDoc.contragentLevel !== 'tuman') {
        return res.status(400).json({
          success: false,
          message: 'Bu kontragent tuman kontragenti emas',
        });
      }
      filter.contragent = contragent;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
          {
            path: 'mfy',
            select: 'name type code',
          },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from products
    const productsWithoutKpi = products.map((product) => {
      const productObj = product.toObject();
      delete productObj.kpiBonusPercent;
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: productsWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching products by category for marketplace:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all contragents for marketplace (without inn)
const getAllContragents = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active'; // Default to active
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Contragent.countDocuments(filter);

    const contragents = await Contragent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove inn from contragents
    const contragentsWithoutInn = contragents.map((contragent) => {
      const contragentObj = contragent.toObject();
      delete contragentObj.inn;
      return contragentObj;
    });

    res.status(200).json({
      success: true,
      count: contragentsWithoutInn.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: contragentsWithoutInn,
    });
  } catch (error) {
    console.error('Error fetching contragents for marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get contragent by ID with categories, subcategories, and products for marketplace (without inn)
const getContragentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeProducts, includeCategories } = req.query;

    const contragent = await Contragent.findById(id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Remove inn
    const contragentObj = contragent.toObject();
    delete contragentObj.inn;

    // Verify contragent is tuman level for marketplace
    if (contragent.contragentLevel !== 'tuman') {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Get categories used by this contragent
    if (includeCategories === 'true') {
      const products = await Product.find({ 
        contragent: id, 
        status: 'active',
        moderationStatus: 'approved' // Only approved products
      })
        .select('category subcategory')
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status');

      const categoryMap = new Map();
      const subcategoryMap = new Map();

      products.forEach((product) => {
        if (product.category) {
          categoryMap.set(product.category._id.toString(), product.category);
        }
        if (product.subcategory) {
          subcategoryMap.set(product.subcategory._id.toString(), product.subcategory);
        }
      });

      contragentObj.categories = Array.from(categoryMap.values());
      contragentObj.subcategories = Array.from(subcategoryMap.values());
    }

    // Get products for this contragent (only if tuman level)
    if (includeProducts === 'true') {
      const products = await Product.find({ 
        contragent: id, 
        status: 'active',
        moderationStatus: 'approved' // Only approved products
      })
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status')
        .populate('deliveryRegions.viloyat', 'name type code')
        .populate('deliveryRegions.tuman', 'name type code')
        .sort({ createdAt: -1 });

      // Remove kpiBonusPercent from products
      const productsWithoutKpi = products.map((product) => {
        const productObj = product.toObject();
        delete productObj.kpiBonusPercent;
        return productObj;
      });

      contragentObj.products = productsWithoutKpi;
    }

    res.status(200).json({
      success: true,
      data: contragentObj,
    });
  } catch (error) {
    console.error('Error fetching contragent for marketplace:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragentni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Search across products, categories, and contragents
const search = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Qidiruv so\'rovi kiritilishi shart',
      });
    }

    const searchQuery = q.trim();
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filter for tuman products only
    const Contragent = require('../models/Contragent');
    const tumanContragents = await Contragent.find({ 
      contragentLevel: 'tuman',
      status: 'active' 
    }).select('_id');
    const tumanContragentIds = tumanContragents.map(c => c._id);

    // Search products (only tuman products)
    const productFilter = {
      status: 'active',
      moderationStatus: 'approved', // Only approved products for marketplace
      contragent: tumanContragentIds.length > 0 ? { $in: tumanContragentIds } : { $in: [] }, // Only tuman products
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { productCode: { $regex: searchQuery, $options: 'i' } },
      ],
    };

    const products = await Product.find(productFilter)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from products
    const productsWithoutKpi = products.map((product) => {
      const productObj = product.toObject();
      delete productObj.kpiBonusPercent;
      return productObj;
    });

    // Search categories
    const categoryFilter = {
      status: 'active',
      name: { $regex: searchQuery, $options: 'i' },
    };

    const categories = await Category.find(categoryFilter)
      .populate('parent', 'name slug status')
      .limit(10);

    // Search contragents (only tuman contragents)
    const contragentFilter = {
      status: 'active',
      contragentLevel: 'tuman', // Only tuman contragents
      name: { $regex: searchQuery, $options: 'i' },
    };

    const contragents = await Contragent.find(contragentFilter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .limit(10);

    // Remove inn from contragents
    const contragentsWithoutInn = contragents.map((contragent) => {
      const contragentObj = contragent.toObject();
      delete contragentObj.inn;
      return contragentObj;
    });

    // Get total count for products
    const totalProducts = await Product.countDocuments(productFilter);

    res.status(200).json({
      success: true,
      query: searchQuery,
      results: {
        products: {
          count: productsWithoutKpi.length,
          total: totalProducts,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalProducts / limitNum),
          data: productsWithoutKpi,
        },
        categories: {
          count: categories.length,
          data: categories,
        },
        contragents: {
          count: contragentsWithoutInn.length,
          data: contragentsWithoutInn,
        },
      },
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Qidiruvda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Filter products with advanced filters
const filterProducts = async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      contragent,
      category,
      subcategory,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { 
      status: 'active',
      moderationStatus: 'approved' // Only approved products for marketplace
    };

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Contragent filter
    if (contragent) {
      // Verify that the contragent is a tuman contragent
      const contragentDoc = await Contragent.findById(contragent);
      if (!contragentDoc || contragentDoc.contragentLevel !== 'tuman') {
        return res.status(400).json({
          success: false,
          message: 'Bu kontragent tuman kontragenti emas',
        });
      }
      filter.contragent = contragent;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Subcategory filter
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // If contragent is provided, get categories and subcategories for that contragent
    let availableCategories = [];
    let availableSubcategories = [];

    if (contragent) {
      // Verify contragent is tuman level
      const contragentDoc = await Contragent.findById(contragent);
      if (!contragentDoc || contragentDoc.contragentLevel !== 'tuman') {
        return res.status(400).json({
          success: false,
          message: 'Bu kontragent tuman kontragenti emas',
        });
      }

      // Get all products for this contragent to extract categories and subcategories
      const contragentProducts = await Product.find({
        contragent: contragent,
        status: 'active',
        moderationStatus: 'approved', // Only approved products
      })
        .select('category subcategory')
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status');

      const categoryMap = new Map();
      const subcategoryMap = new Map();

      contragentProducts.forEach((product) => {
        if (product.category) {
          categoryMap.set(product.category._id.toString(), product.category);
        }
        if (product.subcategory) {
          subcategoryMap.set(product.subcategory._id.toString(), product.subcategory);
        }
      });

      availableCategories = Array.from(categoryMap.values());
      availableSubcategories = Array.from(subcategoryMap.values());
    }

    // If category is provided, get subcategories for that category
    if (category && !subcategory) {
      const subcategories = await Category.find({
        parent: category,
        status: 'active',
      }).select('name slug status');

      availableSubcategories = subcategories.map((sub) => sub.toObject());
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from products
    const productsWithoutKpi = products.map((product) => {
      const productObj = product.toObject();
      delete productObj.kpiBonusPercent;
      return productObj;
    });

    // Get available contragents if not filtered (only tuman contragents)
    let availableContragents = [];
    if (!contragent) {
      const contragents = await Contragent.find({ 
        status: 'active',
        contragentLevel: 'tuman' // Only tuman contragents
      })
        .select('name phone viloyat tuman mfy status')
        .populate('viloyat', 'name type code')
        .populate('tuman', 'name type code')
        .populate('mfy', 'name type code')
        .limit(50);

      availableContragents = contragents.map((c) => {
        const cObj = c.toObject();
        delete cObj.inn;
        return cObj;
      });
    }

    res.status(200).json({
      success: true,
      filters: {
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        contragent: contragent || null,
        category: category || null,
        subcategory: subcategory || null,
      },
      availableFilters: {
        contragents: availableContragents,
        categories: availableCategories,
        subcategories: availableSubcategories,
      },
      results: {
        count: productsWithoutKpi.length,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        data: productsWithoutKpi,
      },
    });
  } catch (error) {
    console.error('Error filtering products:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri filter parametri',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Filter qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAXALLA PRODUCTS API ====================
// These endpoints return only MAXALLA products (contragentLevel: 'mfy')

// Get all maxalla products for marketplace
const getAllMaxallaProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      contragent,
      status,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const MaxallaProduct = require('../models/MaxallaProduct');
    const BaseProduct = require('../models/BaseProduct');
    const Contragent = require('../models/Contragent');

    // Filter for maxalla products only
    const maxallaContragents = await Contragent.find({ 
      contragentLevel: 'mfy',
      status: 'active' 
    }).select('_id');
    const maxallaContragentIds = maxallaContragents.map(c => c._id);
    
    if (maxallaContragentIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: 0,
        data: [],
      });
    }

    const filter = { 
      status: 'active',
      contragent: { $in: maxallaContragentIds }, // Only maxalla products
    };

    if (contragent) {
      // Verify that the contragent is a maxalla contragent
      const contragentDoc = await Contragent.findById(contragent);
      if (!contragentDoc || contragentDoc.contragentLevel !== 'mfy') {
        return res.status(400).json({
          success: false,
          message: 'Bu kontragent maxalla kontragenti emas',
        });
      }
      filter.contragent = contragent;
    }

    if (status) {
      filter.status = status;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get maxalla products
    let maxallaProducts = await MaxallaProduct.find(filter)
      .populate({
        path: 'baseProduct',
        select: 'name description images category subcategory unit unitSize status',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
        ],
      })
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Apply category/subcategory filters if provided
    if (category || subcategory || search) {
      const baseProductFilter = {};
      if (category) baseProductFilter.category = category;
      if (subcategory) baseProductFilter.subcategory = subcategory;
      if (search) {
        baseProductFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
        ];
      }
      baseProductFilter.status = 'active';

      const matchingBaseProducts = await BaseProduct.find(baseProductFilter).select('_id');
      const matchingBaseProductIds = matchingBaseProducts.map(bp => bp._id);

      maxallaProducts = maxallaProducts.filter(mp => 
        matchingBaseProductIds.includes(mp.baseProduct._id.toString())
      );
    }

    // Transform to marketplace format
    const products = maxallaProducts.map((mp) => {
      const bp = mp.baseProduct;
      return {
        _id: mp._id,
        name: bp.name,
        description: bp.description,
        images: bp.images,
        price: mp.price,
        originalPrice: mp.originalPrice,
        quantity: mp.quantity,
        unit: bp.unit,
        unitSize: bp.unitSize,
        category: bp.category,
        subcategory: bp.subcategory,
        contragent: mp.contragent,
        status: mp.status,
        productType: 'maxalla', // Indicate this is a maxalla product
        createdAt: mp.createdAt,
        updatedAt: mp.updatedAt,
      };
    });

    // Get total count
    let totalFilter = { ...filter };
    if (category || subcategory || search) {
      const baseProductFilter = {};
      if (category) baseProductFilter.category = category;
      if (subcategory) baseProductFilter.subcategory = subcategory;
      if (search) {
        baseProductFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
        ];
      }
      baseProductFilter.status = 'active';
      const matchingBaseProducts = await BaseProduct.find(baseProductFilter).select('_id');
      const matchingBaseProductIds = matchingBaseProducts.map(bp => bp._id);
      totalFilter.baseProduct = { $in: matchingBaseProductIds };
    }
    const total = await MaxallaProduct.countDocuments(totalFilter);

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
    console.error('Error fetching maxalla products for marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Maxalla maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla product by ID for marketplace
const getMaxallaProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const MaxallaProduct = require('../models/MaxallaProduct');
    const Contragent = require('../models/Contragent');

    // Maxalla maxsulotini ID bo'yicha qidirish (statusdan qat'iy nazar — tasdiqlanmagan bo'lsa ham qaytariladi)
    const maxallaProduct = await MaxallaProduct.findOne({
      _id: id,
    })
      .populate({
        path: 'baseProduct',
        select: 'name description images category subcategory unit unitSize status',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
        ],
      })
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status contragentLevel',
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

    // Kontragent maxalla (mfy) darajada ekanligini tekshirish (contragentLevel select da bo'lishi kerak)
    if (!maxallaProduct.contragent || maxallaProduct.contragent.contragentLevel !== 'mfy') {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
      });
    }

    // Transform to marketplace format
    const bp = maxallaProduct.baseProduct;
    const product = {
      _id: maxallaProduct._id,
      name: bp.name,
      description: bp.description,
      images: bp.images,
      price: maxallaProduct.price,
      originalPrice: maxallaProduct.originalPrice,
      quantity: maxallaProduct.quantity,
      unit: bp.unit,
      unitSize: bp.unitSize,
      category: bp.category,
      subcategory: bp.subcategory,
      contragent: maxallaProduct.contragent,
      status: maxallaProduct.status,
      productType: 'maxalla', // Indicate this is a maxalla product
      createdAt: maxallaProduct.createdAt,
      updatedAt: maxallaProduct.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching maxalla product for marketplace:', error);

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

// Helper function to check if contragent is open based on working hours
const isContragentOpen = (workingHours) => {
  if (!workingHours || !workingHours.open || !workingHours.close) {
    return null; // Working hours not set
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const [openHour, openMin] = workingHours.open.split(':').map(Number);
  const [closeHour, closeMin] = workingHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle case where close time is next day (e.g., 22:00 - 02:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime;
  }

  return currentTime >= openTime && currentTime < closeTime;
};

// Get maxalla stores (contragents) for a specific maxalla product in user's MFY
const getMaxallaStoresForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.userId; // Optional - if user is logged in, filter by their MFY

    const MaxallaProduct = require('../models/MaxallaProduct');
    const Contragent = require('../models/Contragent');
    const MarketplaceUser = require('../models/MarketplaceUser');
    const BaseProduct = require('../models/BaseProduct');

    // Get maxalla product
    const maxallaProduct = await MaxallaProduct.findById(productId)
      .populate('baseProduct', 'name')
      .populate('contragent', 'mfy');

    if (!maxallaProduct) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
      });
    }

    if (maxallaProduct.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxalla maxsuloti hozir mavjud emas',
      });
    }

    // Get base product to find all maxalla products with same baseProduct
    const baseProduct = maxallaProduct.baseProduct;
    if (!baseProduct) {
      return res.status(404).json({
        success: false,
        message: 'Asosiy maxsulot topilmadi',
      });
    }

    // Get user's MFY if authenticated
    let userMfy = null;
    if (userId) {
      const user = await MarketplaceUser.findById(userId).select('mfy');
      if (user && user.mfy) {
        userMfy = user.mfy;
      }
    } else {
      // If not authenticated, use the product's contragent MFY as default
      if (maxallaProduct.contragent && maxallaProduct.contragent.mfy) {
        userMfy = maxallaProduct.contragent.mfy;
      }
    }

    // Find all maxalla products with same baseProduct
    const allMaxallaProducts = await MaxallaProduct.find({
      baseProduct: baseProduct._id,
      status: 'active',
    }).populate('contragent', '_id');

    const contragentIds = [...new Set(allMaxallaProducts.map(mp => mp.contragent._id.toString()))];

    // Build filter for contragents
    const contragentFilter = {
      _id: { $in: contragentIds },
      contragentLevel: 'mfy',
      status: 'active',
    };

    // If user is authenticated and has MFY, filter by user's MFY
    if (userMfy) {
      contragentFilter.mfy = userMfy;
    }

    // Get contragents
    const contragents = await Contragent.find(contragentFilter)
      .select('name phone logo viloyat tuman mfy activityType workingHours status')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon');

    // Get maxalla products for each contragent
    const stores = [];
    for (const contragent of contragents) {
      const contragentMaxallaProducts = await MaxallaProduct.find({
        contragent: contragent._id,
        baseProduct: baseProduct._id,
        status: 'active',
      })
        .populate('baseProduct', 'name description images category subcategory unit unitSize')
        .populate({
          path: 'baseProduct',
          populate: [
            { path: 'category', select: 'name slug status' },
            { path: 'subcategory', select: 'name slug status' },
          ],
        });

      if (contragentMaxallaProducts.length === 0) continue;

      // Check if store is open
      const isOpen = isContragentOpen(contragent.workingHours);

      // Get the first product (they all have same baseProduct)
      const product = contragentMaxallaProducts[0];

      stores.push({
        contragent: {
          _id: contragent._id,
          name: contragent.name,
          phone: contragent.phone,
          logo: contragent.logo,
          viloyat: contragent.viloyat,
          tuman: contragent.tuman,
          mfy: contragent.mfy,
          activityType: contragent.activityType,
          workingHours: contragent.workingHours,
          isOpen, // true, false, or null (if working hours not set)
          status: contragent.status,
        },
        product: {
          _id: product._id,
          name: product.baseProduct.name,
          description: product.baseProduct.description,
          images: product.baseProduct.images,
          price: product.price,
          originalPrice: product.originalPrice,
          quantity: product.quantity,
          unit: product.baseProduct.unit,
          unitSize: product.baseProduct.unitSize,
          category: product.baseProduct.category,
          subcategory: product.baseProduct.subcategory,
          productType: 'maxalla',
        },
      });
    }

    // Sort: open stores first, then by name
    stores.sort((a, b) => {
      if (a.contragent.isOpen === b.contragent.isOpen) {
        return a.contragent.name.localeCompare(b.contragent.name);
      }
      if (a.contragent.isOpen === true) return -1;
      if (b.contragent.isOpen === true) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    console.error('Error fetching maxalla stores for product:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxalla dokonlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  getAllContragents,
  getContragentById,
  search,
  filterProducts,
  getAllMaxallaProducts,
  getMaxallaProductById,
  getMaxallaStoresForProduct,
};

