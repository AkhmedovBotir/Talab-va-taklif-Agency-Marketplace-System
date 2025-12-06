const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const MarketplaceUser = require('../models/MarketplaceUser');
const Region = require('../models/Region');

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

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price originalPrice kpiBonusPercent quantity status',
    });

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
      const product = cartItem.product;

      // Check if product exists and is active
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'Ba\'zi maxsulotlar topilmadi',
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Maxsulot "${product.name}" hozir mavjud emas`,
        });
      }

      // Check if product has enough quantity
      if (product.quantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Maxsulot "${product.name}" uchun mavjud miqdor: ${product.quantity}. Siz ${cartItem.quantity} ta so\'rayapsiz`,
        });
      }

      // Calculate prices
      const itemPrice = product.price * cartItem.quantity;
      const itemOriginalPrice = product.originalPrice * cartItem.quantity;
      const itemKpiPrice = (itemPrice * product.kpiBonusPercent) / 100;

      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
        originalPrice: product.originalPrice,
        kpiBonusPercent: product.kpiBonusPercent,
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
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
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
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      deliveryViloyat,
      deliveryTuman: deliveryTuman || null,
      deliveryMfy: deliveryMfy || null,
      deliveryNote: deliveryNote || '',
      phoneNumber: orderPhoneNumber,
    });

    // Clear cart if requested
    if (clearCart) {
      cart.items = [];
      await cart.save();
    }

    // Populate order items and delivery regions
    await order.populate({
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
    });

    // Populate delivery regions
    await order.populate([
      { path: 'deliveryViloyat', select: 'name type code' },
      { path: 'deliveryTuman', select: 'name type code' },
      { path: 'deliveryMfy', select: 'name type code' },
    ]);

    // Remove kpiBonusPercent from product objects in response
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.map((item) => {
      if (item.product) {
        // Check if product is a Mongoose document or already an object
        const productObj = item.product.toObject ? item.product.toObject() : item.product;
        delete productObj.kpiBonusPercent;
        return {
          ...item,
          product: productObj,
        };
      }
      return item;
    });

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
        ],
      })
      .populate([
        { path: 'deliveryViloyat', select: 'name type code' },
        { path: 'deliveryTuman', select: 'name type code' },
        { path: 'deliveryMfy', select: 'name type code' },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Remove kpiBonusPercent from product objects
    const ordersWithoutKpi = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item) => {
        if (item.product) {
          // Check if product is a Mongoose document or already an object
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
        // Check if product is a Mongoose document or already an object
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

    // Return products to inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    // Populate order items and delivery regions
    await order.populate({
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
      ],
    });

    await order.populate([
      { path: 'deliveryViloyat', select: 'name type code' },
      { path: 'deliveryTuman', select: 'name type code' },
      { path: 'deliveryMfy', select: 'name type code' },
    ]);

    // Remove kpiBonusPercent from product objects
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.map((item) => {
      if (item.product) {
        // Check if product is a Mongoose document or already an object
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

    // Check if order is confirmed by agent
    if (!order.confirmedByAgent) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma hali agent tomonidan tasdiqlanmagan',
      });
    }

    // Update order
    order.customerConfirmed = true;
    order.customerConfirmedAt = new Date();
    
    // Update order status
    if (order.status === 'confirmed_by_agent') {
      order.status = 'confirmed_by_customer';
    }
    
    await order.save();

    // Calculate and create KPI bonus transactions
    try {
      const { calculateAndCreateKpiBonus } = require('../utils/kpiBonusCalculator');
      await calculateAndCreateKpiBonus(order._id, order.status);
    } catch (error) {
      console.error('Error calculating KPI bonus:', error);
      // Don't fail the request if KPI calculation fails
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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmDelivery,
};

