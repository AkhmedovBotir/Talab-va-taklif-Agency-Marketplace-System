const Order = require('../models/Order');
const Product = require('../models/Product');
const Contragent = require('../models/Contragent');
const Punkt = require('../models/Punkt');

// Get orders for contragent (contragentga kelgan so'rovlar)
const getOrdersForContragent = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID from auth middleware
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {
      'contragentRequests.contragentId': userId,
    };

    if (status) {
      filter['contragentRequests.status'] = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get orders with requests to this contragent
    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
      .populate('currentPunkt', 'name phone viloyat tuman')
      .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Filter contragentRequests to only show requests to this contragent
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.contragentId._id.toString() === userId.toString()
      );
      // Remove kpiBonusPercent from products
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

    // Get total count
    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: filteredOrders,
    });
  } catch (error) {
    console.error('Error fetching orders for contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID for contragent
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user; // Contragent ID

    const order = await Order.findById(id)
      .populate('user', 'name phone')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
      .populate('currentPunkt', 'name phone viloyat tuman')
      .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if contragent has a request for this order
    const contragentRequest = order.contragentRequests.find(
      (req) => req.contragentId._id.toString() === userId.toString()
    );

    if (!contragentRequest) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga so\'rov yuborilmagan',
      });
    }

    // Remove kpiBonusPercent from products
    const orderObj = order.toObject();
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.kpiBonusPercent !== undefined) {
          delete item.product.kpiBonusPercent;
        }
        return item;
      });
    }

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error('Error fetching order:', error);

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

// Respond to order request (buyurtma so'roviga javob berish)
const respondToOrderRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user; // Contragent ID
    const { response } = req.body; // 'accepted' or 'rejected'

    if (!response || !['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Javob "accepted" yoki "rejected" bo\'lishi kerak',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find request to this contragent
    const requestIndex = order.contragentRequests.findIndex(
      (req) => req.contragentId.toString() === userId.toString()
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sizga so\'rov yuborilmagan',
      });
    }

    const request = order.contragentRequests[requestIndex];

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu so\'rovga allaqachon javob berilgan',
      });
    }

    // Update request status
    order.contragentRequests[requestIndex].status = response;
    order.contragentRequests[requestIndex].respondedAt = new Date();

    // Update order status if accepted
    if (response === 'accepted' && order.status === 'requested_to_contragent') {
      order.status = 'accepted_by_contragent';
    }

    await order.save();

    // Populate for response
    await order.populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');
    await order.populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'contragent', select: 'name inn phone' },
      ],
    });

    // Remove kpiBonusPercent from products
    const orderObj = order.toObject();
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.kpiBonusPercent !== undefined) {
          delete item.product.kpiBonusPercent;
        }
        return item;
      });
    }

    res.status(200).json({
      success: true,
      message: response === 'accepted' ? 'So\'rov qabul qilindi' : 'So\'rov rad etildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error responding to order request:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'So\'rovga javob berishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Deliver order to punkt (punktga topshirish)
const deliverToPunkt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user; // Contragent ID

    const order = await Order.findById(orderId)
      .populate('currentPunkt', 'name phone viloyat tuman');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find request to this contragent
    const requestIndex = order.contragentRequests.findIndex(
      (req) => req.contragentId.toString() === userId.toString()
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sizga so\'rov yuborilmagan',
      });
    }

    const request = order.contragentRequests[requestIndex];

    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'So\'rov qabul qilinmagan',
      });
    }

    if (request.status === 'delivered_to_punkt') {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma allaqachon punktga yetkazilgan',
      });
    }

    if (!order.currentPunkt) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma punktga biriktirilmagan',
      });
    }

    // Update request status to delivered
    order.contragentRequests[requestIndex].status = 'delivered_to_punkt';
    order.contragentRequests[requestIndex].deliveredToPunktAt = new Date();

    // Update order status
    if (order.status === 'accepted_by_contragent' || order.status === 'requested_to_contragent') {
      order.status = 'delivered_to_punkt';
    }

    await order.save();

    // Populate for response
    await order.populate('currentPunkt', 'name phone viloyat tuman');
    await order.populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');
    await order.populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'contragent', select: 'name inn phone' },
      ],
    });

    // Remove kpiBonusPercent from products
    const orderObj = order.toObject();
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.kpiBonusPercent !== undefined) {
          delete item.product.kpiBonusPercent;
        }
        return item;
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli punktga yetkazildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error delivering to punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani punktga yetkazishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get statistics for contragent
const getContragentStatistics = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID from auth middleware
    const { startDate, endDate } = req.query;
    const mongoose = require('mongoose');
    const contragentObjectId = new mongoose.Types.ObjectId(userId);

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Base match for orders with requests to this contragent
    const baseMatch = {
      'contragentRequests.contragentId': contragentObjectId,
    };
    if (Object.keys(dateFilter).length > 0) {
      baseMatch.createdAt = dateFilter;
    }

    // Aggregate statistics
    const stats = await Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$contragentRequests' },
      {
        $match: {
          'contragentRequests.contragentId': contragentObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$contragentRequests.status', 'pending'] }, 1, 0] },
          },
          acceptedOrders: {
            $sum: { $cond: [{ $eq: ['$contragentRequests.status', 'accepted'] }, 1, 0] },
          },
          rejectedOrders: {
            $sum: { $cond: [{ $eq: ['$contragentRequests.status', 'rejected'] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$contragentRequests.status', 'delivered_to_punkt'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$contragentRequests.status', ['accepted', 'delivered_to_punkt']] },
                '$totalPrice',
                0,
              ],
            },
          },
          totalItems: {
            $sum: {
              $cond: [
                { $in: ['$contragentRequests.status', ['accepted', 'delivered_to_punkt']] },
                '$itemCount',
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get monthly statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          'contragentRequests.contragentId': contragentObjectId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      { $unwind: '$contragentRequests' },
      {
        $match: {
          'contragentRequests.contragentId': contragentObjectId,
          'contragentRequests.status': { $in: ['accepted', 'delivered_to_punkt'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      acceptedOrders: 0,
      rejectedOrders: 0,
      deliveredOrders: 0,
      totalRevenue: 0,
      totalItems: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: result.totalOrders,
          pendingOrders: result.pendingOrders,
          acceptedOrders: result.acceptedOrders,
          rejectedOrders: result.rejectedOrders,
          deliveredOrders: result.deliveredOrders,
          totalRevenue: result.totalRevenue,
          totalItems: result.totalItems,
          acceptanceRate: result.totalOrders > 0
            ? ((result.acceptedOrders + result.deliveredOrders) / result.totalOrders * 100).toFixed(2)
            : 0,
        },
        monthly: monthlyStats.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          orders: m.orders,
          revenue: m.revenue,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching contragent statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get today's orders for contragent (bugungi buyurtmalar)
const getTodayOrders = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    // Today's date range (00:00 - 23:59)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const filter = {
      'contragentRequests.contragentId': userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (status) {
      filter['contragentRequests.status'] = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.contragentId._id.toString() === userId.toString()
      );
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

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: filteredOrders,
    });
  } catch (error) {
    console.error('Error fetching today orders for contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Bugungi buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order history for contragent (tarix - o'tgan kunlar)
const getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Exclude today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    const filter = {
      'contragentRequests.contragentId': userId,
      createdAt: { $lt: startOfToday },
    };

    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (end < startOfToday) {
        filter.createdAt.$lte = end;
      }
    }

    if (status) {
      filter['contragentRequests.status'] = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.contragentRequests = orderObj.contragentRequests.filter(
        (req) => req.contragentId._id.toString() === userId.toString()
      );
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

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: filteredOrders,
    });
  } catch (error) {
    console.error('Error fetching order history for contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalar tarixini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getOrdersForContragent,
  getOrderById,
  respondToOrderRequest,
  deliverToPunkt,
  getContragentStatistics,
  getTodayOrders,
  getOrderHistory,
};

