const Category = require('../models/Category');
const Product = require('../models/Product');
const Contragent = require('../models/Contragent');
const Admin = require('../models/Admin');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');
const SmsVerification = require('../models/SmsVerification');
const MarketplaceUser = require('../models/MarketplaceUser');
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

    // Get data from SmsVerification model
    const smsVerifications = await SmsVerification.find(smsFilter).sort({ createdAt: -1 });

    // Format data
    const allCodes = smsVerifications.map((item) => ({
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
    }));

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

// Helper function to calculate order statistics
const calculateOrderStatistics = async (filter) => {
  // Ensure only tuman orders are included (and old orders without orderType)
  const finalFilter = {
    ...filter,
    $or: [
      { orderType: 'tuman' },
      { orderType: { $exists: false } }, // Old orders without orderType field
    ],
  };
  const stats = await Order.aggregate([
    { $match: finalFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalPrice: { $sum: '$totalPrice' },
        totalOriginalPrice: { $sum: '$totalOriginalPrice' },
        totalKpiPrice: { $sum: '$totalKpiPrice' },
        totalItems: { $sum: '$itemCount' },
        avgOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalPrice: 0,
    totalOriginalPrice: 0,
    totalKpiPrice: 0,
    totalItems: 0,
    avgOrderValue: 0,
  };
};

// Helper function to populate order with all details
const populateOrderDetails = (query) => {
  return query
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
        { path: 'deliveryRegions.viloyat', select: 'name type code' },
        { path: 'deliveryRegions.tuman', select: 'name type code' },
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
};

// Helper function to determine order workflow stage (buyurtma qayerda to'xtaganini aniqlash)
const getOrderWorkflowStage = (order) => {
  const orderObj = order.toObject ? order.toObject() : (order._doc ? order._doc : order);
  
  // Cancelled orders
  if (orderObj.status === 'cancelled') {
    return {
      stage: 'cancelled',
      stageName: 'Bekor qilingan',
      description: 'Buyurtma bekor qilingan',
      canProceed: false,
    };
  }
  
  // Customer confirmed
  if (orderObj.customerConfirmed) {
    return {
      stage: 'completed',
      stageName: 'Yakunlangan',
      description: 'Mijoz buyurtmani qabul qilgan',
      canProceed: false,
    };
  }
  
  // Agent confirmed
  if (orderObj.confirmedByAgent) {
    return {
      stage: 'waiting_customer_confirmation',
      stageName: 'Mijoz tasdiqlashini kutmoqda',
      description: 'Agent buyurtmani yetkazgan, mijoz tasdiqlashini kutmoqda',
      canProceed: true,
      nextAction: 'Mijoz tasdiqlashi kerak',
    };
  }
  
  // Assigned to agent
  if (orderObj.assignedToAgent) {
    return {
      stage: 'assigned_to_agent',
      stageName: 'Agentga yuborilgan',
      description: 'Buyurtma agentga yuborilgan, yetkazish kutilmoqda',
      canProceed: true,
      nextAction: 'Agent yetkazishi kerak',
    };
  }
  
  // Check if contragents delivered to punkt
  const hasDeliveredContragents = orderObj.contragentRequests && 
    orderObj.contragentRequests.some(req => req.status === 'delivered_to_punkt');
  
  if (hasDeliveredContragents) {
    return {
      stage: 'ready_for_agent',
      stageName: 'Agentga yuborishga tayyor',
      description: 'Barcha mahsulotlar punktga yetkazilgan, agentga yuborish mumkin',
      canProceed: true,
      nextAction: 'Punkt agentga yuborishi kerak',
    };
  }
  
  // Check if contragents accepted
  const hasAcceptedContragents = orderObj.contragentRequests && 
    orderObj.contragentRequests.some(req => req.status === 'accepted');
  
  if (hasAcceptedContragents) {
    return {
      stage: 'contragent_preparing',
      stageName: 'Kontragent tayyorlamoqda',
      description: 'Kontragent mahsulotni tayyorlamoqda',
      canProceed: true,
      nextAction: 'Kontragent punktga yetkazishi kerak',
    };
  }
  
  // Check if contragents requested
  const hasPendingContragents = orderObj.contragentRequests && 
    orderObj.contragentRequests.some(req => req.status === 'pending');
  
  if (hasPendingContragents) {
    return {
      stage: 'waiting_contragent_response',
      stageName: 'Kontragent javobini kutmoqda',
      description: 'Kontragentlarga so\'rov yuborilgan, javob kutilmoqda',
      canProceed: true,
      nextAction: 'Kontragent javob berishi kerak',
    };
  }
  
  // Check if punkt-to-punkt requests exist
  const hasPunktRequests = orderObj.punktToPunktRequests && 
    orderObj.punktToPunktRequests.length > 0;
  
  if (hasPunktRequests) {
    const pendingPunktRequest = orderObj.punktToPunktRequests.find(req => req.status === 'pending');
    if (pendingPunktRequest) {
      return {
        stage: 'waiting_punkt_response',
        stageName: 'Punkt javobini kutmoqda',
        description: 'Boshqa punktga so\'rov yuborilgan, javob kutilmoqda',
        canProceed: true,
        nextAction: 'Punkt javob berishi kerak',
      };
    }
    
    const acceptedPunktRequest = orderObj.punktToPunktRequests.find(req => req.status === 'accepted');
    if (acceptedPunktRequest) {
      return {
        stage: 'punkt_processing',
        stageName: 'Punkt ishlayapti',
        description: 'Punkt buyurtmani qabul qilgan va ishlayapti',
        canProceed: true,
        nextAction: 'Punkt kontragentlarga so\'rov yuborishi kerak',
      };
    }
  }
  
  // Punkt confirmed but nothing done
  if (orderObj.confirmedByPunkt) {
    return {
      stage: 'punkt_confirmed',
      stageName: 'Punkt tasdiqlagan',
      description: 'Punkt buyurtmani tasdiqlagan, keyingi qadamni kutmoqda',
      canProceed: true,
      nextAction: 'Punkt kontragentlarga so\'rov yuborishi yoki boshqa punktga yuborishi kerak',
    };
  }
  
  // Marketplace order - not confirmed by punkt
  if (orderObj.currentPunkt) {
    return {
      stage: 'assigned_to_punkt',
      stageName: 'Punktga biriktirilgan',
      description: 'Buyurtma punktga biriktirilgan, punkt tasdiqlashini kutmoqda',
      canProceed: true,
      nextAction: 'Punkt buyurtmani tasdiqlashi kerak',
    };
  }
  
  // New order
  return {
    stage: 'new_order',
    stageName: 'Yangi buyurtma',
    description: 'Yangi buyurtma, punktga biriktirilishi kerak',
    canProceed: true,
    nextAction: 'Punktga biriktirilishi kerak',
  };
};

// Helper function to remove kpiBonusPercent from orders and add workflow stage
const removeKpiFromOrders = (orders) => {
  return orders.map((order) => {
    // Handle both Mongoose documents and plain objects
    const orderObj = order.toObject ? order.toObject() : (order._doc ? order._doc : order);
    
    // Ensure items is an array
    if (!orderObj.items || !Array.isArray(orderObj.items)) {
      // Add workflow stage even if no items
      orderObj.workflowStage = getOrderWorkflowStage(order);
      return orderObj;
    }
    
    orderObj.items = orderObj.items.map((item) => {
      if (item.product) {
        // Handle both Mongoose documents and plain objects
        const productObj = item.product.toObject ? item.product.toObject() : (item.product._doc ? item.product._doc : item.product);
        delete productObj.kpiBonusPercent;
        return { ...item, product: productObj };
      }
      return item;
    });
    
    // Add workflow stage information
    orderObj.workflowStage = getOrderWorkflowStage(order);
    
    return orderObj;
  });
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

    // Add orderType filter (includes old orders without orderType field)
    // Use $and to combine with existing $or if present
    const orderTypeCondition = {
      $or: [
        { orderType: 'tuman' },
        { orderType: { $exists: false } }, // Old orders without orderType field
      ],
    };
    
    if (filter.$or) {
      // If $or already exists, use $and to combine
      const existingOr = filter.$or;
      delete filter.$or;
      filter.$and = [
        { $or: existingOr },
        orderTypeCondition,
      ];
    } else {
      // If no $or, add orderType condition directly
      filter.$or = orderTypeCondition.$or;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Calculate statistics
    const statistics = await calculateOrderStatistics(filter);

    // Get orders with pagination and full population
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from product objects
    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
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

    const order = await populateOrderDetails(Order.findById(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Remove kpiBonusPercent from product objects
    const ordersWithoutKpi = removeKpiFromOrders([order]);
    const orderObj = ordersWithoutKpi[0];

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

// ==================== TUMAN KONTRAGENTLARI SOTUVI ====================

// Helper function to build base filter for tuman orders
const buildTumanOrderFilter = (additionalFilter = {}) => {
  return {
    ...additionalFilter,
    $or: [
      { orderType: 'tuman' },
      { orderType: { $exists: false } }, // Old orders without orderType field
    ],
    // Exclude MaxallaProduct orders
    items: { $not: { $elemMatch: { productType: 'maxalla' } } },
  };
};

// Helper function to add common filters to order filter
const addCommonFilters = (filter, query) => {
  const {
    status,
    paymentStatus,
    paymentMethod,
    orderNumber,
    user,
    startDate,
    endDate,
    minTotalPrice,
    maxTotalPrice,
    search,
  } = query;

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (user) filter.user = user;
  if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

  if (startDate || endDate) {
    filter.createdAt = filter.createdAt || {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (minTotalPrice || maxTotalPrice) {
    filter.totalPrice = filter.totalPrice || {};
    if (minTotalPrice) filter.totalPrice.$gte = parseFloat(minTotalPrice);
    if (maxTotalPrice) filter.totalPrice.$lte = parseFloat(maxTotalPrice);
  }

  if (search) {
    const searchCondition = {
      $or: [
        { orderNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ],
    };
    if (filter.$and) {
      filter.$and.push(searchCondition);
    } else {
      filter.$and = [searchCondition];
    }
  }

  return filter;
};

// Get all tuman orders (barcha tuman buyurtmalari)
const getAllTumanOrdersForAdmin = async (req, res) => {
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

    const filter = buildTumanOrderFilter();

    // Additional filters
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (user) filter.user = user;
    if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Total price range filter
    if (minTotalPrice || maxTotalPrice) {
      filter.totalPrice = {};
      if (minTotalPrice) filter.totalPrice.$gte = parseFloat(minTotalPrice);
      if (maxTotalPrice) filter.totalPrice.$lte = parseFloat(maxTotalPrice);
    }

    // Search filter
    if (search) {
      const searchCondition = {
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ],
      };
      if (filter.$and) {
        filter.$and.push(searchCondition);
      } else {
        filter.$and = [searchCondition];
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching all tuman orders:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders from marketplace (marketplace dan buyurilgan)
const getTumanOrdersFromMarketplaceForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      status: { $ne: 'cancelled' },
      confirmedByPunkt: null, // Punkt qabul qilmagan
    });

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders from marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by punkt (punkt qabul qilgan)
const getTumanOrdersConfirmedByPunktForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      confirmedByPunkt: { $ne: null },
      assignedToAgent: null,
    });

    addCommonFilters(filter, req.query);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all matching orders first (for filtering contragentRequests)
    let allOrders = await Order.find(filter).lean();
    
    // Filter: contragentRequests bo'sh yoki hammasi pending/rejected
    allOrders = allOrders.filter((order) => {
      if (!order.contragentRequests || order.contragentRequests.length === 0) {
        return true;
      }
      return order.contragentRequests.every(
        (req) => req.status === 'pending' || req.status === 'rejected'
      );
    });

    const total = allOrders.length;
    const orderIds = allOrders.map(o => o._id);
    const statistics = orderIds.length > 0 
      ? await calculateOrderStatistics({ _id: { $in: orderIds } })
      : await calculateOrderStatistics({ _id: { $in: [] } });

    const paginatedOrderIds = orderIds.slice(skip, skip + limitNum);
    const orders = await populateOrderDetails(Order.find({ _id: { $in: paginatedOrderIds } }))
      .sort({ createdAt: -1 });

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders confirmed by punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders requested to contragents (kontragentlarga yuborilgan)
const getTumanOrdersRequestedToContragentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      'contragentRequests.status': { $in: ['pending', 'accepted'] },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for contragentRequests
    if (startDate || endDate) {
      filter['contragentRequests.requestedAt'] = {};
      if (startDate) filter['contragentRequests.requestedAt'].$gte = new Date(startDate);
      if (endDate) filter['contragentRequests.requestedAt'].$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.status === 'pending' || req.status === 'accepted'
      );
      return orderObj;
    });

    const ordersWithoutKpi = removeKpiFromOrders(formattedOrders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders requested to contragents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders delivered to punkt (punktga yetkazilgan)
const getTumanOrdersDeliveredToPunktForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      'contragentRequests.status': 'delivered_to_punkt',
    });

    addCommonFilters(filter, req.query);

    // Override date filter for contragentRequests
    if (startDate || endDate) {
      filter['contragentRequests.deliveredToPunktAt'] = {};
      if (startDate) filter['contragentRequests.deliveredToPunktAt'].$gte = new Date(startDate);
      if (endDate) filter['contragentRequests.deliveredToPunktAt'].$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders delivered to punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders assigned to agents (agentga yuborilgan)
const getTumanOrdersAssignedToAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      assignedToAgent: { $ne: null },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for assignedAt
    if (startDate || endDate) {
      filter.assignedAt = {};
      if (startDate) filter.assignedAt.$gte = new Date(startDate);
      if (endDate) filter.assignedAt.$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders assigned to agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by agents (agent topshirgan)
const getTumanOrdersConfirmedByAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      confirmedByAgent: { $ne: null },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for agentConfirmedAt
    if (startDate || endDate) {
      filter.agentConfirmedAt = {};
      if (startDate) filter.agentConfirmedAt.$gte = new Date(startDate);
      if (endDate) filter.agentConfirmedAt.$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ agentConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders confirmed by agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by customers (mijoz qabul qilgan)
const getTumanOrdersConfirmedByCustomersForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      customerConfirmed: true,
    });

    addCommonFilters(filter, req.query);

    // Override date filter for customerConfirmedAt
    if (startDate || endDate) {
      filter.customerConfirmedAt = {};
      if (startDate) filter.customerConfirmedAt.$gte = new Date(startDate);
      if (endDate) filter.customerConfirmedAt.$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ customerConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching tuman orders confirmed by customers:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get cancelled tuman orders (qaytarilgan)
const getCancelledTumanOrdersForAdmin = async (req, res) => {
  try {
    const {
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildTumanOrderFilter({
      status: 'cancelled',
    });

    addCommonFilters(filter, req.query);

    // Override date filter for updatedAt
    if (startDate || endDate) {
      filter.updatedAt = {};
      if (startDate) filter.updatedAt.$gte = new Date(startDate);
      if (endDate) filter.updatedAt.$lte = new Date(endDate);
      // Remove createdAt if it was added by addCommonFilters
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching cancelled tuman orders:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAXALLA DO'KONLARI SOTUVI ====================

// Helper function to build base filter for maxalla/dokon orders
const buildMaxallaOrderFilter = (additionalFilter = {}) => {
  return {
    ...additionalFilter,
    $or: [
      { orderType: 'dokon' },
      { items: { $elemMatch: { productType: 'maxalla' } } }, // Orders with maxalla products
    ],
  };
};

// Get all maxalla orders (barcha maxalla buyurtmalari)
const getAllMaxallaOrdersForAdmin = async (req, res) => {
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

    const filter = buildMaxallaOrderFilter();

    // Additional filters
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (user) filter.user = user;
    if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Total price range filter
    if (minTotalPrice || maxTotalPrice) {
      filter.totalPrice = {};
      if (minTotalPrice) filter.totalPrice.$gte = parseFloat(minTotalPrice);
      if (maxTotalPrice) filter.totalPrice.$lte = parseFloat(maxTotalPrice);
    }

    // Search filter
    if (search) {
      const searchCondition = {
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ],
      };
      if (filter.$and) {
        filter.$and.push(searchCondition);
      } else {
        filter.$and = [searchCondition];
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching all maxalla orders:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders from marketplace (marketplace dan buyurilgan)
const getMaxallaOrdersFromMarketplaceForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      status: { $ne: 'cancelled' },
      confirmedByPunkt: null, // Punkt qabul qilmagan
    });

    addCommonFilters(filter, req.query);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders from marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders requested to contragents (kontragentlarga yuborilgan)
const getMaxallaOrdersRequestedToContragentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      'contragentRequests.status': { $in: ['pending', 'accepted'] },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for contragentRequests
    if (startDate || endDate) {
      filter['contragentRequests.requestedAt'] = {};
      if (startDate) filter['contragentRequests.requestedAt'].$gte = new Date(startDate);
      if (endDate) filter['contragentRequests.requestedAt'].$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.status === 'pending' || req.status === 'accepted'
      );
      return orderObj;
    });

    const ordersWithoutKpi = removeKpiFromOrders(formattedOrders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders requested to contragents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders delivered to punkt (punktga yetkazilgan)
const getMaxallaOrdersDeliveredToPunktForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      'contragentRequests.status': 'delivered_to_punkt',
    });

    addCommonFilters(filter, req.query);

    // Override date filter for contragentRequests
    if (startDate || endDate) {
      filter['contragentRequests.deliveredToPunktAt'] = {};
      if (startDate) filter['contragentRequests.deliveredToPunktAt'].$gte = new Date(startDate);
      if (endDate) filter['contragentRequests.deliveredToPunktAt'].$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders delivered to punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders assigned to agents (agentga yuborilgan)
const getMaxallaOrdersAssignedToAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      assignedToAgent: { $ne: null },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for assignedAt
    if (startDate || endDate) {
      filter.assignedAt = {};
      if (startDate) filter.assignedAt.$gte = new Date(startDate);
      if (endDate) filter.assignedAt.$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders assigned to agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders confirmed by agents (agent topshirgan)
const getMaxallaOrdersConfirmedByAgentsForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      confirmedByAgent: { $ne: null },
    });

    addCommonFilters(filter, req.query);

    // Override date filter for agentConfirmedAt
    if (startDate || endDate) {
      filter.agentConfirmedAt = {};
      if (startDate) filter.agentConfirmedAt.$gte = new Date(startDate);
      if (endDate) filter.agentConfirmedAt.$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ agentConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders confirmed by agents:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders confirmed by customers (mijoz qabul qilgan)
const getMaxallaOrdersConfirmedByCustomersForAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      customerConfirmed: true,
    });

    addCommonFilters(filter, req.query);

    // Override date filter for customerConfirmedAt
    if (startDate || endDate) {
      filter.customerConfirmedAt = {};
      if (startDate) filter.customerConfirmedAt.$gte = new Date(startDate);
      if (endDate) filter.customerConfirmedAt.$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ customerConfirmedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching maxalla orders confirmed by customers:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get cancelled maxalla orders (qaytarilgan)
const getCancelledMaxallaOrdersForAdmin = async (req, res) => {
  try {
    const {
      paymentStatus,
      paymentMethod,
      orderNumber,
      user,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = buildMaxallaOrderFilter({
      status: 'cancelled',
    });

    addCommonFilters(filter, req.query);

    // Override date filter for updatedAt
    if (startDate || endDate) {
      filter.updatedAt = {};
      if (startDate) filter.updatedAt.$gte = new Date(startDate);
      if (endDate) filter.updatedAt.$lte = new Date(endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);
    const statistics = await calculateOrderStatistics(filter);
    const orders = await populateOrderDetails(Order.find(filter))
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    res.status(200).json({
      success: true,
      count: ordersWithoutKpi.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      data: ordersWithoutKpi,
    });
  } catch (error) {
    console.error('Error fetching cancelled maxalla orders:', error);
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

// Get detailed sales statistics for a specific viloyat (returns tumans)
const getSalesStatsByViloyatId = async (req, res) => {
  try {
    const { viloyatId } = req.params;
    const { startDate, endDate, status } = req.query;

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

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$deliveryTuman',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate tuman names
    const tumanIds = stats.map((s) => s._id).filter(Boolean);
    const tumans = await Region.find({ _id: { $in: tumanIds } }).select('name code parent');
    const tumanMap = {};
    tumans.forEach((t) => { tumanMap[t._id.toString()] = t; });

    const result = stats.map((stat) => ({
      tuman: stat._id ? tumanMap[stat._id.toString()] || { _id: stat._id } : null,
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
      viloyat,
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

// Get detailed sales statistics for a specific tuman (returns MFYs)
const getSalesStatsByTumanId = async (req, res) => {
  try {
    const { tumanId } = req.params;
    const { startDate, endDate, status } = req.query;

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

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$deliveryMfy',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate MFY names
    const mfyIds = stats.map((s) => s._id).filter(Boolean);
    const mfys = await Region.find({ _id: { $in: mfyIds } }).select('name code parent');
    const mfyMap = {};
    mfys.forEach((m) => { mfyMap[m._id.toString()] = m; });

    const result = stats.map((stat) => ({
      mfy: stat._id ? mfyMap[stat._id.toString()] || { _id: stat._id } : null,
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
      tuman,
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

// Get detailed sales statistics for a specific MFY (returns daily breakdown)
const getSalesStatsByMfyId = async (req, res) => {
  try {
    const { mfyId } = req.params;
    const { startDate, endDate, status } = req.query;

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
      totalAdmins,
      openPartnershipRequests,
      latestOrders,
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
      Admin.countDocuments(),
      PartnershipRequest.countDocuments({ contactStatus: { $ne: 'done' } }),
      Order.find({})
        .select('orderNumber totalPrice status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
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

    // Filter by agent type (deprecated - all agents are now the same)
    // agentType filter is ignored - all agents are treated the same

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Only show non-deleted agents (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

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

    // Only show non-deleted punkts (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

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

// ==================== ARCHIVE API ====================

// Get archived punkts (ishdan chiqib ketgan punktlar)
const getArchivedPunkts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, viloyat, tuman } = req.query;

    const filter = {
      isDeleted: true,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Punkt.countDocuments(filter);

    const punkts = await Punkt.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .select('-password')
      .sort({ deletedAt: -1 })
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
    console.error('Error fetching archived punkts:', error);
    res.status(500).json({
      success: false,
      message: 'Arxiv punktlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get archived agents (ishdan chiqib ketgan agentlar)
const getArchivedAgents = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, viloyat, tuman, mfy, agentType } = req.query;

    const filter = {
      isDeleted: true,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    // Filter by agent type (deprecated - all agents are the same now)
    // agentType filter is ignored

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Agent.countDocuments(filter);

    const agents = await Agent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password')
      .sort({ deletedAt: -1 })
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
    console.error('Error fetching archived agents:', error);
    res.status(500).json({
      success: false,
      message: 'Arxiv agentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get archived punkt with all their work (punktning barcha ishlari)
const getArchivedPunktWithWork = async (req, res) => {
  try {
    const { id } = req.params;

    const punkt = await Punkt.findOne({ _id: id, isDeleted: true })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .select('-password');

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Arxiv punkt topilmadi',
      });
    }

    const Order = require('../models/Order');

    // Get all orders where this punkt was involved
    const ordersFilter = {
      $or: [
        { confirmedByPunkt: punkt._id },
        { currentPunkt: punkt._id },
        { assignedByPunkt: punkt._id },
        { 'punktToPunktRequests.fromPunktId': punkt._id },
        { 'punktToPunktRequests.toPunktId': punkt._id },
      ],
    };

    const totalOrders = await Order.countDocuments(ordersFilter);

    // Get orders with full details
    const orders = await populateOrderDetails(Order.find(ordersFilter))
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 most recent orders

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    // Calculate statistics
    const statistics = await calculateOrderStatistics(ordersFilter);

    res.status(200).json({
      success: true,
      punkt,
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      orders: {
        total: totalOrders,
        count: ordersWithoutKpi.length,
        data: ordersWithoutKpi,
      },
    });
  } catch (error) {
    console.error('Error fetching archived punkt with work:', error);
    res.status(500).json({
      success: false,
      message: 'Arxiv punkt ma\'lumotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get archived agent with all their work (agentning barcha ishlari)
const getArchivedAgentWithWork = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findOne({ _id: id, isDeleted: true })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Arxiv agent topilmadi',
      });
    }


    const Order = require('../models/Order');

    // Get all orders where this agent was involved
    const ordersFilter = {
      $or: [
        { assignedToAgent: agent._id },
        { confirmedByAgent: agent._id },
      ],
    };

    const totalOrders = await Order.countDocuments(ordersFilter);

    // Get orders with full details
    const orders = await populateOrderDetails(Order.find(ordersFilter))
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 most recent orders

    const ordersWithoutKpi = removeKpiFromOrders(orders);

    // Calculate statistics
    const statistics = await calculateOrderStatistics(ordersFilter);

    res.status(200).json({
      success: true,
      agent: agent,
      statistics: {
        totalOrders: statistics.totalOrders,
        totalPrice: statistics.totalPrice,
        totalOriginalPrice: statistics.totalOriginalPrice,
        totalKpiPrice: statistics.totalKpiPrice,
        totalItems: statistics.totalItems,
        avgOrderValue: Math.round(statistics.avgOrderValue * 100) / 100,
      },
      orders: {
        total: totalOrders,
        count: ordersWithoutKpi.length,
        data: ordersWithoutKpi,
      },
    });
  } catch (error) {
    console.error('Error fetching archived agent with work:', error);
    res.status(500).json({
      success: false,
      message: 'Arxiv agent ma\'lumotlarini olishda xatolik yuz berdi',
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
  // Tuman kontragentlari sotuvi
  getAllTumanOrdersForAdmin,
  getTumanOrdersFromMarketplaceForAdmin,
  getTumanOrdersConfirmedByPunktForAdmin,
  getTumanOrdersRequestedToContragentsForAdmin,
  getTumanOrdersDeliveredToPunktForAdmin,
  getTumanOrdersAssignedToAgentsForAdmin,
  getTumanOrdersConfirmedByAgentsForAdmin,
  getTumanOrdersConfirmedByCustomersForAdmin,
  getCancelledTumanOrdersForAdmin,
  // Maxalla do'konlari sotuvi
  getAllMaxallaOrdersForAdmin,
  getMaxallaOrdersFromMarketplaceForAdmin,
  getMaxallaOrdersRequestedToContragentsForAdmin,
  getMaxallaOrdersDeliveredToPunktForAdmin,
  getMaxallaOrdersAssignedToAgentsForAdmin,
  getMaxallaOrdersConfirmedByAgentsForAdmin,
  getMaxallaOrdersConfirmedByCustomersForAdmin,
  getCancelledMaxallaOrdersForAdmin,
  getAgentsInRegion,
  getPunktsInRegion,
  // Sales Statistics
  getSalesStatsByViloyats,
  getSalesStatsByViloyatId,
  getSalesStatsByTumanId,
  getSalesStatsByMfyId,
  getSalesStatsSummary,
  getAdminDashboardOverview,
  getAgentsInRegion,
  getPunktsInRegion,
  // Archive API
  getArchivedPunkts,
  getArchivedAgents,
  getArchivedPunktWithWork,
  getArchivedAgentWithWork,
};

