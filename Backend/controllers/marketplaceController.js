const Product = require('../models/Product');
const Category = require('../models/Category');
const Contragent = require('../models/Contragent');
const Region = require('../models/Region');

// Get all products for marketplace (without kpiBonusPercent)
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

    const filter = { status: 'active' }; // Only active products

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (contragent) {
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
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
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
      .populate('deliveryRegions.tuman', 'name type code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    // Remove kpiBonusPercent
    const productObj = product.toObject();
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

    const filter = {
      category: id,
      status: 'active',
    };

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (contragent) {
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

    // Get categories used by this contragent
    if (includeCategories === 'true') {
      const products = await Product.find({ contragent: id, status: 'active' })
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

    // Get products for this contragent
    if (includeProducts === 'true') {
      const products = await Product.find({ contragent: id, status: 'active' })
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

    // Search products
    const productFilter = {
      status: 'active',
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

    // Search contragents
    const contragentFilter = {
      status: 'active',
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

    const filter = { status: 'active' };

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Contragent filter
    if (contragent) {
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
      // Get all products for this contragent to extract categories and subcategories
      const contragentProducts = await Product.find({
        contragent: contragent,
        status: 'active',
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

    // Get available contragents if not filtered
    let availableContragents = [];
    if (!contragent) {
      const contragents = await Contragent.find({ status: 'active' })
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
};

