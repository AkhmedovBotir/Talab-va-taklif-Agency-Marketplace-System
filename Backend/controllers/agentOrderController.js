const Order = require('../models/Order');
const Product = require('../models/Product');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');

// Helper function to manually populate order items with Product model only
const populateOrderItemsProducts = async (orders) => {
  if (!orders || (Array.isArray(orders) && orders.length === 0)) {
    return;
  }

  const ordersArray = Array.isArray(orders) ? orders : [orders];

  for (const order of ordersArray) {
    if (order.items && order.items.length > 0) {
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const productId = typeof item.product === 'string' ? item.product : (item.product?._id || item.product);
        
        if (!productId) continue;
        
        // Only populate Product model (not MaxallaProduct)
        if (item.productType === 'tuman' || !item.productType) {
          try {
            item.product = await Product.findById(productId)
              .populate('category', 'name slug')
              .populate('subcategory', 'name slug')
              .populate({
                path: 'contragent',
                select: 'name inn phone',
              })
              .populate({
                path: 'deliveryRegions.viloyat',
                select: 'name type code',
              })
              .populate({
                path: 'deliveryRegions.tuman',
                select: 'name type code',
              });
          } catch (error) {
            console.error(`Error populating product ${productId}:`, error);
          }
        }
      }
    }
  }
};

// Get orders for agent (agent type'ga qarab buyurtmalarni ko'rish)
const getMyOrders = async (req, res) => {
  try {
    const { agent } = req.user;
    const {
      status,
      paymentStatus,
      paymentMethod,
      orderNumber,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter - all agents see only orders assigned to them
    const filter = {
      assignedToAgent: agent._id,
      $or: [
        { orderType: 'tuman' },
        { orderType: { $exists: false } }, // Old orders without orderType field
      ],
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

    if (orderNumber) {
      // Escape special regex characters in orderNumber
      const escapedOrderNumber = orderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.orderNumber = { $regex: escapedOrderNumber, $options: 'i' };
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
      // Escape special regex characters in search string
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchFilter = {
        $or: [
          { orderNumber: { $regex: escapedSearch, $options: 'i' } },
          { phoneNumber: { $regex: escapedSearch, $options: 'i' } },
        ],
      };
      
      if (filter.$or) {
        // If $or already exists, combine with $and
        filter.$and = [
          { $or: filter.$or },
          searchFilter,
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, searchFilter);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(filter);

    // Get orders with pagination and populate
    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('assignedByPunkt', 'name phone viloyat tuman')
      .populate('confirmedByAgent', 'name phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Manually populate products because of dynamic reference (refPath) - only Product model
    await populateOrderItemsProducts(orders);

    // Remove kpiBonusPercent from products
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
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
    console.error('Error fetching orders for agent:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID for agent
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent } = req.user;

    const order = await Order.findById(id)
      .populate('user', 'name phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('assignedByPunkt', 'name phone viloyat tuman')
      .populate('confirmedByAgent', 'name phone viloyat tuman mfy');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Manually populate products because of dynamic reference (refPath) - only Product model
    await populateOrderItemsProducts(order);

    // Check if agent can access this order - only orders assigned to this agent
    if (!order.assignedToAgent || order.assignedToAgent._id.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtmani ko\'rish huquqiga ega emassiz',
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

// Confirm order by agent (agent mijozga borib tasdiqlash)
const confirmOrderByAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent } = req.user;

    const order = await Order.findById(id)
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order is assigned to this agent
    if (!order.assignedToAgent || order.assignedToAgent._id.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga yuborilmagan',
      });
    }

    // Check if order is already confirmed by agent
    if (order.confirmedByAgent) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma allaqachon tasdiqlangan',
      });
    }

    // Check if agent has paid for the order (agent must pay before delivering to customer)
    const FinanceTransaction = require('../models/FinanceTransaction');
    const agentPayment = await FinanceTransaction.findOne({
      order: order._id,
      category: 'agent_paid_to_punkt',
      'fromUser.userType': 'Agent',
      'fromUser.userId': agent._id,
      status: 'completed',
    });

    if (!agentPayment) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma uchun to\'lov qilmagansiz. Avval punktga to\'lov qilish kerak.',
      });
    }

    // Update order
    order.confirmedByAgent = agent._id;
    order.agentConfirmedAt = new Date();
    
    // Update order status
    if (order.status === 'assigned_to_agent') {
      order.status = 'confirmed_by_agent';
    }
    
    await order.save();

    // Populate for response
    await order.populate('confirmedByAgent', 'name phone viloyat tuman mfy');
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
      message: 'Buyurtma muvaffaqiyatli tasdiqlandi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error confirming order by agent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Mark order as delivered (agent mijozga yetkazib berganini belgilash)
const markOrderAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent } = req.user;

    const order = await Order.findById(id)
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('confirmedByAgent', 'name phone viloyat tuman mfy')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order is assigned to this agent
    if (!order.assignedToAgent || order.assignedToAgent._id.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga yuborilmagan',
      });
    }

    // Check if order is already confirmed by agent (yetkazilishdan oldin tasdiqlanishi kerak)
    if (!order.confirmedByAgent) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma avval tasdiqlanishi kerak',
      });
    }

    // Check if order is already marked as delivered
    if (order.deliveredAt) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma allaqachon yetkazilgan deb belgilangan',
      });
    }

    // Update order
    order.deliveredAt = new Date();
    
    await order.save();

    // Manually populate products because of dynamic reference (refPath) - only Product model
    await populateOrderItemsProducts(order);

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
      message: 'Buyurtma yetkazilgan deb belgilandi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani yetkazilgan deb belgilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get today's orders for agent (bugungi buyurtmalar)
const getTodayOrders = async (req, res) => {
  try {
    const { agent } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    // Today's date range (00:00 - 23:59)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { orderType: 'tuman' },
        { orderType: { $exists: false } }, // Old orders without orderType field
      ],
    };

    // All agents see only orders assigned to them
    filter.assignedToAgent = agent._id;

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Manually populate products because of dynamic reference (refPath) - only Product model
    await populateOrderItemsProducts(orders);

    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
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
    console.error('Error fetching today orders for agent:', error);
    res.status(500).json({
      success: false,
      message: 'Bugungi buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order history for agent (tarix - o'tgan kunlar)
const getOrderHistory = async (req, res) => {
  try {
    const { agent } = req.user;
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Exclude today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    const filter = {
      createdAt: { $lt: startOfToday },
      $or: [
        { orderType: 'tuman' },
        { orderType: { $exists: false } }, // Old orders without orderType field
      ],
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

    // All agents see only orders assigned to them
    filter.assignedToAgent = agent._id;

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Manually populate products because of dynamic reference (refPath) - only Product model
    await populateOrderItemsProducts(orders);

    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
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
    console.error('Error fetching order history for agent:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalar tarixini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  confirmOrderByAgent,
  markOrderAsDelivered,
  getTodayOrders,
  getOrderHistory,
};

