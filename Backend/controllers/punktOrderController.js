const Order = require('../models/Order');
const Product = require('../models/Product');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');
const Agent = require('../models/Agent');
const Contragent = require('../models/Contragent');

// Get orders for punkt (o'z hududidagi buyurtmalar)
const getMyOrders = async (req, res) => {
  try {
    const { punkt } = req.user;
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

    // Build filter - include orders in punkt's region OR orders where punkt is involved
    const orConditions = [];

    // Orders in punkt's region
    if (punkt.viloyat) {
      const regionCondition = { deliveryViloyat: punkt.viloyat._id };
    if (punkt.tuman) {
        regionCondition.deliveryTuman = punkt.tuman._id;
    }
      orConditions.push(regionCondition);
    }

    // Orders where punkt is current punkt
    orConditions.push({ currentPunkt: punkt._id });

    // Orders where punkt has punkt-to-punkt requests (to or from)
    orConditions.push({ 'punktToPunktRequests.fromPunktId': punkt._id });
    orConditions.push({ 'punktToPunktRequests.toPunktId': punkt._id });

    // Orders where punkt has old-style requests
    orConditions.push({ 'punktRequests.punktId': punkt._id });

    const filter = {
      $or: orConditions,
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
      .populate('punktRequests.punktId', 'name phone viloyat tuman')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('assignedByPunkt', 'name phone viloyat tuman')
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
    console.error('Error fetching orders for punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID for punkt
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

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
      .populate('punktRequests.punktId', 'name phone viloyat tuman')
      .populate('assignedToAgent', 'name phone viloyat tuman mfy')
      .populate('assignedByPunkt', 'name phone viloyat tuman')
      .populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy')
      .populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman')
      .populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman')
      .populate('currentPunkt', 'name phone viloyat tuman')
      .populate('confirmedByAgent', 'name phone viloyat tuman mfy');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Punkt bo'lsa, har qanday buyurtmani ko'ra oladi (hech qanday cheklov yo'q)
    // Faqat punkt autentifikatsiyasi o'tgan bo'lsa, buyurtmani ko'ra oladi

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

// Confirm order (buyurtmani tasdiqlash)
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

    const order = await Order.findById(id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'deliveryRegions.viloyat',
          select: 'name type code',
        },
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Check if order is already confirmed
    if (order.punktStatus === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma allaqachon tasdiqlangan',
      });
    }

    // Check if punkt can confirm this order
    // Punkt can confirm if at least one product's delivery region includes punkt's tuman MFY
    let canConfirm = false;

    // Get all MFYs in punkt's tuman
    const mfysInTuman = await Region.find({
      type: 'mfy',
      parent: punkt.tuman?._id || null,
    });

    const mfyIds = mfysInTuman.map((mfy) => mfy._id.toString());

    // Check if order's deliveryMfy is in punkt's tuman
    if (order.deliveryMfy && mfyIds.includes(order.deliveryMfy._id.toString())) {
      canConfirm = true;
    } else {
      // Check if any product's delivery region includes punkt's tuman MFY
      for (const item of order.items) {
        if (item.product && item.product.deliveryRegions) {
          for (const region of item.product.deliveryRegions) {
            // Check if product delivery region matches punkt's viloyat
            if (region.viloyat && region.viloyat._id.toString() === punkt.viloyat._id.toString()) {
              // If product has tuman in delivery region, check if it matches punkt's tuman
              if (region.tuman) {
                if (punkt.tuman && region.tuman._id.toString() === punkt.tuman._id.toString()) {
                  canConfirm = true;
                  break;
                }
              } else {
                // If product delivery region is only viloyat level, punkt can confirm
                canConfirm = true;
                break;
              }
            }
          }
          if (canConfirm) break;
        }
      }
    }

    if (!canConfirm) {
      return res.status(403).json({
        success: false,
        message: 'Siz bu buyurtmani tasdiqlay olmaysiz. Maxsulotlar yetkazish hududlarida sizning tumaningizdagi MFY\'lardan biri yo\'q.',
      });
    }

    // Update order
    order.confirmedByPunkt = punkt._id;
    order.punktStatus = 'confirmed';
    order.status = 'confirmed_by_punkt';
    order.currentPunkt = punkt._id;
    await order.save();

    // Automatically route order based on product availability
    // Avtorouting o'chirilgan - punkt manual ravishda contragentga so'rov yuborishi kerak

    // Populate for response
    await order.populate('confirmedByPunkt', 'name phone viloyat tuman');
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
    console.error('Error confirming order:', error);

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

// Request to other punkts (boshqa punktlarga so'rov yuborish)
const requestToPunkts = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;
    const { tumanIds } = req.body; // Array of tuman IDs where punkts should be requested

    if (!tumanIds || !Array.isArray(tumanIds) || tumanIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tuman ID\'lari kiritilishi shart',
      });
    }

    const order = await Order.findById(id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'deliveryRegions.viloyat',
          select: 'name type code',
        },
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Validate that all tumanIds belong to punkt's viloyat
    const tumans = await Region.find({
      _id: { $in: tumanIds },
      type: 'district',
    }).populate('parent');

    if (tumans.length !== tumanIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi tumanlar topilmadi',
      });
    }

    for (const tuman of tumans) {
      if (!tuman.parent || tuman.parent._id.toString() !== punkt.viloyat._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Barcha tumanlar sizning viloyatingizga tegishli bo\'lishi kerak',
        });
      }
    }

    // Get all active punkts in specified tumans
    const punkts = await Punkt.find({
      tuman: { $in: tumanIds },
      status: 'active',
      _id: { $ne: punkt._id }, // Exclude current punkt
    });

    if (punkts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Belgilangan tumanlarda faol punktlar topilmadi',
      });
    }

    // Add punkt requests to order
    const newRequests = punkts.map((p) => ({
      punktId: p._id,
      status: 'pending',
      requestedAt: new Date(),
    }));

    // Remove existing requests from same punkts
    order.punktRequests = order.punktRequests.filter(
      (req) => !punkts.some((p) => p._id.toString() === req.punktId.toString())
    );

    // Add new requests
    order.punktRequests.push(...newRequests);
    order.punktStatus = 'requested';
    await order.save();

    // Populate for response
    await order.populate('punktRequests.punktId', 'name phone viloyat tuman');

    res.status(200).json({
      success: true,
      message: `${punkts.length} ta punktga so'rov yuborildi`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        requestedPunkts: punkts.map((p) => ({
          _id: p._id,
          name: p.name,
          phone: p.phone,
        })),
        punktRequests: order.punktRequests,
      },
    });
  } catch (error) {
    console.error('Error requesting to punkts:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma yoki tuman ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Punktlarga so\'rov yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get requests to my punkt (o'z punktiga kelgan so'rovlar)
const getPunktRequests = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {
      'punktRequests.punktId': punkt._id,
    };

    if (status) {
      filter['punktRequests.status'] = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get orders with requests to this punkt
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
      .populate('punktRequests.punktId', 'name phone viloyat tuman')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Filter punktRequests to only show requests to this punkt
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.punktRequests = orderObj.punktRequests.filter(
        (req) => req.punktId._id.toString() === punkt._id.toString()
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
    console.error('Error fetching punkt requests:', error);
    res.status(500).json({
      success: false,
      message: 'So\'rovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Respond to request (so'rovga javob berish)
const respondToRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { punkt } = req.user;
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

    // Find request to this punkt
    const requestIndex = order.punktRequests.findIndex(
      (req) => req.punktId.toString() === punkt._id.toString()
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sizga so\'rov yuborilmagan',
      });
    }

    const request = order.punktRequests[requestIndex];

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu so\'rovga allaqachon javob berilgan',
      });
    }

    // Update request status
    order.punktRequests[requestIndex].status = response;
    order.punktRequests[requestIndex].respondedAt = new Date();

    // If accepted, confirm the order
    if (response === 'accepted') {
      order.confirmedByPunkt = punkt._id;
      order.punktStatus = 'confirmed';
    }

    await order.save();

    // Populate for response
    await order.populate('confirmedByPunkt', 'name phone viloyat tuman');
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
      message: response === 'accepted' ? 'So\'rov qabul qilindi va buyurtma tasdiqlandi' : 'So\'rov rad etildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error responding to request:', error);

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

// Assign order to agent (buyurtmani agentga yuborish)
const assignOrderToAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID kiritilishi shart',
      });
    }

    const order = await Order.findById(id)
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Check if order is confirmed by this punkt OR current punkt is this punkt
    const isConfirmedByThisPunkt =
      order.confirmedByPunkt && order.confirmedByPunkt.toString() === punkt._id.toString();
    const isCurrentPunkt =
      order.currentPunkt && order.currentPunkt.toString() === punkt._id.toString();

    if (!isConfirmedByThisPunkt && !isCurrentPunkt) {
      return res.status(403).json({
        success: false,
        message:
          'Bu buyurtmani siz tasdiqlamaggansiz va hozirgi punkt ham siz emassiz, shuning uchun agentga yubora olmaysiz',
      });
    }

    // Check if order is already assigned to an agent
    if (order.assignedToAgent) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma allaqachon agentga yuborilgan',
      });
    }

    // Validate agent exists and is active
    const agent = await Agent.findById(agentId)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    if (agent.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Agent faol emas',
      });
    }

    // Update order
    order.assignedToAgent = agent._id;
    order.assignedByPunkt = punkt._id;
    order.assignedAt = new Date();
    
    // Update order status
    if (order.status === 'delivered_to_punkt' || order.status === 'confirmed_by_punkt') {
      order.status = 'assigned_to_agent';
    }
    
    await order.save();

    // Populate for response
    await order.populate('assignedToAgent', 'name phone viloyat tuman mfy');
    await order.populate('assignedByPunkt', 'name phone viloyat tuman');
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
      message: 'Buyurtma muvaffaqiyatli agentga yuborildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error assigning order to agent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma yoki agent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani agentga yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Request to contragent (contragentga so'rov yuborish)
const requestToContragent = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;
    const { contragentId } = req.body;

    if (!contragentId) {
      return res.status(400).json({
        success: false,
        message: 'Contragent ID kiritilishi shart',
      });
    }

    const order = await Order.findById(id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'contragent',
          select: 'name inn phone viloyat tuman mfy',
        },
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Validate contragent exists and is active
    const contragent = await Contragent.findById(contragentId)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Contragent topilmadi',
      });
    }

    if (contragent.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Contragent faol emas',
      });
    }

    // Check if contragent already has a request for this order
    const existingRequest = order.contragentRequests.find(
      (req) => req.contragentId.toString() === contragentId.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bu contragentga allaqachon so\'rov yuborilgan',
      });
    }

    // Add contragent request
    order.contragentRequests.push({
      contragentId: contragent._id,
      status: 'pending',
      requestedAt: new Date(),
    });

    // Set current punkt
    order.currentPunkt = punkt._id;
    
    // Update order status if not already confirmed by punkt
    if (order.status === 'pending' || order.status === 'confirmed_by_punkt') {
      order.status = 'requested_to_contragent';
    }
    
    await order.save();

    // Populate for response
    await order.populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');

    res.status(200).json({
      success: true,
      message: 'Contragentga so\'rov yuborildi',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        contragent: {
          _id: contragent._id,
          name: contragent.name,
          inn: contragent.inn,
          phone: contragent.phone,
        },
        contragentRequests: order.contragentRequests,
      },
    });
  } catch (error) {
    console.error('Error requesting to contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma yoki contragent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Contragentga so\'rov yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Request to another punkt (boshqa punktga so'rov yuborish)
const requestToPunkt = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;
    const { toPunktId } = req.body;

    if (!toPunktId) {
      return res.status(400).json({
        success: false,
        message: 'Punkt ID kiritilishi shart',
      });
    }

    const order = await Order.findById(id)
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Validate toPunkt exists and is active
    const toPunkt = await Punkt.findById(toPunktId)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code');

    if (!toPunkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    if (toPunkt.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Punkt faol emas',
      });
    }

    // Check if punkt already has a request for this order (pending, accepted, yoki delivered bo'lsa, yana yubormaymiz)
    const existingRequest = order.punktToPunktRequests.find(
      (req) => 
        req.toPunktId.toString() === toPunktId.toString() && 
        req.fromPunktId.toString() === punkt._id.toString() &&
        (req.status === 'pending' || req.status === 'accepted' || req.status === 'delivered')
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bu punktga allaqachon so\'rov yuborilgan',
      });
    }

    // Add punkt to punkt request
    order.punktToPunktRequests.push({
      fromPunktId: punkt._id,
      toPunktId: toPunkt._id,
      status: 'pending',
      requestedAt: new Date(),
    });

    await order.save();

    // Populate for response
    await order.populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman');
    await order.populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');

    res.status(200).json({
      success: true,
      message: 'Punktga so\'rov yuborildi',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        toPunkt: {
          _id: toPunkt._id,
          name: toPunkt.name,
          phone: toPunkt.phone,
        },
        punktToPunktRequests: order.punktToPunktRequests,
      },
    });
  } catch (error) {
    console.error('Error requesting to punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma yoki punkt ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Punktga so\'rov yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Receive order from another punkt (boshqa punktdan buyurtma qabul qilish)
const receiveFromPunkt = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

    const order = await Order.findById(id)
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find request to this punkt (accepted yoki pending bo'lishi mumkin, delivered bo'lsa yana qabul qilish mumkin emas)
    // First, let's check all requests to understand the situation
    const allRequestsToThisPunkt = order.punktToPunktRequests.filter(
      (req) => {
        const toPunktId = req.toPunktId?.toString ? req.toPunktId.toString() : String(req.toPunktId);
        const punktId = punkt._id.toString();
        return toPunktId === punktId;
      }
    );

    // Find pending or accepted request
    const requestIndex = order.punktToPunktRequests.findIndex(
      (req) => {
        const toPunktId = req.toPunktId?.toString ? req.toPunktId.toString() : String(req.toPunktId);
        const punktId = punkt._id.toString();
        return toPunktId === punktId && (req.status === 'accepted' || req.status === 'pending');
      }
    );

    if (requestIndex === -1) {
      // Check if request was already delivered
      const deliveredRequest = allRequestsToThisPunkt.find(
        (req) => req.status === 'delivered'
      );

      if (deliveredRequest) {
        return res.status(400).json({
          success: false,
          message: 'Bu buyurtma allaqachon qabul qilingan',
        });
      }

      // Check if there's a rejected request
      const rejectedRequest = allRequestsToThisPunkt.find(
        (req) => req.status === 'rejected'
      );

      if (rejectedRequest) {
        return res.status(400).json({
          success: false,
          message: 'Bu so\'rov rad etilgan',
        });
      }

      // If no request found, provide more details
      const hasAnyRequest = allRequestsToThisPunkt.length > 0;
      if (hasAnyRequest) {
        return res.status(400).json({
          success: false,
          message: `Sizga bu buyurtma yuborilgan, lekin so'rov holati qabul qilish uchun mos emas. So'rov holati: ${allRequestsToThisPunkt[0].status}`,
        });
      }

      // If no request found, check if punkt can still receive (maybe request was sent but not properly saved)
      // Allow if punkt is in the same viloyat and order is not yet delivered to any punkt
      const isInSameViloyat = order.deliveryViloyat && 
        order.deliveryViloyat._id.toString() === punkt.viloyat._id.toString();
      
      // If punkt is in same viloyat and order is not yet assigned to agent, allow receiving
      if (isInSameViloyat && 
          order.status !== 'assigned_to_agent' && 
          order.status !== 'confirmed_by_agent' && 
          order.status !== 'confirmed_by_customer') {
        // Create a new request entry for tracking
        const newRequest = {
          fromPunktId: order.currentPunkt || order.confirmedByPunkt || null,
          toPunktId: punkt._id,
          status: 'accepted',
          requestedAt: new Date(),
          respondedAt: new Date(),
        };
        
        // If there's a fromPunktId, add the request, otherwise just proceed
        if (newRequest.fromPunktId) {
          order.punktToPunktRequests.push(newRequest);
          const newRequestIndex = order.punktToPunktRequests.length - 1;
          
          // Update request status to delivered
          order.punktToPunktRequests[newRequestIndex].status = 'delivered';
          order.punktToPunktRequests[newRequestIndex].deliveredAt = new Date();
        }
        
        // Update current punkt
        order.currentPunkt = punkt._id;
        
        // Update order status
        if (order.status !== 'delivered_to_punkt' && 
            order.status !== 'assigned_to_agent' && 
            order.status !== 'confirmed_by_agent' && 
            order.status !== 'confirmed_by_customer') {
          order.status = 'delivered_to_punkt';
        }
        
        await order.save();

        // Avtorouting o'chirilgan - punkt manual ravishda contragentga so'rov yuborishi kerak

        // Populate for response
        await order.populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman');
        await order.populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');

        return res.status(200).json({
          success: true,
          message: 'Buyurtma muvaffaqiyatli qabul qilindi',
          data: order,
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Sizga bu buyurtma yuborilmagan. Avval boshqa punktdan sizga so\'rov yuborilishi kerak.',
      });
    }

    const request = order.punktToPunktRequests[requestIndex];

    // Agar so'rov pending bo'lsa, avtomatik qabul qilamiz
    if (request.status === 'pending') {
      order.punktToPunktRequests[requestIndex].status = 'accepted';
      order.punktToPunktRequests[requestIndex].respondedAt = new Date();
      // Update current punkt
      order.currentPunkt = punkt._id;
      // Update order status
      if (order.status === 'pending' || order.status === 'requested_to_contragent') {
        order.status = 'confirmed_by_punkt';
      }
      order.confirmedByPunkt = punkt._id;
      order.punktStatus = 'confirmed';
    } else if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Bu so\'rov hali qabul qilinmagan yoki allaqachon qayta ishlangan',
      });
    }

    // Update request status to delivered
    order.punktToPunktRequests[requestIndex].status = 'delivered';
    order.punktToPunktRequests[requestIndex].deliveredAt = new Date();

    // Update current punkt
    order.currentPunkt = punkt._id;
    
    // Update order status to delivered_to_punkt if not already
    if (order.status !== 'delivered_to_punkt' && order.status !== 'assigned_to_agent' && order.status !== 'confirmed_by_agent' && order.status !== 'confirmed_by_customer') {
      order.status = 'delivered_to_punkt';
    }
    
    await order.save();

    // Avtorouting o'chirilgan - punkt manual ravishda contragentga so'rov yuborishi kerak

    // Populate for response
    await order.populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman');
    await order.populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');

    res.status(200).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli qabul qilindi',
      data: order,
    });
  } catch (error) {
    console.error('Error receiving from punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani qabul qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Receive order from contragent (contragentdan buyurtma qabul qilish)
const receiveFromContragent = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

    const order = await Order.findById(id)
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find contragent request that was delivered
    const requestIndex = order.contragentRequests.findIndex(
      (req) => req.status === 'delivered_to_punkt'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Contragentdan buyurtma hali yetkazilmagan',
      });
    }

    const request = order.contragentRequests[requestIndex];

    // Verify that this punkt requested this contragent
    if (order.currentPunkt && order.currentPunkt.toString() !== punkt._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning punktingizga tegishli emas',
      });
    }

    // Update current punkt
    order.currentPunkt = punkt._id;
    
    // Update order status - already delivered to punkt, so status should remain delivered_to_punkt
    // Status is already set by contragent when delivering
    if (order.status !== 'delivered_to_punkt') {
      order.status = 'delivered_to_punkt';
    }
    
    await order.save();

    // Populate for response
    await order.populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');

    res.status(200).json({
      success: true,
      message: 'Buyurtma contragentdan muvaffaqiyatli qabul qilindi',
      data: order,
    });
  } catch (error) {
    console.error('Error receiving from contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani qabul qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkt to punkt requests (boshqa punktlardan kelgan so'rovlar)
const getPunktToPunktRequests = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {
      'punktToPunktRequests.toPunktId': punkt._id,
    };

    if (status) {
      filter['punktToPunktRequests.status'] = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get orders with requests to this punkt
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
      .populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman')
      .populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Filter punktToPunktRequests to only show requests to this punkt
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.punktToPunktRequests = orderObj.punktToPunktRequests.filter(
        (req) => req.toPunktId._id.toString() === punkt._id.toString()
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
    console.error('Error fetching punkt to punkt requests:', error);
    res.status(500).json({
      success: false,
      message: 'So\'rovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Respond to punkt to punkt request (punktdan punktga so'rovga javob berish)
const respondToPunktToPunktRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { punkt } = req.user;
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

    // Find request to this punkt
    const requestIndex = order.punktToPunktRequests.findIndex(
      (req) => req.toPunktId.toString() === punkt._id.toString()
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sizga so\'rov yuborilmagan',
      });
    }

    const request = order.punktToPunktRequests[requestIndex];

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu so\'rovga allaqachon javob berilgan',
      });
    }

    // Update request status
    order.punktToPunktRequests[requestIndex].status = response;
    order.punktToPunktRequests[requestIndex].respondedAt = new Date();

    if (response === 'accepted') {
      // Update current punkt
      order.currentPunkt = punkt._id;
      // Update order status to confirmed_by_punkt
      if (order.status === 'pending' || order.status === 'requested_to_contragent') {
        order.status = 'confirmed_by_punkt';
      }
      // Confirm by this punkt
      order.confirmedByPunkt = punkt._id;
      order.punktStatus = 'confirmed';
    }

    await order.save();

    // If accepted, automatically route order based on product availability
    // Avtorouting o'chirilgan - punkt manual ravishda contragentga so'rov yuborishi kerak

    // Populate for response
    await order.populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman');
    await order.populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');

    res.status(200).json({
      success: true,
      message: response === 'accepted' ? 'So\'rov qabul qilindi' : 'So\'rov rad etildi',
      data: order,
    });
  } catch (error) {
    console.error('Error responding to punkt to punkt request:', error);

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

// Analyze order products and group by tuman (buyurtmadagi maxsulotlarni tuman bo'yicha tahlil qilish)
const analyzeOrderProductsByTuman = async (order, punkt) => {
  // Populate products with contragents if not already populated
  if (!order.items || order.items.length === 0) {
    return {
      ownTumanContragents: [],
      otherTumanPunkts: [],
      allProductsCovered: false,
    };
  }

  // Ensure products are populated
  await order.populate({
    path: 'items.product',
    populate: {
      path: 'contragent',
      select: '_id name inn phone viloyat tuman mfy status',
      populate: [
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
        { path: 'mfy', select: 'name type code' },
      ],
    },
  });

  const ownTumanContragents = new Map(); // contragentId -> { contragent, products: [] }
  const otherTumanPunkts = new Map(); // tumanId -> { tuman, contragents: Map(), products: [] }

  // Group products by contragent tuman
  for (const item of order.items) {
    if (!item.product || !item.product.contragent) {
      continue;
    }

    const contragent = item.product.contragent;
    const contragentTumanId = contragent.tuman?._id?.toString();

    // Check if contragent is in punkt's own tuman
    if (
      contragent.viloyat._id.toString() === punkt.viloyat._id.toString() &&
      punkt.tuman &&
      contragentTumanId === punkt.tuman._id.toString()
    ) {
      // Product is in punkt's own tuman
      const contragentId = contragent._id.toString();
      if (!ownTumanContragents.has(contragentId)) {
        ownTumanContragents.set(contragentId, {
          contragent: {
            _id: contragent._id,
            name: contragent.name,
            inn: contragent.inn,
            phone: contragent.phone,
            viloyat: contragent.viloyat,
            tuman: contragent.tuman,
            mfy: contragent.mfy,
            status: contragent.status,
          },
          products: [],
        });
      }
      ownTumanContragents.get(contragentId).products.push({
        _id: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      });
    } else if (
      contragent.viloyat._id.toString() === punkt.viloyat._id.toString() &&
      contragentTumanId
    ) {
      // Product is in another tuman of the same viloyat
      if (!otherTumanPunkts.has(contragentTumanId)) {
        otherTumanPunkts.set(contragentTumanId, {
          tuman: contragent.tuman,
          contragents: new Map(),
          products: [],
        });
      }

      const tumanData = otherTumanPunkts.get(contragentTumanId);
      const contragentId = contragent._id.toString();

      if (!tumanData.contragents.has(contragentId)) {
        tumanData.contragents.set(contragentId, {
          contragent: {
            _id: contragent._id,
            name: contragent.name,
            inn: contragent.inn,
            phone: contragent.phone,
            viloyat: contragent.viloyat,
            tuman: contragent.tuman,
            mfy: contragent.mfy,
            status: contragent.status,
          },
          products: [],
        });
      }

      tumanData.contragents.get(contragentId).products.push({
        _id: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      });
    }
  }

  // Convert maps to arrays
  const ownTumanContragentsArray = Array.from(ownTumanContragents.values());
  const otherTumanPunktsArray = Array.from(otherTumanPunkts.values()).map((tumanData) => ({
    tuman: tumanData.tuman,
    contragents: Array.from(tumanData.contragents.values()),
    products: tumanData.products,
  }));

  // Check if all products are covered
  const totalProductsInOrder = order.items.length;
  const productsInOwnTuman = ownTumanContragentsArray.reduce(
    (sum, c) => sum + c.products.length,
    0
  );
  const productsInOtherTumans = otherTumanPunktsArray.reduce(
    (sum, t) => sum + t.contragents.reduce((s, c) => s + c.products.length, 0),
    0
  );
  const allProductsCovered = totalProductsInOrder === productsInOwnTuman + productsInOtherTumans;

  return {
    ownTumanContragents: ownTumanContragentsArray,
    otherTumanPunkts: otherTumanPunktsArray,
    allProductsCovered,
  };
};

// Automatically route order based on product availability (avtomatik routing)
const autoRouteOrder = async (orderId, punkt) => {
  const order = await Order.findById(orderId)
    .populate('deliveryViloyat', 'name type code')
    .populate('deliveryTuman', 'name type code');

  if (!order) {
    throw new Error('Buyurtma topilmadi');
  }

  // Analyze products
  const analysis = await analyzeOrderProductsByTuman(order, punkt);

  const results = {
    ownTumanRequests: [],
    otherTumanRequests: [],
    errors: [],
  };

  // 1. Send requests to contragents in own tuman
  for (const contragentData of analysis.ownTumanContragents) {
    const contragentId = contragentData.contragent._id;

    // Check if request already exists (pending, accepted, yoki delivered_to_punkt bo'lsa, yana yubormaymiz)
    const existingRequest = order.contragentRequests.find(
      (req) => 
        req.contragentId.toString() === contragentId.toString() &&
        (req.status === 'pending' || req.status === 'accepted' || req.status === 'delivered_to_punkt')
    );

    if (!existingRequest) {
      order.contragentRequests.push({
        contragentId: contragentId,
        status: 'pending',
        requestedAt: new Date(),
      });
      results.ownTumanRequests.push({
        contragentId: contragentId,
        contragentName: contragentData.contragent.name,
        status: 'requested',
      });
    } else {
      results.ownTumanRequests.push({
        contragentId: contragentId,
        contragentName: contragentData.contragent.name,
        status: existingRequest.status,
      });
    }
  }

  // 2. Send requests to punkts in other tumans
  for (const tumanData of analysis.otherTumanPunkts) {
    const tumanId = tumanData.tuman._id;

    // Find active punkts in this tuman
    const punkts = await Punkt.find({
      tuman: tumanId,
      status: 'active',
      _id: { $ne: punkt._id },
    })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code');

    if (punkts.length === 0) {
      results.errors.push({
        tuman: tumanData.tuman.name,
        message: 'Bu tumanda faol punkt topilmadi',
      });
      continue;
    }

    // Send request to first active punkt (or all if needed)
    for (const toPunkt of punkts) {
      // Check if request already exists (pending, accepted, yoki delivered bo'lsa, yana yubormaymiz)
      const existingRequest = order.punktToPunktRequests.find(
        (req) =>
          req.fromPunktId.toString() === punkt._id.toString() &&
          req.toPunktId.toString() === toPunkt._id.toString() &&
          (req.status === 'pending' || req.status === 'accepted' || req.status === 'delivered')
      );

      if (!existingRequest) {
        order.punktToPunktRequests.push({
          fromPunktId: punkt._id,
          toPunktId: toPunkt._id,
          status: 'pending',
          requestedAt: new Date(),
        });
        results.otherTumanRequests.push({
          tumanId: tumanId,
          tumanName: tumanData.tuman.name,
          punktId: toPunkt._id,
          punktName: toPunkt.name,
          status: 'requested',
        });
      } else {
        results.otherTumanRequests.push({
          tumanId: tumanId,
          tumanName: tumanData.tuman.name,
          punktId: toPunkt._id,
          punktName: toPunkt.name,
          status: existingRequest.status,
        });
      }
    }
  }

  // Update order status
  if (order.status === 'pending' || order.status === 'confirmed_by_punkt') {
    if (results.ownTumanRequests.length > 0 || results.otherTumanRequests.length > 0) {
      order.status = 'requested_to_contragent';
    }
  }

  // Set current punkt
  order.currentPunkt = punkt._id;

  await order.save();

  return results;
};

// Get contragent IDs from order products (buyurtmadagi maxsulotlarning contragent ID'larini olish)
const getOrderContragentIds = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

    const order = await Order.findById(id)
      .populate({
        path: 'items.product',
        populate: {
          path: 'contragent',
          select: '_id name inn phone viloyat tuman mfy status',
          populate: [
            { path: 'viloyat', select: 'name type code' },
            { path: 'tuman', select: 'name type code' },
            { path: 'mfy', select: 'name type code' },
          ],
        },
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizning hududingizga tegishli emas',
      });
    }

    // Extract unique contragent IDs from order items
    const contragentMap = new Map();
    
    order.items.forEach((item) => {
      if (item.product && item.product.contragent) {
        const contragent = item.product.contragent;
        const contragentId = contragent._id.toString();
        
        if (!contragentMap.has(contragentId)) {
          // Check if contragent is in punkt's region
          const isInRegion = 
            contragent.viloyat._id.toString() === punkt.viloyat._id.toString() &&
            (!punkt.tuman || contragent.tuman._id.toString() === punkt.tuman._id.toString());
          
          contragentMap.set(contragentId, {
            _id: contragent._id,
            name: contragent.name,
            inn: contragent.inn,
            phone: contragent.phone,
            viloyat: contragent.viloyat,
            tuman: contragent.tuman,
            mfy: contragent.mfy,
            status: contragent.status,
            isInRegion, // Contragent punkt hududida bormi
            products: [], // Bu contragentning maxsulotlari
          });
        }
        
        // Add product to contragent's products list
        const contragentData = contragentMap.get(contragentId);
        contragentData.products.push({
          _id: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        });
      }
    });

    // Convert map to array
    const contragents = Array.from(contragentMap.values());

    // Check which contragents already have requests
    const existingRequestContragentIds = order.contragentRequests.map((req) =>
      req.contragentId.toString()
    );

    // Add request status to each contragent
    const contragentsWithStatus = contragents.map((contragent) => {
      const hasRequest = existingRequestContragentIds.includes(contragent._id.toString());
      const existingRequest = order.contragentRequests.find(
        (req) => req.contragentId.toString() === contragent._id.toString()
      );

      return {
        ...contragent,
        hasRequest,
        requestStatus: existingRequest ? existingRequest.status : null,
        requestedAt: existingRequest ? existingRequest.requestedAt : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        contragents: contragentsWithStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching order contragent IDs:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Contragent ID\'larni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get today's orders for punkt (bugungi buyurtmalar)
const getTodayOrders = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    // Today's date range (00:00 - 23:59)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Build filter - include orders in punkt's region OR orders where punkt is involved
    const orConditions = [];

    // Orders in punkt's region
    if (punkt.viloyat) {
      const regionCondition = { deliveryViloyat: punkt.viloyat._id };
    if (punkt.tuman) {
        regionCondition.deliveryTuman = punkt.tuman._id;
    }
      orConditions.push(regionCondition);
    }

    // Orders where punkt is current punkt
    orConditions.push({ currentPunkt: punkt._id });

    // Orders where punkt has punkt-to-punkt requests (to or from)
    orConditions.push({ 'punktToPunktRequests.fromPunktId': punkt._id });
    orConditions.push({ 'punktToPunktRequests.toPunktId': punkt._id });

    // Orders where punkt has old-style requests
    orConditions.push({ 'punktRequests.punktId': punkt._id });

    const filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      $or: orConditions,
    };

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
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
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
    console.error('Error fetching today orders for punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Bugungi buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order history for punkt (tarix - o'tgan kunlar)
const getOrderHistory = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Exclude today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    // Build date filter
    const dateFilter = { $lt: startOfToday };
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (end < startOfToday) {
        dateFilter.$lte = end;
      }
    }

    // Build filter - include orders in punkt's region OR orders where punkt is involved
    const orConditions = [];

    // Orders in punkt's region
    if (punkt.viloyat) {
      const regionCondition = { deliveryViloyat: punkt.viloyat._id };
    if (punkt.tuman) {
        regionCondition.deliveryTuman = punkt.tuman._id;
    }
      orConditions.push(regionCondition);
    }

    // Orders where punkt is current punkt
    orConditions.push({ currentPunkt: punkt._id });

    // Orders where punkt has punkt-to-punkt requests (to or from)
    orConditions.push({ 'punktToPunktRequests.fromPunktId': punkt._id });
    orConditions.push({ 'punktToPunktRequests.toPunktId': punkt._id });

    // Orders where punkt has old-style requests
    orConditions.push({ 'punktRequests.punktId': punkt._id });

    const filter = {
      createdAt: dateFilter,
      $or: orConditions,
    };

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
      .populate('confirmedByPunkt', 'name phone viloyat tuman')
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
    console.error('Error fetching order history for punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalar tarixini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Auto-route order endpoint (buyurtmani avtomatik routing qilish)
const autoRouteOrderEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { punkt } = req.user;

    const order = await Order.findById(id)
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to punkt's region or is current punkt
    if (
      order.deliveryViloyat._id.toString() !== punkt.viloyat._id.toString() ||
      (punkt.tuman && order.deliveryTuman && order.deliveryTuman._id.toString() !== punkt.tuman._id.toString())
    ) {
      // Check if this punkt is the current punkt
      if (!order.currentPunkt || order.currentPunkt.toString() !== punkt._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bu buyurtma sizning hududingizga tegishli emas',
        });
      }
    }

    // Analyze and route
    const analysis = await analyzeOrderProductsByTuman(order, punkt);
    const routingResults = await autoRouteOrder(order._id, punkt);

    // Reload order to get updated data
    await order.populate('contragentRequests.contragentId', 'name inn phone viloyat tuman mfy');
    await order.populate('punktToPunktRequests.fromPunktId', 'name phone viloyat tuman');
    await order.populate('punktToPunktRequests.toPunktId', 'name phone viloyat tuman');

    res.status(200).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli routing qilindi',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        analysis: {
          ownTumanContragents: analysis.ownTumanContragents,
          otherTumanPunkts: analysis.otherTumanPunkts,
          allProductsCovered: analysis.allProductsCovered,
        },
        routingResults,
        order: {
          contragentRequests: order.contragentRequests,
          punktToPunktRequests: order.punktToPunktRequests,
          status: order.status,
          currentPunkt: order.currentPunkt,
        },
      },
    });
  } catch (error) {
    console.error('Error in auto-route order:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani routing qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  confirmOrder,
  requestToPunkts,
  getPunktRequests,
  respondToRequest,
  assignOrderToAgent,
  requestToContragent,
  requestToPunkt,
  receiveFromPunkt,
  receiveFromContragent,
  getPunktToPunktRequests,
  respondToPunktToPunktRequest,
  getOrderContragentIds,
  getTodayOrders,
  getOrderHistory,
  analyzeOrderProductsByTuman,
  // autoRouteOrder va autoRouteOrderEndpoint o'chirilgan - avtorouting kerak emas
};

