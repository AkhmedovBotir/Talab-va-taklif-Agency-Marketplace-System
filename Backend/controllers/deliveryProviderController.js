const DeliveryProvider = require('../models/DeliveryProvider');
const Order = require('../models/Order');
const Contragent = require('../models/Contragent');
const Product = require('../models/Product');
const MaxallaProduct = require('../models/MaxallaProduct');
const bcrypt = require('bcrypt');

// Helper: populate order item product so that `product` qaytadi, faqat ID emas
const populateDeliveryOrderItemProduct = async (item) => {
  // Maxalla mahsulot
  if (item.productType === 'maxalla') {
    // Agar allaqachon populate qilingan bo'lsa, DB ga qayta so'rov yubormaymiz
    if (item.product && item.product.baseProduct) {
      const maxallaProduct = item.product;
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
    }

    // Aks holda DB dan to'liq ma'lumotni olib kelamiz
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

    if (!maxallaProduct || !maxallaProduct.baseProduct) return null;

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
  }

  // Tuman mahsulot
  if (item.product) {
    // Agar allaqachon populate qilingan bo'lsa
    if (item.product.category || item.product.name) {
      const productObj = { ...item.product };
      delete productObj.kpiBonusPercent;
      productObj.productType = 'tuman';
      return productObj;
    }
  }

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
};

// Get current delivery provider profile
const getMyProfile = async (req, res) => {
  try {
    const deliveryProviderId = req.user.userId;

    const deliveryProvider = await DeliveryProvider.findOne({
      _id: deliveryProviderId,
      status: 'active',
      isDeleted: { $ne: true },
    })
      .populate('contragent', 'name phone viloyat tuman mfy contragentLevel')
      .select('-password');

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: deliveryProvider,
    });
  } catch (error) {
    console.error('Error getting delivery provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update delivery provider profile
const updateMyProfile = async (req, res) => {
  try {
    const deliveryProviderId = req.user.userId;
    const { name, phone, notes } = req.body;

    const deliveryProvider = await DeliveryProvider.findById(deliveryProviderId);

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi',
      });
    }

    if (deliveryProvider.isDeleted || deliveryProvider.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Yetkazib beruvchi faol emas',
      });
    }

    // Update fields
    if (name !== undefined) {
      deliveryProvider.name = name;
    }
    if (phone !== undefined) {
      // Check if phone is already taken by another delivery provider of the same contragent
      const existingProvider = await DeliveryProvider.findOne({
        phone,
        contragent: deliveryProvider.contragent,
        _id: { $ne: deliveryProviderId },
        isDeleted: { $ne: true },
      });

      if (existingProvider) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon ishlatilmoqda',
        });
      }
      deliveryProvider.phone = phone;
    }
    if (notes !== undefined) {
      deliveryProvider.notes = notes;
    }

    await deliveryProvider.save();

    await deliveryProvider.populate('contragent', 'name phone viloyat tuman mfy contragentLevel');

    res.status(200).json({
      success: true,
      message: 'Profil muvaffaqiyatli yangilandi',
      data: deliveryProvider,
    });
  } catch (error) {
    console.error('Error updating delivery provider profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const deliveryProviderId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol va yangi parol kiritilishi shart',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Yangi parol joriy paroldan farq qilishi kerak',
      });
    }

    const deliveryProvider = await DeliveryProvider.findById(deliveryProviderId).select('+password');

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await deliveryProvider.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri',
      });
    }

    // Update password
    deliveryProvider.password = newPassword;
    await deliveryProvider.save();

    res.status(200).json({
      success: true,
      message: 'Parol muvaffaqiyatli o\'zgartirildi',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Parolni o\'zgartirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get orders assigned to this delivery provider
const getMyOrders = async (req, res) => {
  try {
    const deliveryProviderId = req.user.userId;
    const { status, page = 1, limit = 50 } = req.query;

    // Build filter for orders with this delivery provider
    const filter = {
      'contragentRequests.deliveryProvider': deliveryProviderId,
    };

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName phone')
      .populate({
        path: 'items.product',
        populate: [
          {
            path: 'baseProduct',
            select: 'name description images category subcategory unit unitSize',
            populate: [
              { path: 'category', select: 'name slug status' },
              { path: 'subcategory', select: 'name slug status' },
            ],
          },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('contragentRequests.contragentId', 'name phone viloyat tuman mfy')
      .populate('contragentRequests.deliveryProvider', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Filter to only show orders where this delivery provider is assigned
    const filteredOrders = [];

    for (const order of orders) {
      const orderObj = order.toObject();

      // Find the contragent request that has this delivery provider
      const relevantRequest = orderObj.contragentRequests.find(
        (req) =>
          req.deliveryProvider &&
          req.deliveryProvider._id.toString() === deliveryProviderId.toString()
      );

      if (!relevantRequest) {
        continue; // Skip this order
      }

      // Filter items to only show items from this request
      if (relevantRequest.itemIds && relevantRequest.itemIds.length > 0) {
        orderObj.items = orderObj.items.filter((item, index) =>
          relevantRequest.itemIds.includes(index)
        );
      }

      // Filter to only show this request
      orderObj.contragentRequests = [relevantRequest];

      // Populate product ma'lumotlari (maxalla va tuman) har bir item uchun
      if (orderObj.items && orderObj.items.length > 0) {
        const populatedItems = [];
        for (const item of orderObj.items) {
          const populatedProduct = await populateDeliveryOrderItemProduct(item);
          populatedItems.push({
            ...item,
            product: populatedProduct || item.product,
          });
        }
        orderObj.items = populatedItems;
      }

      filteredOrders.push(orderObj);
    }

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
    console.error('Error fetching orders for delivery provider:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID for delivery provider
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryProviderId = req.user.userId;

    const order = await Order.findById(id)
      .populate('user', 'firstName lastName phone')
      .populate({
        path: 'items.product',
        populate: [
          {
            path: 'baseProduct',
            select: 'name description images category subcategory unit unitSize',
            populate: [
              { path: 'category', select: 'name slug status' },
              { path: 'subcategory', select: 'name slug status' },
            ],
          },
          {
            path: 'contragent',
            select: 'name phone viloyat tuman mfy',
            populate: [
              { path: 'viloyat', select: 'name type code' },
              { path: 'tuman', select: 'name type code' },
              { path: 'mfy', select: 'name type code' },
            ],
          },
        ],
      })
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('contragentRequests.contragentId', 'name phone viloyat tuman mfy')
      .populate('contragentRequests.deliveryProvider', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if this delivery provider is assigned to this order
    const relevantRequest = order.contragentRequests.find(
      (req) =>
        req.deliveryProvider &&
        req.deliveryProvider._id.toString() === deliveryProviderId.toString()
    );

    if (!relevantRequest) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga yuborilmagan',
      });
    }

    // Filter items to only show items from this request
    const orderObj = order.toObject();
    orderObj.contragentRequests = [relevantRequest];

    if (relevantRequest.itemIds && relevantRequest.itemIds.length > 0) {
      orderObj.items = orderObj.items.filter((item, index) =>
        relevantRequest.itemIds.includes(index)
      );
    }

    // Har bir item uchun product ni to'liq ma'lumot bilan to'ldirish
    if (orderObj.items && orderObj.items.length > 0) {
      const populatedItems = [];
      for (const item of orderObj.items) {
        const populatedProduct = await populateDeliveryOrderItemProduct(item);
        populatedItems.push({
          ...item,
          product: populatedProduct || item.product,
        });
      }
      orderObj.items = populatedItems;
    }

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error('Error fetching order for delivery provider:', error);
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

// Mark order as delivered
const markOrderAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryProviderId = req.user.userId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find the contragent request that has this delivery provider
    const requestIndex = order.contragentRequests.findIndex(
      (req) =>
        req.deliveryProvider &&
        req.deliveryProvider.toString() === deliveryProviderId.toString()
    );

    if (requestIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga yuborilmagan',
      });
    }

    const request = order.contragentRequests[requestIndex];

    // Check if this request is already marked delivered
    if (request.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma allaqachon yetkazib berilgan deb belgilangan',
      });
    }

    // Maxalla: yetkazuvchi mijozga yetkazdi — faqat shu request uchun 'delivered' belgilaymiz.
    // Mijoz keyin confirm-delivery orqali tasdiqlaydi va to'lov yaratiladi.
    order.contragentRequests[requestIndex].status = 'delivered';
    order.contragentRequests[requestIndex].deliveredByProviderAt = new Date();
    order.markModified('contragentRequests');
    await order.save();

    // Populate for response
    await order.populate('user', 'firstName lastName phone');
    await order.populate('contragentRequests.deliveryProvider', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Buyurtma yetkazib berildi deb belgilandi. Mijoz tasdiqlagach to\'lov amalga oshadi.',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        contragentRequestStatus: 'delivered',
        deliveredByProviderAt: order.contragentRequests[requestIndex].deliveredByProviderAt,
      },
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
      message: 'Buyurtmani belgilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyOrders,
  getOrderById,
  markOrderAsDelivered,
};
