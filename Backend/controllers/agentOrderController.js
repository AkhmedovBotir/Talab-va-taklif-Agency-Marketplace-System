const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');

// Get orders for agent (agent type'ga qarab buyurtmalarni ko'rish)
const getMyOrders = async (req, res) => {
  try {
    const { agent, role } = req.user;
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

    // Build filter based on agent type
    const filter = {};

    // Filter based on agent type
    if (role === 'mfy') {
      // MFY agent - only orders assigned to this agent
      filter.assignedToAgent = agent._id;
    } else if (role === 'tuman') {
      // Tuman agent - orders in tuman and orders assigned to tuman agents
      const tumanAgents = await Agent.find({
        tuman: agent.tuman._id,
        status: 'active',
      }).select('_id');
      
      const tumanAgentIds = tumanAgents.map((a) => a._id);
      filter.$or = [
        { deliveryTuman: agent.tuman._id },
        { assignedToAgent: { $in: tumanAgentIds } },
      ];
    } else if (role === 'viloyat') {
      // Viloyat agent - orders in viloyat
      filter.deliveryViloyat = agent.viloyat._id;
    }

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
        // If $or already exists (for tuman agent), combine with $and
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
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
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
    const { agent, role } = req.user;

    const order = await Order.findById(id)
      .populate('user', 'name phone')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'subcategory', select: 'name slug' },
          { path: 'contragent', select: 'name inn phone' },
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

    // Check if agent can access this order based on role
    let canAccess = false;

    if (role === 'mfy') {
      // MFY agent - only orders assigned to this agent
      canAccess = order.assignedToAgent && order.assignedToAgent._id.toString() === agent._id.toString();
    } else if (role === 'tuman') {
      // Tuman agent - orders in tuman or assigned to tuman agents
      if (order.deliveryTuman && order.deliveryTuman._id.toString() === agent.tuman._id.toString()) {
        canAccess = true;
      } else if (order.assignedToAgent) {
        const assignedAgent = await Agent.findById(order.assignedToAgent._id);
        if (assignedAgent && assignedAgent.tuman && assignedAgent.tuman.toString() === agent.tuman._id.toString()) {
          canAccess = true;
        }
      }
    } else if (role === 'viloyat') {
      // Viloyat agent - orders in viloyat
      canAccess = order.deliveryViloyat && order.deliveryViloyat._id.toString() === agent.viloyat._id.toString();
    }

    if (!canAccess) {
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

// Confirm order by agent (MFY agentlari mijozga borib tasdiqlash)
const confirmOrderByAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent, role } = req.user;

    // Only MFY agents can confirm orders
    if (role !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Faqat MFY agentlari buyurtmalarni tasdiqlay olishadi',
      });
    }

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

// Mark order as delivered (MFY agentlari mijozga yetkazib berganini belgilash)
const markOrderAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent, role } = req.user;

    // Only MFY agents can mark orders as delivered
    if (role !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Faqat MFY agentlari buyurtmalarni yetkazilgan deb belgilay olishadi',
      });
    }

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

    // Populate for response
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
    const { agent, role } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    // Today's date range (00:00 - 23:59)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (role === 'mfy') {
      filter.assignedToAgent = agent._id;
    } else if (role === 'tuman') {
      const tumanAgents = await Agent.find({ tuman: agent.tuman._id, status: 'active' }).select('_id');
      const tumanAgentIds = tumanAgents.map((a) => a._id);
      filter.$or = [
        { deliveryTuman: agent.tuman._id },
        { assignedToAgent: { $in: tumanAgentIds } },
      ];
    } else if (role === 'viloyat') {
      filter.deliveryViloyat = agent.viloyat._id;
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);

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
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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
    const { agent, role } = req.user;
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Exclude today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    const filter = {
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

    if (role === 'mfy') {
      filter.assignedToAgent = agent._id;
    } else if (role === 'tuman') {
      const tumanAgents = await Agent.find({ tuman: agent.tuman._id, status: 'active' }).select('_id');
      const tumanAgentIds = tumanAgents.map((a) => a._id);
      filter.$or = [
        { deliveryTuman: agent.tuman._id },
        { assignedToAgent: { $in: tumanAgentIds } },
      ];
    } else if (role === 'viloyat') {
      filter.deliveryViloyat = agent.viloyat._id;
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);

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
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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

