const ViloyatManager = require('../models/ViloyatManager');
const Device = require('../models/Device');
const { extractDeviceInfo } = require('../utils/deviceHelper');
const jwt = require('jsonwebtoken');
const Region = require('../models/Region');

// Create new viloyat manager
const createViloyatManager = async (req, res) => {
  try {
    const { name, phone, password, viloyat, status } = req.body;

    // Check if phone number already exists
    const existingPhone = await ViloyatManager.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    // Validate viloyat exists and has correct type
    if (viloyat) {
      const viloyatRegion = await Region.findById(viloyat);
      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
        });
      }
    }

    const viloyatManager = await ViloyatManager.create({
      name,
      phone,
      password,
      viloyat,
      status: status || 'active',
    });

    // Populate viloyat
    await viloyatManager.populate('viloyat', 'name type code');

    res.status(201).json({
      success: true,
      message: 'Viloyat menejeri muvaffaqiyatli yaratildi',
      data: viloyatManager,
    });
  } catch (error) {
    console.error('Error creating viloyat manager:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Viloyat menejeri yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all viloyat managers
const getAllViloyatManagers = async (req, res) => {
  try {
    const { status, viloyat, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await ViloyatManager.countDocuments(filter);

    // Get viloyat managers with pagination
    const viloyatManagers = await ViloyatManager.find(filter)
      .populate('viloyat', 'name type code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: viloyatManagers.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: viloyatManagers,
    });
  } catch (error) {
    console.error('Error fetching viloyat managers:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat menejerlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get viloyat manager by ID
const getViloyatManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    const viloyatManager = await ViloyatManager.findById(id)
      .populate('viloyat', 'name type code')
      .select('-password');

    if (!viloyatManager) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat menejeri topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: viloyatManager,
    });
  } catch (error) {
    console.error('Error fetching viloyat manager:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri viloyat menejeri ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Viloyat menejerini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update viloyat manager
const updateViloyatManager = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If phone is being updated, check for duplicates
    if (updateData.phone) {
      const existingPhone = await ViloyatManager.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud',
        });
      }
    }

    // If viloyat is being updated, validate it
    if (updateData.viloyat) {
      const viloyatRegion = await Region.findById(updateData.viloyat);
      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
        });
      }
    }

    // If password is being updated, it will be hashed automatically by pre-save hook
    const viloyatManager = await ViloyatManager.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('viloyat', 'name type code')
      .select('-password');

    if (!viloyatManager) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat menejeri topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Viloyat menejeri muvaffaqiyatli yangilandi',
      data: viloyatManager,
    });
  } catch (error) {
    console.error('Error updating viloyat manager:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri viloyat menejeri ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Viloyat menejerini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete viloyat manager
const deleteViloyatManager = async (req, res) => {
  try {
    const { id } = req.params;

    const viloyatManager = await ViloyatManager.findByIdAndDelete(id);

    if (!viloyatManager) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat menejeri topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Viloyat menejeri muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting viloyat manager:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri viloyat menejeri ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Viloyat menejerini o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login viloyat manager
const loginViloyatManager = async (req, res) => {
  try {
    const { phone, password, deviceId, deviceInfo } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami va parol kiritilishi shart',
      });
    }

    // Find viloyat manager by phone
    const viloyatManager = await ViloyatManager.findOne({ phone }).select('+password').populate('viloyat', 'name type code');

    if (!viloyatManager) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check status
    if (viloyatManager.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check password
    const isPasswordValid = await viloyatManager.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: viloyatManager._id,
        userType: 'viloyatManager',
        viloyatManager: {
          _id: viloyatManager._id,
          name: viloyatManager.name,
          phone: viloyatManager.phone,
          viloyat: viloyatManager.viloyat,
        },
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRE || '30d',
      }
    );

    // Handle device registration
    if (deviceId) {
      const extractedDeviceInfo = extractDeviceInfo(req);
      const deviceData = {
        user: viloyatManager._id,
        userModel: 'ViloyatManager',
        deviceId,
        deviceName: extractedDeviceInfo.deviceName,
        deviceType: extractedDeviceInfo.deviceType,
        platform: extractedDeviceInfo.platform,
        os: extractedDeviceInfo.os,
        browser: extractedDeviceInfo.browser,
        ipAddress: extractedDeviceInfo.ipAddress,
        userAgent: extractedDeviceInfo.userAgent,
      };

      if (deviceInfo) {
        if (deviceInfo.deviceName) deviceData.deviceName = deviceInfo.deviceName;
        if (deviceInfo.deviceType) deviceData.deviceType = deviceInfo.deviceType;
        if (deviceInfo.platform) deviceData.platform = deviceInfo.platform;
        if (deviceInfo.os) deviceData.os = deviceInfo.os;
        if (deviceInfo.browser) deviceData.browser = deviceInfo.browser;
        if (deviceInfo.location) deviceData.location = deviceInfo.location;
      }

      // Update or create device
      await Device.findOneAndUpdate(
        {
          user: viloyatManager._id,
          userModel: 'ViloyatManager',
          deviceId,
        },
        {
          ...deviceData,
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
          isActive: true,
        },
        {
          upsert: true,
          new: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      token,
      data: {
        _id: viloyatManager._id,
        name: viloyatManager.name,
        phone: viloyatManager.phone,
        viloyat: viloyatManager.viloyat,
        status: viloyatManager.status,
      },
    });
  } catch (error) {
    console.error('Error logging in viloyat manager:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkts in manager's viloyat
const getPunktsInViloyat = async (req, res) => {
  try {
    const Punkt = require('../models/Punkt');
    const { status, tuman, search, page = 1, limit = 50 } = req.query;
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;

    const filter = {
      viloyat: managerViloyat,
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Punkt.countDocuments(filter);

    // Get punkts with pagination
    const punkts = await Punkt.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .select('-password')
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
    console.error('Error fetching punkts in viloyat:', error);
    res.status(500).json({
      success: false,
      message: 'Punktlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agents in manager's viloyat
const getAgentsInViloyat = async (req, res) => {
  try {
    const Agent = require('../models/Agent');
    const { status, tuman, mfy, search, page = 1, limit = 50 } = req.query;
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;

    const filter = {
      viloyat: managerViloyat,
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Agent.countDocuments(filter);

    // Get agents with pagination
    const agents = await Agent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password')
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
    console.error('Error fetching agents in viloyat:', error);
    res.status(500).json({
      success: false,
      message: 'Agentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get contragents in manager's viloyat
const getContragentsInViloyat = async (req, res) => {
  try {
    const Contragent = require('../models/Contragent');
    const { status, tuman, mfy, contragentLevel, search, page = 1, limit = 50 } = req.query;
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;

    const filter = {
      viloyat: managerViloyat,
    };

    if (status) {
      filter.status = status;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    if (contragentLevel) {
      filter.contragentLevel = contragentLevel;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { inn: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Contragent.countDocuments(filter);

    // Get contragents with pagination
    const contragents = await Contragent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: contragents.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: contragents,
    });
  } catch (error) {
    console.error('Error fetching contragents in viloyat:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get dokons (mfy contragents) in manager's viloyat
const getDokonsInViloyat = async (req, res) => {
  try {
    const Contragent = require('../models/Contragent');
    const { status, tuman, mfy, search, page = 1, limit = 50 } = req.query;
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;

    const filter = {
      viloyat: managerViloyat,
      contragentLevel: 'mfy', // Only MFY level contragents (do'konlar)
    };

    if (status) {
      filter.status = status;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { inn: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Contragent.countDocuments(filter);

    // Get dokons with pagination
    const dokons = await Contragent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: dokons.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: dokons,
    });
  } catch (error) {
    console.error('Error fetching dokons in viloyat:', error);
    res.status(500).json({
      success: false,
      message: 'Do\'konlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tumans in manager's viloyat
const getTumansInViloyat = async (req, res) => {
  try {
    const Region = require('../models/Region');
    const { search, page = 1, limit = 100 } = req.query;
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;

    const filter = {
      type: 'district',
      parent: managerViloyat, // Tumanlar viloyatning child'lari
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Region.countDocuments(filter);

    // Get tumans with pagination
    const tumans = await Region.find(filter)
      .populate('parent', 'name type code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: tumans.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: tumans,
    });
  } catch (error) {
    console.error('Error fetching tumans in viloyat:', error);
    res.status(500).json({
      success: false,
      message: 'Tumanlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MANAGER ORDER FUNCTIONS ====================

const Order = require('../models/Order');

// Helper functions from adminDataController (reused)
const populateOrderDetails = (query) => {
  return query
    .populate('user', 'name phone')
    .populate('deliveryViloyat', 'name type code')
    .populate('deliveryTuman', 'name type code')
    .populate('deliveryMfy', 'name type code')
    .populate('confirmedByPunkt', 'name phone viloyat tuman')
    .populate('assignedToAgent', 'name phone viloyat tuman mfy')
    .populate('confirmedByAgent', 'name phone viloyat tuman mfy')
    .populate('assignedByPunkt', 'name phone viloyat tuman')
    .populate('currentPunkt', 'name phone viloyat tuman')
    .populate('items.product', 'name price originalPrice images category subcategory unit unitSize')
    .populate('items.product.category', 'name slug')
    .populate('items.product.subcategory', 'name slug')
    .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy logo activityType contragentLevel')
    .populate('punktRequests.punktId', 'name phone viloyat tuman')
    .populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman')
    .populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');
};

const removeKpiFromOrders = (orders) => {
  return orders.map((order) => {
    const orderObj = order.toObject ? order.toObject() : order;
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.kpiBonusPercent !== undefined) {
          delete item.product.kpiBonusPercent;
        }
        return item;
      });
    }
    return orderObj;
  });
};

const calculateOrderStatistics = async (filter) => {
  const stats = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalPrice: { $sum: '$totalPrice' },
        totalOriginalPrice: { $sum: '$totalOriginalPrice' },
        totalKpiPrice: { $sum: '$totalKpiPrice' },
        totalItems: { $sum: '$itemCount' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalOrders: 0,
      totalPrice: 0,
      totalOriginalPrice: 0,
      totalKpiPrice: 0,
      totalItems: 0,
      avgOrderValue: 0,
    };
  }

  const result = stats[0];
  result.avgOrderValue = result.totalOrders > 0 ? result.totalPrice / result.totalOrders : 0;
  return result;
};

// Helper function to build base filter for tuman orders with viloyat filter
const buildTumanOrderFilterForManager = (managerViloyat, additionalFilter = {}) => {
  return {
    ...additionalFilter,
    deliveryViloyat: managerViloyat,
    $or: [
      { orderType: 'tuman' },
      { orderType: { $exists: false } }, // Old orders without orderType field
    ],
    // Exclude MaxallaProduct orders
    items: { $not: { $elemMatch: { productType: 'maxalla' } } },
  };
};

// Helper function to build base filter for maxalla/dokon orders with viloyat filter
const buildMaxallaOrderFilterForManager = (managerViloyat, additionalFilter = {}) => {
  return {
    ...additionalFilter,
    deliveryViloyat: managerViloyat,
    $or: [
      { orderType: 'dokon' },
      { items: { $elemMatch: { productType: 'maxalla' } } }, // Orders with maxalla products
    ],
  };
};

// Helper function to add common filters
const addCommonFiltersForManager = (filter, query) => {
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

// ==================== TUMAN KONTRAGENTLARI SOTUVI ====================

// Get all tuman orders in manager's viloyat
const getAllTumanOrdersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat);
    addCommonFiltersForManager(filter, req.query);

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders from marketplace in manager's viloyat
const getTumanOrdersFromMarketplaceForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      status: { $ne: 'cancelled' },
      confirmedByPunkt: null,
    });
    addCommonFiltersForManager(filter, req.query);

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching marketplace tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by punkt in manager's viloyat
const getTumanOrdersConfirmedByPunktForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      confirmedByPunkt: { $ne: null },
      assignedToAgent: null,
    });
    addCommonFiltersForManager(filter, req.query);

    // Get all matching orders first (for filtering)
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
    const orderIds = allOrders.map((o) => o._id);
    const statistics = orderIds.length > 0
      ? await calculateOrderStatistics({ _id: { $in: orderIds } })
      : await calculateOrderStatistics({ _id: { $in: [] } });

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
    const skip = (pageNum - 1) * limitNum;
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
    console.error('Error fetching confirmed by punkt tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders requested to contragents in manager's viloyat
const getTumanOrdersRequestedToContragentsForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      'contragentRequests.status': { $in: ['pending', 'accepted'] },
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter['contragentRequests.requestedAt'] = {};
      if (req.query.startDate) filter['contragentRequests.requestedAt'].$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter['contragentRequests.requestedAt'].$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching requested to contragents tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders delivered to punkt in manager's viloyat
const getTumanOrdersDeliveredToPunktForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      'contragentRequests.status': 'delivered_to_punkt',
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter['contragentRequests.deliveredToPunktAt'] = {};
      if (req.query.startDate) filter['contragentRequests.deliveredToPunktAt'].$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter['contragentRequests.deliveredToPunktAt'].$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
        (req) => req.status === 'delivered_to_punkt'
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
    console.error('Error fetching delivered to punkt tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders assigned to agents in manager's viloyat
const getTumanOrdersAssignedToAgentsForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      assignedToAgent: { $ne: null },
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.assignedAt = {};
      if (req.query.startDate) filter.assignedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.assignedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching assigned to agents tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by agents in manager's viloyat
const getTumanOrdersConfirmedByAgentsForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      confirmedByAgent: { $ne: null },
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.agentConfirmedAt = {};
      if (req.query.startDate) filter.agentConfirmedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.agentConfirmedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching confirmed by agents tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get tuman orders confirmed by customers in manager's viloyat
const getTumanOrdersConfirmedByCustomersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      customerConfirmed: true,
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.customerConfirmedAt = {};
      if (req.query.startDate) filter.customerConfirmedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.customerConfirmedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching confirmed by customers tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get cancelled tuman orders in manager's viloyat
const getCancelledTumanOrdersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildTumanOrderFilterForManager(managerViloyat, {
      status: 'cancelled',
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.updatedAt = {};
      if (req.query.startDate) filter.updatedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.updatedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching cancelled tuman orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAXALLA DO'KONLARI SOTUVI ====================

// Get all maxalla orders in manager's viloyat
const getAllMaxallaOrdersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildMaxallaOrderFilterForManager(managerViloyat);
    addCommonFiltersForManager(filter, req.query);

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching maxalla orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders from marketplace in manager's viloyat
const getMaxallaOrdersFromMarketplaceForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildMaxallaOrderFilterForManager(managerViloyat, {
      status: { $ne: 'cancelled' },
      confirmedByPunkt: null,
    });
    addCommonFiltersForManager(filter, req.query);

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching marketplace maxalla orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders requested to contragents in manager's viloyat
const getMaxallaOrdersRequestedToContragentsForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildMaxallaOrderFilterForManager(managerViloyat, {
      'contragentRequests.status': { $in: ['pending', 'accepted'] },
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter['contragentRequests.requestedAt'] = {};
      if (req.query.startDate) filter['contragentRequests.requestedAt'].$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter['contragentRequests.requestedAt'].$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching requested to contragents maxalla orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get maxalla orders confirmed by customers in manager's viloyat
const getMaxallaOrdersConfirmedByCustomersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildMaxallaOrderFilterForManager(managerViloyat, {
      customerConfirmed: true,
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.customerConfirmedAt = {};
      if (req.query.startDate) filter.customerConfirmedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.customerConfirmedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching confirmed by customers maxalla orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get cancelled maxalla orders in manager's viloyat
const getCancelledMaxallaOrdersForManager = async (req, res) => {
  try {
    const managerViloyat = req.user.viloyat._id || req.user.viloyat;
    const filter = buildMaxallaOrderFilterForManager(managerViloyat, {
      status: 'cancelled',
    });
    addCommonFiltersForManager(filter, req.query);

    if (req.query.startDate || req.query.endDate) {
      filter.updatedAt = {};
      if (req.query.startDate) filter.updatedAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.updatedAt.$lte = new Date(req.query.endDate);
      delete filter.createdAt;
    }

    const pageNum = parseInt(req.query.page || 1, 10);
    const limitNum = parseInt(req.query.limit || 50, 10);
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
    console.error('Error fetching cancelled maxalla orders for manager:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createViloyatManager,
  getAllViloyatManagers,
  getViloyatManagerById,
  updateViloyatManager,
  deleteViloyatManager,
  loginViloyatManager,
  getPunktsInViloyat,
  getAgentsInViloyat,
  getContragentsInViloyat,
  getDokonsInViloyat,
  getTumansInViloyat,
  // Tuman kontragentlari sotuvi
  getAllTumanOrdersForManager,
  getTumanOrdersFromMarketplaceForManager,
  getTumanOrdersConfirmedByPunktForManager,
  getTumanOrdersRequestedToContragentsForManager,
  getTumanOrdersDeliveredToPunktForManager,
  getTumanOrdersAssignedToAgentsForManager,
  getTumanOrdersConfirmedByAgentsForManager,
  getTumanOrdersConfirmedByCustomersForManager,
  getCancelledTumanOrdersForManager,
  // Maxalla do'konlari sotuvi
  getAllMaxallaOrdersForManager,
  getMaxallaOrdersFromMarketplaceForManager,
  getMaxallaOrdersRequestedToContragentsForManager,
  getMaxallaOrdersConfirmedByCustomersForManager,
  getCancelledMaxallaOrdersForManager,
};
