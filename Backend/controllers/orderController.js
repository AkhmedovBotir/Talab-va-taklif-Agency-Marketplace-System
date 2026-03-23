const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const MaxallaProduct = require('../models/MaxallaProduct');
const BaseProduct = require('../models/BaseProduct');
const MarketplaceUser = require('../models/MarketplaceUser');
const Region = require('../models/Region');

// Helper function to populate order item product based on type
const populateOrderItemProduct = async (item) => {
  if (item.productType === 'maxalla') {
    const maxallaProduct = await MaxallaProduct.findById(item.product)
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
      });

    if (!maxallaProduct) return null;

    // Transform to marketplace format
    const bp = maxallaProduct.baseProduct;
    return {
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
      productType: 'maxalla',
    };
  } else {
    const product = await Product.findById(item.product)
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

    if (!product) return null;

    const productObj = product.toObject();
    delete productObj.kpiBonusPercent;
    productObj.productType = 'tuman';
    return productObj;
  }
};

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      paymentMethod,
      deliveryViloyat,
      deliveryTuman,
      deliveryMfy,
      deliveryNote,
      phoneNumber,
      clearCart = true,
      deliveryAddress, // Old field - will be ignored
      orderType = 'tuman', // 'tuman' or 'dokon'
    } = req.body;

    // Check if old deliveryAddress is being used
    if (deliveryAddress && !deliveryViloyat) {
      return res.status(400).json({
        success: false,
        message: 'deliveryAddress field\'i endi ishlatilmaydi. Iltimos, deliveryViloyat, deliveryTuman va deliveryMfy field\'larini ishlating',
        errors: [
          {
            field: 'deliveryAddress',
            message: 'Bu field endi ishlatilmaydi. deliveryViloyat, deliveryTuman va deliveryMfy field\'larini ishlating',
          },
        ],
      });
    }

    // Validate required fields
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'To\'lov usuli kiritilishi shart',
        errors: [
          {
            field: 'paymentMethod',
            message: 'To\'lov usuli kiritilishi shart',
          },
        ],
      });
    }

    if (!deliveryViloyat) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazib berish viloyati kiritilishi shart',
        errors: [
          {
            field: 'deliveryViloyat',
            message: 'Yetkazib berish viloyati kiritilishi shart',
          },
        ],
      });
    }

    // Validate region IDs
    try {
      const viloyat = await Region.findById(deliveryViloyat);
      if (!viloyat) {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi',
        });
      }
      if (viloyat.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri viloyat ID - bu region emas',
        });
      }

      if (deliveryTuman) {
        const tuman = await Region.findById(deliveryTuman).populate('parent');
        if (!tuman) {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi',
          });
        }
        if (tuman.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Noto\'g\'ri tuman ID - bu district emas',
          });
        }
        if (tuman.parent && tuman.parent._id.toString() !== deliveryViloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman viloyatga tegishli emas',
          });
        }
      }

      if (deliveryMfy) {
        const mfy = await Region.findById(deliveryMfy).populate('parent');
        if (!mfy) {
          return res.status(400).json({
            success: false,
            message: 'MFY topilmadi',
          });
        }
        if (mfy.type !== 'mfy') {
          return res.status(400).json({
            success: false,
            message: 'Noto\'g\'ri MFY ID - bu MFY emas',
          });
        }
        if (deliveryTuman && mfy.parent && mfy.parent._id.toString() !== deliveryTuman.toString()) {
          return res.status(400).json({
            success: false,
            message: 'MFY tumanaga tegishli emas',
          });
        }
      }
    } catch (regionError) {
      // Handle invalid ObjectId format
      if (regionError.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri region ID formati',
        });
      }
      throw regionError; // Re-throw if it's a different error
    }

    // Get user's tuman cart (without populate - we'll handle it manually)
    const cart = await Cart.findOne({ user: userId, cartType: 'tuman' });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Korzinka bo\'sh',
      });
    }

    // Get user for default phone number
    const user = await MarketplaceUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Validate and prepare order items
    const orderItems = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    let totalKpiPrice = 0;
    let itemCount = 0;

    for (const cartItem of cart.items) {
      const productType = cartItem.productType || 'tuman';
      let product;

      // Get product based on type
      if (productType === 'maxalla') {
        product = await MaxallaProduct.findById(cartItem.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: 'Ba\'zi maxalla maxsulotlar topilmadi',
          });
        }
      } else {
        product = await Product.findById(cartItem.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: 'Ba\'zi maxsulotlar topilmadi',
          });
        }
      }

      // Check if product exists and is active
      if (product.status !== 'active') {
        const productName = productType === 'maxalla' 
          ? (product.baseProduct?.name || 'Maxalla maxsulot')
          : product.name;
        return res.status(400).json({
          success: false,
          message: `Maxsulot "${productName}" hozir mavjud emas`,
        });
      }

      // For tuman products, also check moderationStatus
      if (productType === 'tuman' && product.moderationStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: `Maxsulot "${product.name}" hozir mavjud emas`,
        });
      }

      // Check if product has enough quantity
      if (product.quantity < cartItem.quantity) {
        const productName = productType === 'maxalla' 
          ? (product.baseProduct?.name || 'Maxalla maxsulot')
          : product.name;
        return res.status(400).json({
          success: false,
          message: `Maxsulot "${productName}" uchun mavjud miqdor: ${product.quantity}. Siz ${cartItem.quantity} ta so\'rayapsiz`,
        });
      }

      // Calculate prices
      const itemPrice = product.price * cartItem.quantity;
      const itemOriginalPrice = product.originalPrice * cartItem.quantity;
      // KPI hisoblash: foyda (price - originalPrice) asosida
      // Formula: (price - originalPrice) * quantity * kpiBonusPercent / 100
      // Masalan: price = 65000, originalPrice = 50000, quantity = 1, kpiBonusPercent = 30%
      // Foyda = 65000 - 50000 = 15000 so'm
      // KPI miqdori = 15000 * 1 * 30 / 100 = 4500 so'm
      const profitPerUnit = product.price - product.originalPrice;
      const itemKpiPrice = productType === 'tuman' && product.kpiBonusPercent
        ? (profitPerUnit * cartItem.quantity * product.kpiBonusPercent) / 100
        : 0;

      orderItems.push({
        product: product._id,
        productType,
        productModel: productType === 'maxalla' ? 'MaxallaProduct' : 'Product',
        quantity: cartItem.quantity,
        price: product.price,
        originalPrice: product.originalPrice,
        kpiBonusPercent: productType === 'tuman' ? (product.kpiBonusPercent || 0) : null,
      });

      totalPrice += itemPrice;
      totalOriginalPrice += itemOriginalPrice;
      totalKpiPrice += itemKpiPrice;
      itemCount += cartItem.quantity;
    }

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Use provided phone number or user's default phone
    const orderPhoneNumber = phoneNumber || user.phone;

    // Decrease product quantities (reserve products for order)
    for (const item of orderItems) {
      if (item.productType === 'maxalla') {
        await MaxallaProduct.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
      }
    }

    // Find punkt in customer's district to automatically assign order
    const Punkt = require('../models/Punkt');
    let assignedPunkt = null;
    
    if (deliveryTuman) {
      // Try to find active punkt in customer's tuman
      assignedPunkt = await Punkt.findOne({
        tuman: deliveryTuman,
        viloyat: deliveryViloyat,
        status: 'active',
      });
    }
    
    // If no punkt found in tuman, try to find any active punkt in viloyat
    if (!assignedPunkt) {
      assignedPunkt = await Punkt.findOne({
        viloyat: deliveryViloyat,
        status: 'active',
      });
    }

    // Determine orderType if not provided
    // If orderType is 'dokon', don't assign punkt
    const finalOrderType = orderType === 'dokon' ? 'dokon' : 'tuman';
    const finalAssignedPunkt = finalOrderType === 'dokon' ? null : (assignedPunkt ? assignedPunkt._id : null);

    // Create order
    const order = await Order.create({
      user: userId,
      orderNumber,
      items: orderItems,
      totalPrice,
      totalOriginalPrice,
      totalKpiPrice,
      itemCount,
      orderType: finalOrderType,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      deliveryViloyat,
      deliveryTuman: deliveryTuman || null,
      deliveryMfy: deliveryMfy || null,
      deliveryNote: deliveryNote || '',
      phoneNumber: orderPhoneNumber,
      currentPunkt: finalAssignedPunkt,
    });

    // Clear cart if requested
    if (clearCart) {
      cart.items = [];
      await cart.save();
    }

    // Populate delivery regions
    await order.populate([
      { path: 'deliveryViloyat', select: 'name type code' },
      { path: 'deliveryTuman', select: 'name type code' },
      { path: 'deliveryMfy', select: 'name type code' },
    ]);

    // Populate order items manually (supports both product types)
    const orderObj = order.toObject();
    const populatedItems = [];
    for (const item of orderObj.items) {
      const populatedProduct = await populateOrderItemProduct(item);
      if (populatedProduct) {
        populatedItems.push({
          ...item,
          product: populatedProduct,
        });
      }
    }
    orderObj.items = populatedItems;

    // Invalidate cache

    res.status(201).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli yaratildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error creating order:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = [];
      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.keys(error.errors).forEach((key) => {
          errors.push({
            field: key,
            message: error.errors[key].message || error.errors[key].toString(),
          });
        });
      } else {
        // If error.errors is empty, use error.message
        errors.push({
          field: 'general',
          message: error.message || 'Validatsiya xatosi',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors: errors,
      });
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Noto'g'ri ${error.path} ID formati`,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      // Duplicate order number (shouldn't happen, but handle it)
      return res.status(500).json({
        success: false,
        message: 'Buyurtma raqami yaratishda xatolik yuz berdi. Qayta urinib ko\'ring',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtma yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get user's orders
const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Populate order items manually (supports both product types)
    const ordersWithoutKpi = [];
    for (const order of orders) {
      const orderObj = order.toObject();
      const populatedItems = [];
      for (const item of orderObj.items) {
        const populatedProduct = await populateOrderItemProduct(item);
        if (populatedProduct) {
          populatedItems.push({
            ...item,
            product: populatedProduct,
          });
        }
      }
      orderObj.items = populatedItems;
      ordersWithoutKpi.push(orderObj);
    }

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
    console.error('Error fetching orders:', error);

    // Handle Mongoose cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Noto'g'ri ${error.path} ID formati`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
      ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Populate order items manually (supports both product types)
    const orderObj = order.toObject();
    const populatedItems = [];
    for (const item of orderObj.items) {
      const populatedProduct = await populateOrderItemProduct(item);
      if (populatedProduct) {
        populatedItems.push({
          ...item,
          product: populatedProduct,
        });
      }
    }
    orderObj.items = populatedItems;

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

// Cancel order (return products to inventory)
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Only allow cancellation if order is pending
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Faqat "pending" holatdagi buyurtmalarni bekor qilish mumkin',
      });
    }

    // Return products to inventory (supports both types)
    for (const item of order.items) {
      if (item.productType === 'maxalla') {
        await MaxallaProduct.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    // Populate delivery regions
    await order.populate([
      { path: 'deliveryViloyat', select: 'name type code' },
      { path: 'deliveryTuman', select: 'name type code' },
      { path: 'deliveryMfy', select: 'name type code' },
    ]);

    // Populate order items manually (supports both product types)
    const orderObj = order.toObject();
    const populatedItems = [];
    for (const item of orderObj.items) {
      const populatedProduct = await populateOrderItemProduct(item);
      if (populatedProduct) {
        populatedItems.push({
          ...item,
          product: populatedProduct,
        });
      }
    }
    orderObj.items = populatedItems;

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Buyurtma bekor qilindi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = [];
      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.keys(error.errors).forEach((key) => {
          errors.push({
            field: key,
            message: error.errors[key].message || error.errors[key].toString(),
          });
        });
      } else {
        // If error.errors is empty, use error.message
        errors.push({
          field: 'general',
          message: error.message || 'Validatsiya xatosi',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors: errors,
      });
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri buyurtma ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Buyurtmani bekor qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Confirm delivery by customer (foydalanuvchi buyurtmani olganini tasdiqlash)
const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user; // MarketplaceUser ID

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order belongs to this user
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga tegishli emas',
      });
    }

    // Check if order is already confirmed by customer
    if (order.customerConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma allaqachon tasdiqlangan',
      });
    }

    const FinanceTransaction = require('../models/FinanceTransaction');
    const isTumanWithAgent = order.assignedToAgent != null;
    const isMaxallaWithDelivery = order.contragentRequests && order.contragentRequests.some(
      (r) => r.deliveryProvider && r.status === 'delivered'
    );

    if (isTumanWithAgent) {
      if (!order.confirmedByAgent) {
        return res.status(400).json({
          success: false,
          message: 'Buyurtma hali agent tomonidan tasdiqlanmagan',
        });
      }
    } else if (isMaxallaWithDelivery) {
      // Maxalla: yetkazuvchi allaqachon "yetkazdi" deb belgilagan bo'lishi kerak
      // (hech qanday qo'shimcha tekshiruv shart emas)
    } else {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma hali yetkazib berilmagan yoki yetkazuvchi tomonidan tasdiqlanmagan',
      });
    }

    // Update order
    order.customerConfirmed = true;
    order.customerConfirmedAt = new Date();
    if (order.status === 'confirmed_by_agent' || isMaxallaWithDelivery) {
      order.status = 'confirmed_by_customer';
    }
    if (isMaxallaWithDelivery) {
      order.deliveredAt = new Date();
    }
    await order.save();

    // Create payment transaction(s)
    try {
      if (isTumanWithAgent) {
        const existingPayment = await FinanceTransaction.findOne({
          order: order._id,
          category: 'agent_received_from_customer',
          status: 'completed',
        });
        if (!existingPayment) {
          await FinanceTransaction.create({
            type: 'income',
            category: 'agent_received_from_customer',
            amount: order.totalPrice,
            order: order._id,
            description: `Mijoz tomonidan agentga buyurtma uchun to'lov qilindi`,
            fromUser: { userType: 'MarketplaceUser', userId },
            toUser: { userType: 'Agent', userId: order.assignedToAgent },
            status: 'completed',
            completedAt: new Date(),
          });
        }
      } else if (isMaxallaWithDelivery) {
        // Maxalla: har bir "delivered" request uchun mijoz → kontragent to'lovi
        const deliveredRequests = order.contragentRequests.filter((r) => r.status === 'delivered');
        for (const req of deliveredRequests) {
          const existingPayment = await FinanceTransaction.findOne({
            order: order._id,
            contragentRequest: req._id,
            category: 'contragent_received_from_marketplace',
            status: 'completed',
          });
          if (existingPayment) continue;
          let amount = 0;
          (req.itemIds || []).forEach((idx) => {
            if (order.items[idx]) {
              const item = order.items[idx];
              amount += item.price * item.quantity;
            }
          });
          if (amount > 0) {
            await FinanceTransaction.create({
              type: 'income',
              category: 'contragent_received_from_marketplace',
              amount,
              order: order._id,
              contragentRequest: req._id,
              description: `Mijoz tomonidan maxalla yetkazuvchi yetkazgan buyurtma uchun to'lov`,
              fromUser: { userType: 'MarketplaceUser', userId },
              toUser: { userType: 'Contragent', userId: req.contragentId },
              status: 'completed',
              completedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error creating customer payment transaction:', error);
    }

    // Calculate and create KPI bonus transactions (faqat tuman buyurtmalari uchun)
    if (isTumanWithAgent) {
      try {
        const { calculateAndCreateKpiBonus } = require('../utils/kpiBonusCalculator');
        await calculateAndCreateKpiBonus(order._id, order.status);
      } catch (error) {
        console.error('Error calculating KPI bonus:', error);
      }
    }

    // Punkt kontragentga qolgan summalarni to'lash (mijoz tasdiqlagandan keyin, faqat tuman)
    try {
      const FinanceTransaction = require('../models/FinanceTransaction');
      
      // Check if order is tuman type and has contragent requests
      if (order.orderType === 'tuman' && order.contragentRequests && order.contragentRequests.length > 0) {
        // Find delivered contragent requests
        const deliveredRequests = order.contragentRequests.filter(
          (req) => req.status === 'delivered_to_punkt'
        );

        for (const contragentRequest of deliveredRequests) {
          // Check if final payment already exists
          const existingFinalPayment = await FinanceTransaction.findOne({
            order: order._id,
            contragentRequest: contragentRequest._id,
            category: 'punkt_to_contragent_final_payment',
            status: 'completed',
          });

          if (!existingFinalPayment) {
            // Get zaklad transaction first
            const zakladTransaction = await FinanceTransaction.findOne({
              order: order._id,
              contragentRequest: contragentRequest._id,
              category: 'punkt_to_contragent_zaklad',
              status: 'completed',
            });

            // Calculate remaining original price and profit
            let totalOriginalPrice = 0;
            let totalPrice = 0;

            const requestItemIds = contragentRequest.itemIds || [];
            requestItemIds.forEach((itemIndex) => {
              if (order.items[itemIndex]) {
                const item = order.items[itemIndex];
                totalOriginalPrice += item.originalPrice * item.quantity;
                totalPrice += item.price * item.quantity;
              }
            });

            // Get zaklad amount if exists
            const zakladAmount = zakladTransaction ? zakladTransaction.amount : 0;

            // Remaining original price calculation:
            // Zaklad is paid from price (price * percentage), but we need to pay remaining original price
            // If zaklad was paid, we calculate what portion of original it represents
            // For simplicity: if zaklad > 0, remaining = total original - (zaklad * original/price ratio)
            // If zaklad = 0, remaining = total original
            let remainingOriginalPrice = totalOriginalPrice;
            if (zakladAmount > 0 && totalPrice > 0) {
              // Calculate zaklad as percentage of original (proportional)
              const zakladAsOriginal = (zakladAmount * totalOriginalPrice) / totalPrice;
              remainingOriginalPrice = totalOriginalPrice - zakladAsOriginal;
            }
            
            // Profit = total price - total original (for items in this request)
            const profitAmount = totalPrice - totalOriginalPrice;

            // Create transaction for remaining original price
            if (remainingOriginalPrice > 0) {
              await FinanceTransaction.create({
                type: 'expense', // Punkt uchun chiqim
                category: 'punkt_to_contragent_final_payment',
                amount: remainingOriginalPrice,
                order: order._id,
                contragentRequest: contragentRequest._id,
                description: `Punkt tomonidan kontragentga qolgan asl narx to'landi`,
                fromUser: {
                  userType: 'Punkt',
                  userId: order.assignedByPunkt || order.currentPunkt,
                },
                toUser: {
                  userType: 'Contragent',
                  userId: contragentRequest.contragentId,
                },
                status: 'completed',
                completedAt: new Date(),
              });
            }

            // Create transaction for profit (sof foyda)
            if (profitAmount > 0) {
              await FinanceTransaction.create({
                type: 'expense', // Punkt uchun chiqim
                category: 'punkt_to_contragent_profit',
                amount: profitAmount,
                order: order._id,
                contragentRequest: contragentRequest._id,
                description: `Punkt tomonidan kontragentga sof foyda to'landi`,
                fromUser: {
                  userType: 'Punkt',
                  userId: order.assignedByPunkt || order.currentPunkt,
                },
                toUser: {
                  userType: 'Contragent',
                  userId: contragentRequest.contragentId,
                },
                status: 'completed',
                completedAt: new Date(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating final payment transactions:', error);
      // Don't fail the request if payment transaction creation fails
    }

    // Populate for response
    await order.populate('user', 'name phone');
    await order.populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'contragent', select: 'name inn phone' },
      ],
    });
    await order.populate('confirmedByAgent', 'name phone viloyat tuman mfy');

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

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli tasdiqlandi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error confirming delivery:', error);

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

// Create order from maxalla cart
const createMaxallaOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      paymentMethod,
      deliveryViloyat,
      deliveryTuman,
      deliveryMfy,
      deliveryNote,
      phoneNumber,
      clearCart = true,
    } = req.body;

    // Validate required fields
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'To\'lov usuli kiritilishi shart',
        errors: [
          {
            field: 'paymentMethod',
            message: 'To\'lov usuli kiritilishi shart',
          },
        ],
      });
    }

    if (!deliveryViloyat) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazib berish viloyati kiritilishi shart',
        errors: [
          {
            field: 'deliveryViloyat',
            message: 'Yetkazib berish viloyati kiritilishi shart',
          },
        ],
      });
    }

    // Validate region IDs
    try {
      const viloyat = await Region.findById(deliveryViloyat);
      if (!viloyat) {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi',
        });
      }
      if (viloyat.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri viloyat ID - bu region emas',
        });
      }

      if (deliveryTuman) {
        const tuman = await Region.findById(deliveryTuman).populate('parent');
        if (!tuman) {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi',
          });
        }
        if (tuman.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Noto\'g\'ri tuman ID - bu district emas',
          });
        }
        if (tuman.parent && tuman.parent._id.toString() !== deliveryViloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman viloyatga tegishli emas',
          });
        }
      }

      if (deliveryMfy) {
        const mfy = await Region.findById(deliveryMfy).populate('parent');
        if (!mfy) {
          return res.status(400).json({
            success: false,
            message: 'MFY topilmadi',
          });
        }
        if (mfy.type !== 'mfy') {
          return res.status(400).json({
            success: false,
            message: 'Noto\'g\'ri MFY ID - bu MFY emas',
          });
        }
        if (deliveryTuman && mfy.parent && mfy.parent._id.toString() !== deliveryTuman.toString()) {
          return res.status(400).json({
            success: false,
            message: 'MFY tumanaga tegishli emas',
          });
        }
      }
    } catch (regionError) {
      if (regionError.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri region ID formati',
        });
      }
      throw regionError;
    }

    // Get user's maxalla cart
    const cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Maxalla korzinka bo\'sh',
      });
    }

    // Get user for default phone number
    const user = await MarketplaceUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Validate and prepare order items
    const orderItems = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    let totalKpiPrice = 0; // Maxalla products don't have KPI
    let itemCount = 0;

    for (const cartItem of cart.items) {
      // Only process maxalla products
      if (cartItem.productType !== 'maxalla') continue;

      const product = await MaxallaProduct.findById(cartItem.product)
        .populate('baseProduct', 'name');

      // Check if product exists and is active
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Ba\'zi maxalla maxsulotlar topilmadi',
        });
      }

      if (product.status !== 'active') {
        const productName = product.baseProduct?.name || 'Maxalla maxsulot';
        return res.status(400).json({
          success: false,
          message: `Maxalla maxsuloti "${productName}" hozir mavjud emas`,
        });
      }

      // Check if product has enough quantity
      if (product.quantity < cartItem.quantity) {
        const productName = product.baseProduct?.name || 'Maxalla maxsulot';
        return res.status(400).json({
          success: false,
          message: `Maxalla maxsuloti "${productName}" uchun mavjud miqdor: ${product.quantity}. Siz ${cartItem.quantity} ta so\'rayapsiz`,
        });
      }

      // Calculate prices
      const itemPrice = product.price * cartItem.quantity;
      const itemOriginalPrice = product.originalPrice * cartItem.quantity;

      orderItems.push({
        product: product._id,
        productType: 'maxalla',
        productModel: 'MaxallaProduct',
        quantity: cartItem.quantity,
        price: product.price,
        originalPrice: product.originalPrice,
        kpiBonusPercent: null, // Maxalla products don't have KPI
      });

      totalPrice += itemPrice;
      totalOriginalPrice += itemOriginalPrice;
      totalKpiPrice += 0; // No KPI for maxalla products
      itemCount += cartItem.quantity;
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Maxalla korzinkada maxalla maxsulotlari yo\'q',
      });
    }

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Use provided phone number or user's default phone
    const orderPhoneNumber = phoneNumber || user.phone;

    // Decrease product quantities (reserve products for order)
    const Contragent = require('../models/Contragent');
    const contragentMap = new Map(); // Track contragents and their item indices
    
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      await MaxallaProduct.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
      
      // Get maxalla product with contragent
      const maxallaProduct = await MaxallaProduct.findById(item.product)
        .populate('contragent', '_id');
      
      if (maxallaProduct && maxallaProduct.contragent) {
        const contragentId = maxallaProduct.contragent._id.toString();
        if (!contragentMap.has(contragentId)) {
          contragentMap.set(contragentId, []);
        }
        contragentMap.get(contragentId).push(i);
      }
    }

    // Create order
    const order = await Order.create({
      user: userId,
      orderNumber,
      items: orderItems,
      totalPrice,
      totalOriginalPrice,
      totalKpiPrice,
      itemCount,
      status: 'requested_to_contragent', // Maxalla orders go directly to contragent
      paymentStatus: 'pending',
      paymentMethod,
      deliveryViloyat,
      deliveryTuman: deliveryTuman || null,
      deliveryMfy: deliveryMfy || null,
      deliveryNote: deliveryNote || '',
      phoneNumber: orderPhoneNumber,
      currentPunkt: null, // Maxalla orders don't go through punkt
      contragentRequests: [], // Will be populated below
    });

    // Send requests directly to maxalla contragents
    const contragentRequests = [];
    for (const [contragentId, itemIndices] of contragentMap.entries()) {
      // Verify contragent is maxalla level
      const contragent = await Contragent.findById(contragentId);
      if (contragent && contragent.contragentLevel === 'mfy' && contragent.status === 'active') {
        contragentRequests.push({
          contragentId: contragent._id,
          itemIds: itemIndices,
          status: 'pending',
          requestedAt: new Date(),
        });
      }
    }

    // Update order with contragent requests
    if (contragentRequests.length > 0) {
      order.contragentRequests = contragentRequests;
      await order.save();
    }

    // Clear cart if requested
    if (clearCart) {
      cart.items = [];
      await cart.save();
    }

    // Populate delivery regions
    await order.populate([
      { path: 'deliveryViloyat', select: 'name type code' },
      { path: 'deliveryTuman', select: 'name type code' },
      { path: 'deliveryMfy', select: 'name type code' },
    ]);

    // Populate order items manually (maxalla products)
    const orderObj = order.toObject();
    const populatedItems = [];
    for (const item of orderObj.items) {
      const populatedProduct = await populateOrderItemProduct(item);
      if (populatedProduct) {
        populatedItems.push({
          ...item,
          product: populatedProduct,
        });
      }
    }
    orderObj.items = populatedItems;

    res.status(201).json({
      success: true,
      message: 'Maxalla buyurtmasi muvaffaqiyatli yaratildi',
      data: orderObj,
    });
  } catch (error) {
    console.error('Error creating maxalla order:', error);

    if (error.name === 'ValidationError') {
      const errors = [];
      if (error.errors && Object.keys(error.errors).length > 0) {
        Object.keys(error.errors).forEach((key) => {
          errors.push({
            field: key,
            message: error.errors[key].message || error.errors[key].toString(),
          });
        });
      } else {
        errors.push({
          field: 'general',
          message: error.message || 'Validatsiya xatosi',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        errors: errors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Noto'g'ri ${error.path} ID formati`,
      });
    }

    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        message: 'Buyurtma raqami yaratishda xatolik yuz berdi. Qayta urinib ko\'ring',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxalla buyurtmasi yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Maxalla buyurtma to'lov holati (yetkazuvchi yetkazgan buyurtma)
const getMaxallaOrderPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bu buyurtma sizga tegishli emas' });
    }

    const hasDelivered = order.contragentRequests && order.contragentRequests.some((r) => r.status === 'delivered');
    const FinanceTransaction = require('../models/FinanceTransaction');
    const payments = await FinanceTransaction.find({
      order: order._id,
      category: 'contragent_received_from_marketplace',
      status: 'completed',
    }).populate('toUser.userId', 'name phone');

    const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0);
    const paymentStatus = payments.length > 0 && hasDelivered ? 'paid' : (hasDelivered ? 'unpaid' : 'awaiting_delivery');

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        paymentStatus,
        totalPaid,
        transactions: payments,
        deliveredByProvider: hasDelivered,
      },
    });
  } catch (error) {
    console.error('Error getting maxalla payment status:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri buyurtma ID' });
    }
    res.status(500).json({ success: false, message: 'To\'lov holatini olishda xatolik', error: error.message });
  }
};

// Maxalla buyurtma uchun to'lov qilish (yetkazuvchi yetkazganidan keyin, alohida to'lov API)
const payMaxallaOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bu buyurtma sizga tegishli emas' });
    }

    const deliveredRequests = order.contragentRequests && order.contragentRequests.filter((r) => r.status === 'delivered');
    if (!deliveredRequests || deliveredRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazuvchi hali buyurtmani yetkazib berganini belgilamagan',
      });
    }

    const FinanceTransaction = require('../models/FinanceTransaction');
    let created = 0;
    for (const req of deliveredRequests) {
      const existingPayment = await FinanceTransaction.findOne({
        order: order._id,
        contragentRequest: req._id,
        category: 'contragent_received_from_marketplace',
        status: 'completed',
      });
      if (existingPayment) continue;
      let amount = 0;
      (req.itemIds || []).forEach((idx) => {
        if (order.items[idx]) {
          const item = order.items[idx];
          amount += item.price * item.quantity;
        }
      });
      if (amount > 0) {
        await FinanceTransaction.create({
          type: 'income',
          category: 'contragent_received_from_marketplace',
          amount,
          order: order._id,
          contragentRequest: req._id,
          description: `Mijoz tomonidan maxalla yetkazuvchi yetkazgan buyurtma uchun to'lov`,
          fromUser: { userType: 'MarketplaceUser', userId },
          toUser: { userType: 'Contragent', userId: req.contragentId },
          status: 'completed',
          completedAt: new Date(),
        });
        created++;
      }
    }

    if (created === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma uchun to\'lov allaqachon amalga oshirilgan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi',
      data: { orderId: order._id, transactionsCreated: created },
    });
  } catch (error) {
    console.error('Error paying maxalla order:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri buyurtma ID' });
    }
    res.status(500).json({ success: false, message: 'To\'lov amalga oshirishda xatolik', error: error.message });
  }
};

module.exports = {
  createOrder,
  createMaxallaOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmDelivery,
  getMaxallaOrderPaymentStatus,
  payMaxallaOrder,
};

