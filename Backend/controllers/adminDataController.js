const Category = require('../models/Category');
const Product = require('../models/Product');
const Contragent = require('../models/Contragent');
const Admin = require('../models/Admin');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');
const SmsVerification = require('../models/SmsVerification');
const VacancyApplicantCode = require('../models/VacancyApplicantCode');
const MarketplaceUser = require('../models/MarketplaceUser');
const Vacancy = require('../models/Vacancy');
const VacancyApplicant = require('../models/VacancyApplicant');
const VacancyApplication = require('../models/VacancyApplication');
const PartnershipRequest = require('../models/PartnershipRequest');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// Helper function removed - using Category.populate directly instead

// Get all categories with full details (for admin)
const getAllCategoriesForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 100, includeSubcategories } = req.query;
    const filter = { parent: null }; // Only top-level categories

    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Category.countDocuments(filter);

    // Get categories with pagination
    let query = Category.find(filter)
      .populate('parent', 'name slug status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    let categories = await query.exec();

    if (includeSubcategories === 'true') {
      categories = await Category.populate(categories, {
        path: 'subcategories',
        select: 'name slug status createdBy createdByModel createdAt updatedAt',
        populate: {
          path: 'createdBy',
          select: 'name username phone inn',
          options: { strictPopulate: false },
        },
      });
    }

    categories = await Category.populate(categories, {
      path: 'createdBy',
      select: 'name username phone inn',
      options: { strictPopulate: false },
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all subcategories with full details (for admin)
const getAllSubcategoriesForAdmin = async (req, res) => {
  try {
    const { status, parent, page = 1, limit = 100 } = req.query;
    const filter = { parent: { $ne: null } }; // Only subcategories

    if (status) {
      filter.status = status;
    }
    if (parent) {
      filter.parent = parent;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Category.countDocuments(filter);

    // Get subcategories with pagination
    let subcategories = await Category.find(filter)
      .populate('parent', 'name slug status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    subcategories = await Category.populate(subcategories, {
      path: 'createdBy',
      select: 'name username phone inn',
      options: { strictPopulate: false },
    });

    res.status(200).json({
      success: true,
      count: subcategories.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Sub kategoriyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all products with full details and advanced filters (for admin)
const getAllProductsForAdmin = async (req, res) => {
  try {
    const {
      status,
      category,
      subcategory,
      contragent,
      viloyat,
      tuman,
      mfy,
      minPrice,
      maxPrice,
      minQuantity,
      maxQuantity,
      unit,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Subcategory filter
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Contragent filter
    if (contragent) {
      filter.contragent = contragent;
    }

    // Delivery region filters
    if (viloyat) {
      filter['deliveryRegions.viloyat'] = viloyat;
    }

    if (tuman) {
      filter['deliveryRegions.tuman'] = tuman;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
      }
    }

    // Quantity range filter
    if (minQuantity || maxQuantity) {
      filter.quantity = {};
      if (minQuantity) {
        filter.quantity.$gte = parseFloat(minQuantity);
      }
      if (maxQuantity) {
        filter.quantity.$lte = parseFloat(maxQuantity);
      }
    }

    // Unit filter
    if (unit) {
      filter.unit = unit;
    }

    // Search filter (by name or product code)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Product.countDocuments(filter);

    // Get products with pagination and full population
    const products = await Product.find(filter)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy status',
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
    console.error('Error fetching products for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get product by ID with full details (for admin)
const getProductByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy status',
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

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product for admin:', error);

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

// Get category by ID with full details (for admin)
const getCategoryByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    let category = await Category.findById(id)
      .populate('parent', 'name slug status')
      .populate({
        path: 'subcategories',
        select: 'name slug status createdBy createdByModel createdAt updatedAt',
        populate: {
          path: 'createdBy',
          select: 'name username phone inn',
          options: { strictPopulate: false },
        },
      })
      .exec();

    category = await Category.populate(category, {
      path: 'createdBy',
      select: 'name username phone inn',
      options: { strictPopulate: false },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category for admin:', error);

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

// Get all SMS verifications with full details (for admin)
const getAllSmsVerificationsForAdmin = async (req, res) => {
  try {
    const {
      phone,
      type,
      purpose,
      isUsed,
      source,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filters for SmsVerification
    const smsFilter = {};
    if (phone) {
      smsFilter.phone = { $regex: phone, $options: 'i' };
    }
    if (type) {
      smsFilter.type = type;
    }
    if (isUsed !== undefined) {
      smsFilter.isUsed = isUsed === 'true';
    }
    if (startDate || endDate) {
      smsFilter.createdAt = {};
      if (startDate) {
        smsFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        smsFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Build filters for VacancyApplicantCode
    const vacancyFilter = {};
    if (phone) {
      vacancyFilter.phone = { $regex: phone, $options: 'i' };
    }
    if (purpose) {
      vacancyFilter.purpose = purpose;
    }
    // Map type to purpose for vacancy codes
    if (type && !purpose) {
      vacancyFilter.purpose = type;
    }
    if (startDate || endDate) {
      vacancyFilter.createdAt = {};
      if (startDate) {
        vacancyFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        vacancyFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get data from both models
    const [smsVerifications, vacancyCodes] = await Promise.all([
      source === 'vacancy' ? [] : SmsVerification.find(smsFilter).sort({ createdAt: -1 }),
      source === 'marketplace' ? [] : VacancyApplicantCode.find(vacancyFilter).sort({ createdAt: -1 }),
    ]);

    // Combine and format data
    const allCodes = [
      ...smsVerifications.map((item) => ({
        _id: item._id,
        phone: item.phone,
        code: item.code,
        type: item.type,
        purpose: item.type, // For compatibility
        isUsed: item.isUsed,
        expiresAt: item.expiresAt,
        source: 'marketplace',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      ...vacancyCodes.map((item) => ({
        _id: item._id,
        phone: item.phone,
        code: item.code,
        type: item.purpose, // For compatibility
        purpose: item.purpose,
        isUsed: false, // Vacancy codes don't have isUsed field
        expiresAt: item.expiresAt,
        source: 'vacancy',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    ];

    // Sort by createdAt descending
    allCodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get total count
    const total = allCodes.length;

    // Apply pagination
    const paginatedCodes = allCodes.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedCodes.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: paginatedCodes,
    });
  } catch (error) {
    console.error('Error fetching SMS verifications for admin:', error);
    res.status(500).json({
      success: false,
      message: 'SMS ma\'lumotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get SMS verification by ID (for admin)
const getSmsVerificationByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const smsVerification = await SmsVerification.findById(id);

    if (!smsVerification) {
      return res.status(404).json({
        success: false,
        message: 'SMS ma\'lumoti topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: smsVerification,
    });
  } catch (error) {
    console.error('Error fetching SMS verification for admin:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri SMS ma\'lumot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'SMS ma\'lumotini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all marketplace users (for admin)
const getAllMarketplaceUsersForAdmin = async (req, res) => {
  try {
    const {
      status,
      viloyat,
      tuman,
      mfy,
      isPhoneVerified,
      gender,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Region filters
    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    // Phone verification filter
    if (isPhoneVerified !== undefined) {
      filter.isPhoneVerified = isPhoneVerified === 'true';
    }

    // Gender filter
    if (gender) {
      filter.gender = gender;
    }

    // Search filter (by firstName, lastName, or phone)
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await MarketplaceUser.countDocuments(filter);

    // Get marketplace users with pagination
    const users = await MarketplaceUser.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error) {
    console.error('Error fetching marketplace users for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchilarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get marketplace user by ID (for admin)
const getMarketplaceUserByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await MarketplaceUser.findById(id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching marketplace user for admin:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri foydalanuvchi ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Foydalanuvchini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all orders with full details and advanced filters (for admin)
const getAllOrdersForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      user,
      orderNumber,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // User filter
    if (user) {
      filter.user = user;
    }

    // Order number filter
    if (orderNumber) {
      filter.orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Total price range filter
    if (minTotalPrice || maxTotalPrice) {
      filter.totalPrice = {};
      if (minTotalPrice) {
        filter.totalPrice.$gte = parseFloat(minTotalPrice);
      }
      if (maxTotalPrice) {
        filter.totalPrice.$lte = parseFloat(maxTotalPrice);
      }
    }

    // Search filter (by order number or phone number)
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders with pagination and full population
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
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
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          {
            path: 'category',
            select: 'name slug status',
          },
          {
            path: 'subcategory',
            select: 'name slug status',
          },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
          {
            path: 'deliveryRegions.viloyat',
            select: 'name type code',
          },
          {
            path: 'deliveryRegions.tuman',
            select: 'name type code',
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'confirmedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'assignedToAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'punktRequests.punktId', select: 'name phone viloyat tuman' },
        { path: 'contragentRequests.contragentId', select: 'name inn phone viloyat tuman mfy' },
        { path: 'punktToPunktRequests.fromPunktId', select: 'name phone viloyat tuman' },
        { path: 'punktToPunktRequests.toPunktId', select: 'name phone viloyat tuman' },
        { path: 'currentPunkt', select: 'name phone viloyat tuman' },
        { path: 'confirmedByAgent', select: 'name phone viloyat tuman mfy' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from product objects
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return {
            ...item,
            product: productObj,
          };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching orders for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID with full details (for admin)
const getOrderByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
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
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          {
            path: 'category',
            select: 'name slug status',
          },
          {
            path: 'subcategory',
            select: 'name slug status',
          },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
          {
            path: 'deliveryRegions.viloyat',
            select: 'name type code',
          },
          {
            path: 'deliveryRegions.tuman',
            select: 'name type code',
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'confirmedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'assignedToAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'punktRequests.punktId', select: 'name phone viloyat tuman' },
        { path: 'contragentRequests.contragentId', select: 'name inn phone viloyat tuman mfy' },
        { path: 'punktToPunktRequests.fromPunktId', select: 'name phone viloyat tuman' },
        { path: 'punktToPunktRequests.toPunktId', select: 'name phone viloyat tuman' },
        { path: 'currentPunkt', select: 'name phone viloyat tuman' },
        { path: 'confirmedByAgent', select: 'name phone viloyat tuman mfy' },
      ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Remove kpiBonusPercent from product objects
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.map((item) => {
      if (item.product) {
        const productObj = item.product.toObject ? item.product.toObject() : item.product;
        delete productObj.kpiBonusPercent;
        return {
          ...item,
          product: productObj,
        };
      }
      return item;
    });

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error('Error fetching order for admin:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get marketplace orders (yangi buyurtmalar)
const getMarketplaceOrdersForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      status: { $ne: 'cancelled' }, // Cancelled buyurtmalar kiritilmaydi
    };

    // Additional filters
    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders with pagination and full population
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
          {
            path: 'deliveryRegions.viloyat',
            select: 'name type code',
          },
          {
            path: 'deliveryRegions.tuman',
            select: 'name type code',
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'confirmedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'assignedToAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
        { path: 'punktRequests.punktId', select: 'name phone viloyat tuman' },
        { path: 'contragentRequests.contragentId', select: 'name inn phone viloyat tuman mfy' },
        { path: 'punktToPunktRequests.fromPunktId', select: 'name phone viloyat tuman' },
        { path: 'punktToPunktRequests.toPunktId', select: 'name phone viloyat tuman' },
        { path: 'currentPunkt', select: 'name phone viloyat tuman' },
        { path: 'confirmedByAgent', select: 'name phone viloyat tuman mfy' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from product objects
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return {
            ...item,
            product: productObj,
          };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching marketplace orders for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get orders delivered to punkt (punktga yuborilgan)
const getOrdersDeliveredToPunktForAdmin = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      'contragentRequests.status': 'delivered_to_punkt',
    };

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter['contragentRequests.deliveredToPunktAt'] = {};
      if (startDate) {
        filter['contragentRequests.deliveredToPunktAt'].$gte = new Date(startDate);
      }
      if (endDate) {
        filter['contragentRequests.deliveredToPunktAt'].$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'currentPunkt', select: 'name phone viloyat tuman' },
        { path: 'contragentRequests.contragentId', select: 'name inn phone viloyat tuman mfy' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Filter and format contragentRequests
    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.status === 'delivered_to_punkt'
      );
      // Remove kpiBonusPercent
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return { ...item, product: productObj };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: formattedOrders,
    });
  } catch (error) {
    console.error('Error fetching orders delivered to punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get orders assigned to agents (agentga yuborilgan)
const getOrdersAssignedToAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      assignedToAgent: { $ne: null },
    };

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.assignedAt = {};
      if (startDate) {
        filter.assignedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.assignedAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'assignedToAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
      ])
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return { ...item, product: productObj };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching orders assigned to agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get orders confirmed by agents (agent topshirgan buyurtmalar)
const getOrdersConfirmedByAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      confirmedByAgent: { $ne: null },
    };

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.agentConfirmedAt = {};
      if (startDate) {
        filter.agentConfirmedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.agentConfirmedAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'confirmedByAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
      ])
      .sort({ agentConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return { ...item, product: productObj };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching orders confirmed by agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get orders confirmed by customers (foydalanuvchi qabul qilgan buyurtmalar)
const getOrdersConfirmedByCustomersForAdmin = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      customerConfirmed: true,
    };

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.customerConfirmedAt = {};
      if (startDate) {
        filter.customerConfirmedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.customerConfirmedAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
        { path: 'confirmedByAgent', select: 'name phone viloyat tuman mfy' },
        { path: 'assignedByPunkt', select: 'name phone viloyat tuman' },
      ])
      .sort({ customerConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return { ...item, product: productObj };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching orders confirmed by customers:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get cancelled orders (qaytarilgan buyurtmalar)
const getCancelledOrdersForAdmin = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      status: 'cancelled',
    };

    // Date range filter
    if (startDate || endDate) {
      filter.updatedAt = {};
      if (startDate) {
        filter.updatedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.updatedAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate({
        path: 'items.product',
        select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions productCode',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy status',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
      ])
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          const productObj = item.product.toObject ? item.product.toObject() : item.product;
          delete productObj.kpiBonusPercent;
          return { ...item, product: productObj };
        }
        return item;
      });
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching cancelled orders:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== SALES STATISTICS ====================

// Helper function for date range
const parseDateRangeForStats = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

// Get sales statistics by all viloyats
const getSalesStatsByViloyats = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const matchFilter = {};
    
    // Only confirmed orders by default
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$deliveryViloyat',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate viloyat names
    const viloyatIds = stats.map((s) => s._id).filter(Boolean);
    const viloyats = await Region.find({ _id: { $in: viloyatIds } }).select('name code');
    const viloyatMap = {};
    viloyats.forEach((v) => {
      viloyatMap[v._id.toString()] = v;
    });

    const result = stats.map((stat) => ({
      viloyat: stat._id ? viloyatMap[stat._id.toString()] || { _id: stat._id } : null,
      totalOrders: stat.totalOrders,
      totalRevenue: Math.round(stat.totalRevenue),
      totalItems: stat.totalItems,
      avgOrderValue: Math.round(stat.avgOrderValue),
    }));

    // Calculate totals
    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales stats by viloyats:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyatlar bo\'yicha statistikani olishda xatolik',
      error: error.message,
    });
  }
};

// Get sales statistics by tumans (optionally filtered by viloyat)
const getSalesStatsByTumans = async (req, res) => {
  try {
    const { viloyatId, startDate, endDate, status } = req.query;

    const matchFilter = {};
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    if (viloyatId) {
      matchFilter.deliveryViloyat = new mongoose.Types.ObjectId(viloyatId);
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { viloyat: '$deliveryViloyat', tuman: '$deliveryTuman' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate region names
    const viloyatIds = [...new Set(stats.map((s) => s._id.viloyat).filter(Boolean))];
    const tumanIds = [...new Set(stats.map((s) => s._id.tuman).filter(Boolean))];
    
    const [viloyats, tumans] = await Promise.all([
      Region.find({ _id: { $in: viloyatIds } }).select('name code'),
      Region.find({ _id: { $in: tumanIds } }).select('name code parent'),
    ]);

    const viloyatMap = {};
    viloyats.forEach((v) => { viloyatMap[v._id.toString()] = v; });
    const tumanMap = {};
    tumans.forEach((t) => { tumanMap[t._id.toString()] = t; });

    const result = stats.map((stat) => ({
      viloyat: stat._id.viloyat ? viloyatMap[stat._id.viloyat.toString()] || { _id: stat._id.viloyat } : null,
      tuman: stat._id.tuman ? tumanMap[stat._id.tuman.toString()] || { _id: stat._id.tuman } : null,
      totalOrders: stat.totalOrders,
      totalRevenue: Math.round(stat.totalRevenue),
      totalItems: stat.totalItems,
      avgOrderValue: Math.round(stat.avgOrderValue),
    }));

    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales stats by tumans:', error);
    res.status(500).json({
      success: false,
      message: 'Tumanlar bo\'yicha statistikani olishda xatolik',
      error: error.message,
    });
  }
};

// Get sales statistics by MFYs (optionally filtered by viloyat/tuman)
const getSalesStatsByMfys = async (req, res) => {
  try {
    const { viloyatId, tumanId, startDate, endDate, status } = req.query;

    const matchFilter = {};
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    if (viloyatId) {
      matchFilter.deliveryViloyat = new mongoose.Types.ObjectId(viloyatId);
    }
    if (tumanId) {
      matchFilter.deliveryTuman = new mongoose.Types.ObjectId(tumanId);
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { viloyat: '$deliveryViloyat', tuman: '$deliveryTuman', mfy: '$deliveryMfy' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate region names
    const viloyatIds = [...new Set(stats.map((s) => s._id.viloyat).filter(Boolean))];
    const tumanIds = [...new Set(stats.map((s) => s._id.tuman).filter(Boolean))];
    const mfyIds = [...new Set(stats.map((s) => s._id.mfy).filter(Boolean))];
    
    const [viloyats, tumans, mfys] = await Promise.all([
      Region.find({ _id: { $in: viloyatIds } }).select('name code'),
      Region.find({ _id: { $in: tumanIds } }).select('name code'),
      Region.find({ _id: { $in: mfyIds } }).select('name code'),
    ]);

    const viloyatMap = {};
    viloyats.forEach((v) => { viloyatMap[v._id.toString()] = v; });
    const tumanMap = {};
    tumans.forEach((t) => { tumanMap[t._id.toString()] = t; });
    const mfyMap = {};
    mfys.forEach((m) => { mfyMap[m._id.toString()] = m; });

    const result = stats.map((stat) => ({
      viloyat: stat._id.viloyat ? viloyatMap[stat._id.viloyat.toString()] || { _id: stat._id.viloyat } : null,
      tuman: stat._id.tuman ? tumanMap[stat._id.tuman.toString()] || { _id: stat._id.tuman } : null,
      mfy: stat._id.mfy ? mfyMap[stat._id.mfy.toString()] || { _id: stat._id.mfy } : null,
      totalOrders: stat.totalOrders,
      totalRevenue: Math.round(stat.totalRevenue),
      totalItems: stat.totalItems,
      avgOrderValue: Math.round(stat.avgOrderValue),
    }));

    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales stats by mfys:', error);
    res.status(500).json({
      success: false,
      message: 'MFYlar bo\'yicha statistikani olishda xatolik',
      error: error.message,
    });
  }
};

// Get detailed sales statistics for a specific viloyat
const getSalesStatsByViloyatId = async (req, res) => {
  try {
    const { viloyatId } = req.params;
    const { startDate, endDate, status, groupBy = 'tuman' } = req.query;

    const matchFilter = {
      deliveryViloyat: new mongoose.Types.ObjectId(viloyatId),
    };
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    // Get viloyat info
    const viloyat = await Region.findById(viloyatId).select('name code');

    let groupField = '$deliveryTuman';
    if (groupBy === 'mfy') groupField = '$deliveryMfy';
    if (groupBy === 'day') groupField = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupField,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: groupBy === 'day' ? { _id: 1 } : { totalRevenue: -1 } },
    ]);

    let result;
    if (groupBy === 'day') {
      result = stats.map((stat) => ({
        date: stat._id,
        totalOrders: stat.totalOrders,
        totalRevenue: Math.round(stat.totalRevenue),
        totalItems: stat.totalItems,
        avgOrderValue: Math.round(stat.avgOrderValue),
      }));
    } else {
      const regionIds = stats.map((s) => s._id).filter(Boolean);
      const regions = await Region.find({ _id: { $in: regionIds } }).select('name code');
      const regionMap = {};
      regions.forEach((r) => { regionMap[r._id.toString()] = r; });

      result = stats.map((stat) => ({
        [groupBy]: stat._id ? regionMap[stat._id.toString()] || { _id: stat._id } : null,
        totalOrders: stat.totalOrders,
        totalRevenue: Math.round(stat.totalRevenue),
        totalItems: stat.totalItems,
        avgOrderValue: Math.round(stat.avgOrderValue),
      }));
    }

    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      viloyat,
      groupBy,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching viloyat sales stats:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat statistikasini olishda xatolik',
      error: error.message,
    });
  }
};

// Get detailed sales statistics for a specific tuman
const getSalesStatsByTumanId = async (req, res) => {
  try {
    const { tumanId } = req.params;
    const { startDate, endDate, status, groupBy = 'mfy' } = req.query;

    const matchFilter = {
      deliveryTuman: new mongoose.Types.ObjectId(tumanId),
    };
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    // Get tuman info with parent viloyat
    const tuman = await Region.findById(tumanId).select('name code parent').populate('parent', 'name code');

    let groupField = '$deliveryMfy';
    if (groupBy === 'day') groupField = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupField,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: groupBy === 'day' ? { _id: 1 } : { totalRevenue: -1 } },
    ]);

    let result;
    if (groupBy === 'day') {
      result = stats.map((stat) => ({
        date: stat._id,
        totalOrders: stat.totalOrders,
        totalRevenue: Math.round(stat.totalRevenue),
        totalItems: stat.totalItems,
        avgOrderValue: Math.round(stat.avgOrderValue),
      }));
    } else {
      const mfyIds = stats.map((s) => s._id).filter(Boolean);
      const mfys = await Region.find({ _id: { $in: mfyIds } }).select('name code');
      const mfyMap = {};
      mfys.forEach((m) => { mfyMap[m._id.toString()] = m; });

      result = stats.map((stat) => ({
        mfy: stat._id ? mfyMap[stat._id.toString()] || { _id: stat._id } : null,
        totalOrders: stat.totalOrders,
        totalRevenue: Math.round(stat.totalRevenue),
        totalItems: stat.totalItems,
        avgOrderValue: Math.round(stat.avgOrderValue),
      }));
    }

    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      tuman,
      groupBy,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching tuman sales stats:', error);
    res.status(500).json({
      success: false,
      message: 'Tuman statistikasini olishda xatolik',
      error: error.message,
    });
  }
};

// Get detailed sales statistics for a specific MFY
const getSalesStatsByMfyId = async (req, res) => {
  try {
    const { mfyId } = req.params;
    const { startDate, endDate, status, groupBy = 'day' } = req.query;

    const matchFilter = {
      deliveryMfy: new mongoose.Types.ObjectId(mfyId),
    };
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    // Get MFY info with parent hierarchy
    const mfy = await Region.findById(mfyId).select('name code parent').populate({
      path: 'parent',
      select: 'name code parent',
      populate: { path: 'parent', select: 'name code' },
    });

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = stats.map((stat) => ({
      date: stat._id,
      totalOrders: stat.totalOrders,
      totalRevenue: Math.round(stat.totalRevenue),
      totalItems: stat.totalItems,
      avgOrderValue: Math.round(stat.avgOrderValue),
    }));

    const totals = result.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.totalOrders,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalItems: acc.totalItems + curr.totalItems,
      }),
      { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
    );

    res.status(200).json({
      success: true,
      mfy,
      count: result.length,
      totals,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching MFY sales stats:', error);
    res.status(500).json({
      success: false,
      message: 'MFY statistikasini olishda xatolik',
      error: error.message,
    });
  }
};

// Get overall sales statistics summary
const getSalesStatsSummary = async (req, res) => {
  try {
    const { startDate, endDate, viloyatId, tumanId, mfyId, status } = req.query;

    const matchFilter = {};
    
    if (status) {
      matchFilter.status = status;
    } else {
      matchFilter.status = 'confirmed_by_customer';
    }

    if (viloyatId) matchFilter.deliveryViloyat = new mongoose.Types.ObjectId(viloyatId);
    if (tumanId) matchFilter.deliveryTuman = new mongoose.Types.ObjectId(tumanId);
    if (mfyId) matchFilter.deliveryMfy = new mongoose.Types.ObjectId(mfyId);

    const dateFilter = parseDateRangeForStats(startDate, endDate);
    if (dateFilter.createdAt) matchFilter.createdAt = dateFilter.createdAt;

    // Get overall stats
    const overallStats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
          minOrderValue: { $min: '$totalPrice' },
          maxOrderValue: { $max: '$totalPrice' },
        },
      },
    ]);

    // Get daily stats for chart
    const dailyStats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get status breakdown
    const statusMatchFilter = { ...matchFilter };
    delete statusMatchFilter.status;
    
    const statusBreakdown = await Order.aggregate([
      { $match: statusMatchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const overall = overallStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalItems: 0,
      avgOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: overall.totalOrders,
          totalRevenue: Math.round(overall.totalRevenue),
          totalItems: overall.totalItems,
          avgOrderValue: Math.round(overall.avgOrderValue),
          minOrderValue: Math.round(overall.minOrderValue || 0),
          maxOrderValue: Math.round(overall.maxOrderValue || 0),
        },
        dailyStats: dailyStats.map((d) => ({
          date: d._id,
          totalOrders: d.totalOrders,
          totalRevenue: Math.round(d.totalRevenue),
        })),
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s._id,
          count: s.count,
          revenue: Math.round(s.revenue),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Umumiy statistikani olishda xatolik',
      error: error.message,
    });
  }
};

// Admin dashboard overview (cards + latest items)
const getAdminDashboardOverview = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      ordersTotalAgg,
      ordersTodayAgg,
      ordersMonthAgg,
      totalMarketplaceUsers,
      totalContragents,
      totalPunkts,
      totalAgents,
      totalProducts,
      totalCategories,
      totalVacancies,
      totalVacancyApplicants,
      totalVacancyApplications,
      totalAdmins,
      openPartnershipRequests,
      latestOrders,
      latestVacancies,
      latestApplications,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer' } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalItems: { $sum: '$itemCount' },
            avgOrderValue: { $avg: '$totalPrice' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      MarketplaceUser.countDocuments(),
      Contragent.countDocuments(),
      Punkt.countDocuments(),
      Agent.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Vacancy.countDocuments(),
      VacancyApplicant.countDocuments(),
      VacancyApplication.countDocuments(),
      Admin.countDocuments(),
      PartnershipRequest.countDocuments({ contactStatus: { $ne: 'done' } }),
      Order.find({})
        .select('orderNumber totalPrice status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Vacancy.find({})
        .select('name target type createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      VacancyApplication.find({})
        .select('vacancy applicant status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vacancy', 'name target type')
        .populate('applicant', 'firstName lastName phone')
        .lean(),
    ]);

    const total = ordersTotalAgg[0] || { totalOrders: 0, totalRevenue: 0, totalItems: 0, avgOrderValue: 0 };
    const today = ordersTodayAgg[0] || { totalOrders: 0, totalRevenue: 0 };
    const month = ordersMonthAgg[0] || { totalOrders: 0, totalRevenue: 0 };

    res.status(200).json({
      success: true,
      data: {
        cards: {
          orders: total.totalOrders,
          revenue: Math.round(total.totalRevenue || 0),
          products: totalProducts,
          categories: totalCategories,
          marketplaceUsers: totalMarketplaceUsers,
          contragents: totalContragents,
          punkts: totalPunkts,
          agents: totalAgents,
          admins: totalAdmins,
          vacancies: totalVacancies,
          vacancyApplicants: totalVacancyApplicants,
          vacancyApplications: totalVacancyApplications,
          openPartnershipRequests,
          avgOrderValue: Math.round(total.avgOrderValue || 0),
        },
        period: {
          today: {
            orders: today.totalOrders || 0,
            revenue: Math.round(today.totalRevenue || 0),
          },
          month: {
            orders: month.totalOrders || 0,
            revenue: Math.round(month.totalRevenue || 0),
          },
        },
        latest: {
          orders: latestOrders,
          vacancies: latestVacancies,
          vacancyApplications: latestApplications,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get agents in admin's region (o'z hududidagi agentlar)
const getAgentsInRegion = async (req, res) => {
  try {
    const { viloyat, tuman, agentType, status, page = 1, limit = 50 } = req.query;

    const filter = {};

    // Filter by viloyat
    if (viloyat) {
      filter.viloyat = viloyat;
    }

    // Filter by tuman
    if (tuman) {
      filter.tuman = tuman;
    }

    // Filter by agent type
    if (agentType) {
      if (agentType === 'mfy') {
        filter.mfy = { $exists: true, $ne: null };
      } else if (agentType === 'tuman') {
        filter.tuman = { $exists: true, $ne: null };
        filter.mfy = null;
      } else if (agentType === 'viloyat') {
        filter.viloyat = { $exists: true, $ne: null };
        filter.tuman = null;
        filter.mfy = null;
      }
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Agent.countDocuments(filter);

    const agents = await Agent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: agents.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: agents,
    });
  } catch (error) {
    console.error('Error fetching agents in region:', error);
    res.status(500).json({
      success: false,
      message: 'Agentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkts in admin's region (o'z hududidagi punktlar)
const getPunktsInRegion = async (req, res) => {
  try {
    const { viloyat, tuman, status, page = 1, limit = 50 } = req.query;

    const filter = {};

    // Filter by viloyat
    if (viloyat) {
      filter.viloyat = viloyat;
    }

    // Filter by tuman
    if (tuman) {
      filter.tuman = tuman;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Punkt.countDocuments(filter);

    const punkts = await Punkt.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: punkts.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: punkts,
    });
  } catch (error) {
    console.error('Error fetching punkts in region:', error);
    res.status(500).json({
      success: false,
      message: 'Punktlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategoriesForAdmin,
  getAllSubcategoriesForAdmin,
  getAllProductsForAdmin,
  getProductByIdForAdmin,
  getCategoryByIdForAdmin,
  getAllSmsVerificationsForAdmin,
  getSmsVerificationByIdForAdmin,
  getAllMarketplaceUsersForAdmin,
  getMarketplaceUserByIdForAdmin,
  getAllOrdersForAdmin,
  getOrderByIdForAdmin,
  getMarketplaceOrdersForAdmin,
  getOrdersDeliveredToPunktForAdmin,
  getOrdersAssignedToAgentsForAdmin,
  getAgentsInRegion,
  getPunktsInRegion,
  getOrdersConfirmedByAgentsForAdmin,
  getOrdersConfirmedByCustomersForAdmin,
  getCancelledOrdersForAdmin,
  // Sales Statistics
  getSalesStatsByViloyats,
  getSalesStatsByTumans,
  getSalesStatsByMfys,
  getSalesStatsByViloyatId,
  getSalesStatsByTumanId,
  getSalesStatsByMfyId,
  getSalesStatsSummary,
  getAdminDashboardOverview,
  getAgentsInRegion,
  getPunktsInRegion,
};

