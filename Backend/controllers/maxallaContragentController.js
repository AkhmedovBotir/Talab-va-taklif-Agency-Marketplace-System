const Contragent = require('../models/Contragent');
const Region = require('../models/Region');
const Device = require('../models/Device');
const DeliveryProvider = require('../models/DeliveryProvider');
const SmsVerification = require('../models/SmsVerification');
const eskizService = require('../services/eskizService');
const jwt = require('jsonwebtoken');

// Get current maxalla contragent profile
const getMyProfile = async (req, res) => {
  try {
    const contragentId = req.user.userId;

    const contragent = await Contragent.findOne({
      _id: contragentId,
      contragentLevel: 'mfy',
      status: 'active',
      isDeleted: { $ne: true },
    })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .populate('serviceAreas.tuman', 'name type code')
      .populate('serviceAreas.mfys', 'name type code')
      .select('-password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla kontragent topilmadi',
      });
    }

    // Ensure workingHours and serviceAreas are always present (even if null/empty)
    const workingHours = contragent.workingHours || { open: null, close: null };
    let serviceAreas = contragent.serviceAreas;
    if (!serviceAreas || !serviceAreas.tuman) {
      serviceAreas = {
        tuman: null,
        mfys: [],
      };
    } else if (!serviceAreas.mfys) {
      serviceAreas.mfys = [];
    }

    // Create response object with guaranteed fields
    const responseData = {
      ...contragent.toObject(),
      workingHours: workingHours,
      serviceAreas: serviceAreas,
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error getting maxalla contragent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update maxalla contragent profile
const updateMyProfile = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const updateData = req.body;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Validate logo if provided
    if (updateData.logo) {
      const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      if (!base64Regex.test(updateData.logo)) {
        return res.status(400).json({
          success: false,
          message: 'Logo base64 formatida bo\'lishi kerak',
        });
      }
    }

    // If phone is being updated, check for duplicates
    if (updateData.phone) {
      const existingPhone = await Contragent.findOne({
        phone: updateData.phone,
        _id: { $ne: contragentId },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud',
        });
      }
    }

    // If INN is being updated, check for duplicates
    if (updateData.inn) {
      const existingINN = await Contragent.findOne({
        inn: updateData.inn,
        _id: { $ne: contragentId },
      });
      if (existingINN) {
        return res.status(400).json({
          success: false,
          message: 'Bu INN allaqachon mavjud',
        });
      }
    }

    // Validate activityType if being updated
    if (updateData.activityType) {
      const ContragentType = require('../models/ContragentType');
      const activityTypeDoc = await ContragentType.findById(updateData.activityType);
      if (!activityTypeDoc) {
        return res.status(400).json({
          success: false,
          message: 'Faoliyat turi topilmadi',
        });
      }

      if (activityTypeDoc.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Faoliyat turi faol emas',
        });
      }
    }

    // Validate regions if being updated
    if (updateData.viloyat || updateData.tuman || updateData.mfy) {
      const viloyatId = updateData.viloyat || contragent.viloyat;
      const tumanId = updateData.tuman || contragent.tuman;
      const mfyId = updateData.mfy || contragent.mfy;

      const viloyatRegion = await Region.findById(viloyatId);
      const tumanRegion = await Region.findById(tumanId);
      const mfyRegion = await Region.findById(mfyId);

      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
        });
      }

      if (!tumanRegion || tumanRegion.type !== 'district') {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki noto\'g\'ri tur',
        });
      }

      if (!mfyRegion || mfyRegion.type !== 'mfy') {
        return res.status(400).json({
          success: false,
          message: 'MFY topilmadi yoki noto\'g\'ri tur',
        });
      }

      if (tumanRegion.parent?.toString() !== viloyatId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Tuman tanlangan viloyatga tegishli emas',
        });
      }

      if (mfyRegion.parent?.toString() !== tumanId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'MFY tanlangan tumanga tegishli emas',
        });
      }
    }

    const updated = await Contragent.findByIdAndUpdate(
      contragentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .populate('serviceAreas.tuman', 'name type code')
      .populate('serviceAreas.mfys', 'name type code')
      .select('-password');

    // Ensure workingHours and serviceAreas are always present (even if null/empty)
    const workingHours = updated.workingHours || { open: null, close: null };
    let serviceAreas = updated.serviceAreas;
    if (!serviceAreas || !serviceAreas.tuman) {
      serviceAreas = {
        tuman: null,
        mfys: [],
      };
    } else if (!serviceAreas.mfys) {
      serviceAreas.mfys = [];
    }

    // Create response object with guaranteed fields
    const responseData = {
      ...updated.toObject(),
      workingHours: workingHours,
      serviceAreas: serviceAreas,
    };

    res.status(200).json({
      success: true,
      message: 'Profil yangilandi',
      data: responseData,
    });
  } catch (error) {
    console.error('Error updating maxalla contragent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update working hours for maxalla contragent
const updateWorkingHours = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { open, close } = req.body;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (open && !timeRegex.test(open)) {
      return res.status(400).json({
        success: false,
        message: 'Ochilish vaqti noto\'g\'ri format (HH:MM)',
      });
    }

    if (close && !timeRegex.test(close)) {
      return res.status(400).json({
        success: false,
        message: 'Yopilish vaqti noto\'g\'ri format (HH:MM)',
      });
    }

    // Update working hours
    const updateData = {};
    if (open !== undefined) {
      updateData['workingHours.open'] = open;
    }
    if (close !== undefined) {
      updateData['workingHours.close'] = close;
    }

    const updated = await Contragent.findByIdAndUpdate(
      contragentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Ish vaqti yangilandi',
      data: {
        workingHours: updated.workingHours,
      },
    });
  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({
      success: false,
      message: 'Ish vaqtini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update service areas for maxalla contragent
const updateServiceAreas = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { tuman, mfys } = req.body;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Validate tuman if provided
    if (tuman) {
      const tumanRegion = await Region.findById(tuman);
      if (!tumanRegion || tumanRegion.type !== 'district') {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki noto\'g\'ri tur',
        });
      }

      // Check if tuman belongs to contragent's viloyat
      if (tumanRegion.parent?.toString() !== contragent.viloyat.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Tuman kontragentning viloyatiga tegishli emas',
        });
      }
    }

    // Validate mfys if provided
    if (mfys && Array.isArray(mfys)) {
      if (mfys.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kamida bitta MFY tanlanishi kerak',
        });
      }

      // Validate each MFY
      const serviceTumanId = tuman || contragent.serviceAreas?.tuman || contragent.tuman;
      const serviceTuman = await Region.findById(serviceTumanId);
      
      if (!serviceTuman) {
        return res.status(400).json({
          success: false,
          message: 'Xizmat ko\'rsatish tumani topilmadi',
        });
      }

      for (const mfyId of mfys) {
        const mfyRegion = await Region.findById(mfyId);
        if (!mfyRegion || mfyRegion.type !== 'mfy') {
          return res.status(400).json({
            success: false,
            message: `MFY topilmadi yoki noto'g'ri tur: ${mfyId}`,
          });
        }

        // Check if MFY belongs to service tuman
        if (mfyRegion.parent?.toString() !== serviceTumanId.toString()) {
          return res.status(400).json({
            success: false,
            message: `MFY xizmat ko'rsatish tumanga tegishli emas: ${mfyId}`,
          });
        }
      }
    }

    // Update service areas
    const updateData = {};
    if (tuman !== undefined) {
      updateData['serviceAreas.tuman'] = tuman;
    }
    if (mfys !== undefined) {
      updateData['serviceAreas.mfys'] = mfys;
    }

    const updated = await Contragent.findByIdAndUpdate(
      contragentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .populate('serviceAreas.tuman', 'name type code')
      .populate('serviceAreas.mfys', 'name type code')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Xizmat ko\'rsatish hududlari yangilandi',
      data: {
        serviceAreas: updated.serviceAreas,
      },
    });
  } catch (error) {
    console.error('Error updating service areas:', error);
    res.status(500).json({
      success: false,
      message: 'Xizmat ko\'rsatish hududlarini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Logout maxalla contragent
const logoutMaxallaContragent = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const deviceId = req.user.deviceId || req.headers['x-device-id'];

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // If deviceId is provided, deactivate the device
    if (deviceId) {
      const device = await Device.findOne({
        user: contragentId,
        userModel: 'Contragent',
        deviceId: deviceId,
        isActive: true,
      });

      if (device) {
        device.isActive = false;
        device.lastActivityAt = new Date();
        await device.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli chiqildi',
    });
  } catch (error) {
    console.error('Error logging out maxalla contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Chiqishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== Delivery Providers CRUD ====================

// Create delivery provider
const createDeliveryProvider = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { name, phone, password, notes } = req.body;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Check if phone already exists for this contragent
    const existingProvider = await DeliveryProvider.findOne({
      contragent: contragentId,
      phone,
      isDeleted: false,
    });

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami bilan yetkazib beruvchi allaqachon mavjud',
      });
    }

    // Create delivery provider
    const deliveryProvider = await DeliveryProvider.create({
      name,
      phone,
      password,
      contragent: contragentId,
      notes: notes || null,
    });

    res.status(201).json({
      success: true,
      message: 'Yetkazib beruvchi muvaffaqiyatli yaratildi',
      data: deliveryProvider,
    });
  } catch (error) {
    console.error('Error creating delivery provider:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami bilan yetkazib beruvchi allaqachon mavjud',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchi yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all delivery providers for current contragent
const getAllDeliveryProviders = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { status } = req.query;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Build filter
    const filter = {
      contragent: contragentId,
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    const deliveryProviders = await DeliveryProvider.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: deliveryProviders,
      count: deliveryProviders.length,
    });
  } catch (error) {
    console.error('Error getting delivery providers:', error);
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchilarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get delivery provider by ID
const getDeliveryProviderById = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { id } = req.params;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    const deliveryProvider = await DeliveryProvider.findOne({
      _id: id,
      contragent: contragentId,
      isDeleted: false,
    });

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
    console.error('Error getting delivery provider:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri yetkazib beruvchi ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update delivery provider
const updateDeliveryProvider = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { id } = req.params;
    const { name, phone, password, status, notes } = req.body;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Check if delivery provider exists and belongs to this contragent
    const deliveryProvider = await DeliveryProvider.findOne({
      _id: id,
      contragent: contragentId,
      isDeleted: false,
    });

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi',
      });
    }

    // Check if phone is being updated and if it conflicts with another provider
    if (phone && phone !== deliveryProvider.phone) {
      const existingProvider = await DeliveryProvider.findOne({
        contragent: contragentId,
        phone,
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingProvider) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami bilan yetkazib beruvchi allaqachon mavjud',
        });
      }
    }

    // Update delivery provider
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (password !== undefined) updateData.password = password;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;

    const updated = await DeliveryProvider.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Yetkazib beruvchi yangilandi',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating delivery provider:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri yetkazib beruvchi ID',
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami bilan yetkazib beruvchi allaqachon mavjud',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete delivery provider (soft delete)
const deleteDeliveryProvider = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { id } = req.params;

    // Check if contragent is maxalla level
    const contragent = await Contragent.findById(contragentId);
    if (!contragent || contragent.contragentLevel !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Maxalla kontragentlar uchun',
      });
    }

    // Check if delivery provider exists and belongs to this contragent
    const deliveryProvider = await DeliveryProvider.findOne({
      _id: id,
      contragent: contragentId,
      isDeleted: false,
    });

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi',
      });
    }

    // Soft delete
    deliveryProvider.isDeleted = true;
    deliveryProvider.deletedAt = new Date();
    await deliveryProvider.save();

    res.status(200).json({
      success: true,
      message: 'Yetkazib beruvchi o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting delivery provider:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri yetkazib beruvchi ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchini o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAXALLA CONTRAGENT ORDERS ====================

// Get orders for maxalla contragent (o'z dokoniga kelgan buyurtmalar)
const getMyOrders = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { status, page = 1, limit = 50 } = req.query;

    const Order = require('../models/Order');
    const MaxallaProduct = require('../models/MaxallaProduct');

    // Build filter for orders with requests to this maxalla contragent
    const filter = {
      'contragentRequests.contragentId': contragentId,
    };

    // Filter by status if provided
    if (status) {
      filter['contragentRequests.status'] = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get orders with requests to this maxalla contragent
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

    // Filter contragentRequests to only show requests to this contragent
    // And filter items to only show items requested from this contragent
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      const contragentRequest = orderObj.contragentRequests.find(
        (req) => req.contragentId._id.toString() === contragentId.toString()
      );

      // Filter to only show this contragent's request
      orderObj.contragentRequests = contragentRequest ? [contragentRequest] : [];

      // Filter items to only show items requested from this contragent
      if (contragentRequest && contragentRequest.itemIds && contragentRequest.itemIds.length > 0) {
        orderObj.items = orderObj.items.filter((item, index) =>
          contragentRequest.itemIds.includes(index)
        );
      } else {
        // If no itemIds specified (old data), show all items (backward compatibility)
        orderObj.items = orderObj.items || [];
      }

      // Transform maxalla products to marketplace format
      if (orderObj.items) {
        orderObj.items = orderObj.items.map((item) => {
          if (item.product && item.product.baseProduct) {
            const bp = item.product.baseProduct;
            return {
              ...item,
              product: {
                _id: item.product._id,
                name: bp.name,
                description: bp.description,
                images: bp.images,
                price: item.product.price,
                originalPrice: item.product.originalPrice,
                quantity: item.product.quantity,
                unit: bp.unit,
                unitSize: bp.unitSize,
                category: bp.category,
                subcategory: bp.subcategory,
                contragent: item.product.contragent,
                productType: 'maxalla',
              },
            };
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
    console.error('Error fetching orders for maxalla contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get order by ID for maxalla contragent
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const contragentId = req.user.userId;

    const Order = require('../models/Order');

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

    // Check if contragent has a request for this order
    const contragentRequest = order.contragentRequests.find(
      (req) => req.contragentId._id.toString() === contragentId.toString()
    );

    if (!contragentRequest) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga so\'rov yuborilmagan',
      });
    }

    // Filter items to only show items requested from this contragent
    const orderObj = order.toObject();
    orderObj.contragentRequests = [contragentRequest];

    if (contragentRequest.itemIds && contragentRequest.itemIds.length > 0) {
      orderObj.items = orderObj.items.filter((item, index) =>
        contragentRequest.itemIds.includes(index)
      );
    }

    // Transform maxalla products to marketplace format
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.baseProduct) {
          const bp = item.product.baseProduct;
          return {
            ...item,
            product: {
              _id: item.product._id,
              name: bp.name,
              description: bp.description,
              images: bp.images,
              price: item.product.price,
              originalPrice: item.product.originalPrice,
              quantity: item.product.quantity,
              unit: bp.unit,
              unitSize: bp.unitSize,
              category: bp.category,
              subcategory: bp.subcategory,
              contragent: item.product.contragent,
              productType: 'maxalla',
            },
          };
        }
        return item;
      });
    }

    res.status(200).json({
      success: true,
      data: orderObj,
    });
  } catch (error) {
    console.error('Error fetching order for maxalla contragent:', error);
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

// Respond to order request (buyurtma so'roviga javob berish - qabul qilish yoki rad etish)
const respondToOrderRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { response } = req.body; // 'accepted' or 'rejected'
    const contragentId = req.user.userId;

    if (!response || !['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Javob "accepted" yoki "rejected" bo\'lishi kerak',
      });
    }

    const Order = require('../models/Order');
    const MaxallaProduct = require('../models/MaxallaProduct');

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find request to this maxalla contragent
    const requestIndex = order.contragentRequests.findIndex(
      (req) => req.contragentId.toString() === contragentId.toString()
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

    // If accepting, check product quantities
    if (response === 'accepted') {
      // Get items requested from this contragent
      const requestedItems = request.itemIds && request.itemIds.length > 0
        ? order.items.filter((item, index) => request.itemIds.includes(index))
        : order.items;

      // Check if all products have sufficient quantity
      for (const item of requestedItems) {
        if (item.productType === 'maxalla') {
          const maxallaProduct = await MaxallaProduct.findById(item.product);
          if (!maxallaProduct) {
            return res.status(404).json({
              success: false,
              message: `Mahsulot topilmadi: ${item.product}`,
            });
          }
          if (maxallaProduct.quantity < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Mahsulot miqdori yetarli emas: ${maxallaProduct.name || maxallaProduct._id}. Mavjud: ${maxallaProduct.quantity}, Talab qilinadi: ${item.quantity}`,
            });
          }
        }
      }

      // Decrease product quantities (reserve products for order)
      for (const item of requestedItems) {
        if (item.productType === 'maxalla') {
          await MaxallaProduct.findByIdAndUpdate(item.product, {
            $inc: { quantity: -item.quantity },
          });
        }
      }
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
    await order.populate('user', 'firstName lastName phone');
    await order.populate({
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
    });
    await order.populate('deliveryViloyat', 'name type code');
    await order.populate('deliveryTuman', 'name type code');
    await order.populate('deliveryMfy', 'name type code');
    await order.populate('contragentRequests.contragentId', 'name phone viloyat tuman mfy');
    await order.populate('contragentRequests.deliveryProvider', 'name phone');

    // Filter items to only show items requested from this contragent
    const orderObj = order.toObject();
    orderObj.contragentRequests = [order.contragentRequests[requestIndex]];

    if (request.itemIds && request.itemIds.length > 0) {
      orderObj.items = orderObj.items.filter((item, index) =>
        request.itemIds.includes(index)
      );
    }

    // Transform maxalla products to marketplace format
    if (orderObj.items) {
      orderObj.items = orderObj.items.map((item) => {
        if (item.product && item.product.baseProduct) {
          const bp = item.product.baseProduct;
          return {
            ...item,
            product: {
              _id: item.product._id,
              name: bp.name,
              description: bp.description,
              images: bp.images,
              price: item.product.price,
              originalPrice: item.product.originalPrice,
              quantity: item.product.quantity,
              unit: bp.unit,
              unitSize: bp.unitSize,
              category: bp.category,
              subcategory: bp.subcategory,
              contragent: item.product.contragent,
              productType: 'maxalla',
            },
          };
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

// Send order to delivery provider (yetkazib beruvchiga yuborish)
const sendOrderToDeliveryProvider = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryProviderId } = req.body;
    const contragentId = req.user.userId;

    if (!deliveryProviderId) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazib beruvchi ID kiritilishi shart',
      });
    }

    const Order = require('../models/Order');
    const DeliveryProvider = require('../models/DeliveryProvider');

    // Verify delivery provider belongs to this contragent
    const deliveryProvider = await DeliveryProvider.findOne({
      _id: deliveryProviderId,
      contragent: contragentId,
      status: 'active',
      isDeleted: { $ne: true },
    });

    if (!deliveryProvider) {
      return res.status(404).json({
        success: false,
        message: 'Yetkazib beruvchi topilmadi yoki sizga tegishli emas',
      });
    }

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Find request to this contragent
    const requestIndex = order.contragentRequests.findIndex(
      (req) => req.contragentId.toString() === contragentId.toString()
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sizga so\'rov yuborilmagan',
      });
    }

    const request = order.contragentRequests[requestIndex];

    // Check if request is accepted
    if (request.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'So\'rov qabul qilinmagan. Avval buyurtmani qabul qiling',
      });
    }

    // Check if already sent to delivery provider
    if (request.deliveryProvider) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma allaqachon yetkazib beruvchiga yuborilgan',
      });
    }

    // Update request with delivery provider
    order.contragentRequests[requestIndex].deliveryProvider = deliveryProvider._id;
    order.contragentRequests[requestIndex].sentToDeliveryProviderAt = new Date();

    await order.save();

    // Populate for response
    await order.populate('contragentRequests.deliveryProvider', 'name phone');
    await order.populate('user', 'firstName lastName phone');

    // Get the updated request
    const updatedRequest = order.contragentRequests[requestIndex];

    res.status(200).json({
      success: true,
      message: 'Buyurtma yetkazib beruvchiga muvaffaqiyatli yuborildi',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        contragentRequest: updatedRequest,
        deliveryProvider: {
          _id: deliveryProvider._id,
          name: deliveryProvider.name,
          phone: deliveryProvider.phone,
        },
        sentAt: updatedRequest.sentToDeliveryProviderAt,
      },
    });
  } catch (error) {
    console.error('Error sending order to delivery provider:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID formati',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yetkazib beruvchiga yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateWorkingHours,
  updateServiceAreas,
  logoutMaxallaContragent,
  createDeliveryProvider,
  getAllDeliveryProviders,
  getDeliveryProviderById,
  updateDeliveryProvider,
  deleteDeliveryProvider,
  getMyOrders,
  getOrderById,
  respondToOrderRequest,
  sendOrderToDeliveryProvider,
};
