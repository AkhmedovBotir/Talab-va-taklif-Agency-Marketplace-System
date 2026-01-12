const Contragent = require('../models/Contragent');
const ContragentType = require('../models/ContragentType');
const Device = require('../models/Device');
const { extractDeviceInfo } = require('../utils/deviceHelper');
const jwt = require('jsonwebtoken');

// Create new contragent
const createContragent = async (req, res) => {
  try {
    const { name, inn, viloyat, tuman, mfy, phone, password, status, logo, activityType, contragentLevel } = req.body;

    // Validate logo if provided
    if (logo) {
      const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      if (!base64Regex.test(logo)) {
        return res.status(400).json({
          success: false,
          message: 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
        });
      }
    }

    // Check if INN already exists
    const existingINN = await Contragent.findOne({ inn });
    if (existingINN) {
      return res.status(400).json({
        success: false,
        message: 'Bu INN allaqachon mavjud',
      });
    }

    // Check if phone number already exists
    const existingPhone = await Contragent.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    // Validate regions exist and have correct types
    const Region = require('../models/Region');
    const viloyatRegion = await Region.findById(viloyat);
    const tumanRegion = await Region.findById(tuman);
    const mfyRegion = await Region.findById(mfy);

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

    // Validate hierarchy: tuman should be child of viloyat, mfy should be child of tuman
    if (tumanRegion.parent?.toString() !== viloyat.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Tuman tanlangan viloyatga tegishli emas',
      });
    }

    if (mfyRegion.parent?.toString() !== tuman.toString()) {
      return res.status(400).json({
        success: false,
        message: 'MFY tanlangan tumanga tegishli emas',
      });
    }

    // Validate activityType exists and is active
    const activityTypeDoc = await ContragentType.findById(activityType);
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

    const contragent = await Contragent.create({
      name,
      inn,
      viloyat,
      tuman,
      mfy,
      phone,
      password,
      logo: logo || null,
      activityType,
      contragentLevel: contragentLevel || 'tuman',
      status: status || 'active',
    });

    // Populate regions and activityType
    await contragent.populate('viloyat', 'name type code');
    await contragent.populate('tuman', 'name type code');
    await contragent.populate('mfy', 'name type code');
    await contragent.populate('activityType', 'name icon');

    // Invalidate cache

    res.status(201).json({
      success: true,
      message: 'Kontragent muvaffaqiyatli yaratildi',
      data: contragent,
    });
  } catch (error) {
    console.error('Error creating contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragent yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all contragents
const getAllContragents = async (req, res) => {
  try {
    const { status, viloyat, tuman, mfy, contragentLevel, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
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

    if (contragentLevel) {
      filter.contragentLevel = contragentLevel;
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
      .populate('activityType', 'name icon')
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
    console.error('Error fetching contragents:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get contragent by ID
const getContragentById = async (req, res) => {
  try {
    const { id } = req.params;

    const contragent = await Contragent.findById(id)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .select('-password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: contragent,
    });
  } catch (error) {
    console.error('Error fetching contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragentni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update contragent
const updateContragent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate contragentLevel if being updated
    if (updateData.contragentLevel) {
      if (!['tuman', 'mfy'].includes(updateData.contragentLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Kontragent darajasi "tuman" yoki "mfy" bo\'lishi kerak',
        });
      }
    }

    // Validate logo if provided
    if (updateData.logo) {
      const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      if (!base64Regex.test(updateData.logo)) {
        return res.status(400).json({
          success: false,
          message: 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
        });
      }
    }

    // If INN is being updated, check for duplicates
    if (updateData.inn) {
      const existingINN = await Contragent.findOne({
        inn: updateData.inn,
        _id: { $ne: id },
      });
      if (existingINN) {
        return res.status(400).json({
          success: false,
          message: 'Bu INN allaqachon mavjud',
        });
      }
    }

    // If phone is being updated, check for duplicates
    if (updateData.phone) {
      const existingPhone = await Contragent.findOne({
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

    // Validate regions if being updated
    if (updateData.viloyat || updateData.tuman || updateData.mfy) {
      const Region = require('../models/Region');
      const currentContragent = await Contragent.findById(id);
      const viloyatId = updateData.viloyat || currentContragent.viloyat;
      const tumanId = updateData.tuman || currentContragent.tuman;
      const mfyId = updateData.mfy || currentContragent.mfy;

      if (updateData.viloyat) {
        const viloyatRegion = await Region.findById(viloyatId);
        if (!viloyatRegion || viloyatRegion.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
          });
        }
      }

      if (updateData.tuman) {
        const tumanRegion = await Region.findById(tumanId);
        if (!tumanRegion || tumanRegion.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi yoki noto\'g\'ri tur',
          });
        }
        // Validate tuman is child of viloyat
        if (tumanRegion.parent?.toString() !== viloyatId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman tanlangan viloyatga tegishli emas',
          });
        }
      }

      if (updateData.mfy) {
        const mfyRegion = await Region.findById(mfyId);
        if (!mfyRegion || mfyRegion.type !== 'mfy') {
          return res.status(400).json({
            success: false,
            message: 'MFY topilmadi yoki noto\'g\'ri tur',
          });
        }
        // Validate mfy is child of tuman
        if (mfyRegion.parent?.toString() !== tumanId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'MFY tanlangan tumanga tegishli emas',
          });
        }
      }
    }

    // Validate activityType if being updated
    if (updateData.activityType) {
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

    // If password is being updated, we need to hash it first
    // We'll use save() method instead of findByIdAndUpdate to trigger pre('save') hook
    if (updateData.password) {
      const contragent = await Contragent.findById(id);
      
      if (!contragent) {
        return res.status(404).json({
          success: false,
          message: 'Kontragent topilmadi',
        });
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (key !== 'password') {
          contragent[key] = updateData[key];
        }
      });

      // Set password (will be hashed by pre('save') hook)
      contragent.password = updateData.password;
      
      // Save to trigger pre('save') hook for password hashing
      await contragent.save();

      // Populate regions and activityType
      await contragent.populate('viloyat', 'name type code');
      await contragent.populate('tuman', 'name type code');
      await contragent.populate('mfy', 'name type code');
      await contragent.populate('activityType', 'name icon');

      // Invalidate cache

      return res.status(200).json({
        success: true,
        message: 'Kontragent muvaffaqiyatli yangilandi',
        data: {
          _id: contragent._id,
          name: contragent.name,
          inn: contragent.inn,
          viloyat: contragent.viloyat,
          tuman: contragent.tuman,
          mfy: contragent.mfy,
          phone: contragent.phone,
          logo: contragent.logo,
          status: contragent.status,
          createdAt: contragent.createdAt,
          updatedAt: contragent.updatedAt,
        },
      });
    }

    // If password is not being updated, use findByIdAndUpdate
    const contragent = await Contragent.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .select('-password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Kontragent muvaffaqiyatli yangilandi',
      data: contragent,
    });
  } catch (error) {
    console.error('Error updating contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragentni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete contragent
const deleteContragent = async (req, res) => {
  try {
    const { id } = req.params;

    const contragent = await Contragent.findByIdAndDelete(id);

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Kontragent muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting contragent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragentni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get current contragent (me)
const getMe = async (req, res) => {
  try {
    const contragent = await Contragent.findById(req.user.userId)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .select('-password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: contragent,
    });
  } catch (error) {
    console.error('Error fetching contragent me:', error);
    res.status(500).json({
      success: false,
      message: 'Ma\'lumotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update current contragent profile (basic fields + optional logo)
const updateMyProfile = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const updateData = req.body;

    // Validate logo if provided
    if (updateData.logo) {
      const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
      if (!base64Regex.test(updateData.logo)) {
        return res.status(400).json({
          success: false,
          message: 'Logo base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
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
      const Region = require('../models/Region');
      const currentContragent = await Contragent.findById(contragentId);
      const viloyatId = updateData.viloyat || currentContragent.viloyat;
      const tumanId = updateData.tuman || currentContragent.tuman;
      const mfyId = updateData.mfy || currentContragent.mfy;

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
      .select('-password');

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Profil yangilandi',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating contragent profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update current contragent logo
const updateMyLogo = async (req, res) => {
  try {
    const { logo } = req.body;
    const contragentId = req.user.userId;

    const updated = await Contragent.findByIdAndUpdate(
      contragentId,
      { logo },
      { new: true, runValidators: true }
    )
      .populate('viloyat', 'name type code')
      .populate('activityType', 'name icon')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Logo yangilandi',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating contragent logo:', error);
    res.status(500).json({
      success: false,
      message: 'Logoni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login contragent
const loginContragent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find contragent with password field included (only non-deleted and active)
    const contragent = await Contragent.findOne({
      phone,
      isDeleted: { $ne: true },
      status: 'active', // Only find active contragents
    }).select('+password');

    if (!contragent) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Compare password
    const isPasswordValid = await contragent.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Extract device information
    const deviceInfo = extractDeviceInfo(req);

    // Check if deviceId is provided
    if (!deviceInfo.deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Qurilma ID kiritilishi shart',
      });
    }

    // Check if device exists (active or inactive)
    const existingDevice = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
      deviceId: deviceInfo.deviceId,
    });

    // If device exists but is inactive, reject login immediately
    if (existingDevice && !existingDevice.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Bu qurilma nofaol. Faqat faol qurilma bilan login qilish mumkin. Iltimos, faol qurilma bilan kirish yoki yangi qurilmani tasdiqlash uchun SMS kod so\'rang',
        requiresDeviceVerification: true,
      });
    }

    // Check if user has any active devices
    const activeDevices = await Device.find({
      user: contragent._id,
      userModel: 'Contragent',
      isActive: true,
    });

    // If device exists and is active, update and proceed
    if (existingDevice && existingDevice.isActive) {
      existingDevice.lastLoginAt = new Date();
      existingDevice.lastActivityAt = new Date();
      if (deviceInfo.ipAddress) existingDevice.ipAddress = deviceInfo.ipAddress;
      if (deviceInfo.userAgent) existingDevice.userAgent = deviceInfo.userAgent;
      await existingDevice.save();
    } else if (!existingDevice) {
      // Device doesn't exist - check if this is first device or not
      // If no active devices, this is the first device - auto-create and activate
      if (activeDevices.length === 0) {
        const { device, isNew } = await Device.findOrCreateDevice(contragent, 'Contragent', deviceInfo);
        // Device is already active from findOrCreateDevice
      } else {
        // There are active devices, require device verification
        return res.status(403).json({
          success: false,
          message: 'Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak',
          requiresDeviceVerification: true,
          data: {
            phone: contragent.phone,
            deviceId: deviceInfo.deviceId,
          },
        });
      }
    }

    // Get the device (either existing or newly created) - MUST be active
    const device = await Device.findOne({
      user: contragent._id,
      userModel: 'Contragent',
      deviceId: deviceInfo.deviceId,
      isActive: true,
    });

    // Final check: if device is not found or not active, reject login
    if (!device || !device.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Qurilma topilmadi yoki nofaol. Iltimos, qurilmani tasdiqlang',
        requiresDeviceVerification: true,
      });
    }

    // Generate JWT token (24 hours)
    const token = jwt.sign(
      {
        id: contragent._id,
        phone: contragent.phone,
        inn: contragent.inn,
        type: 'contragent',
        deviceId: device.deviceId,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '24h',
      }
    );

    // Populate regions
    await contragent.populate([
      { path: 'viloyat', select: 'name type code' },
      { path: 'tuman', select: 'name type code' },
      { path: 'mfy', select: 'name type code' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        contragent: {
          _id: contragent._id,
          name: contragent.name,
          inn: contragent.inn,
          viloyat: contragent.viloyat,
          tuman: contragent.tuman,
          mfy: contragent.mfy,
          phone: contragent.phone,
          logo: contragent.logo,
          status: contragent.status,
          createdAt: contragent.createdAt,
          updatedAt: contragent.updatedAt,
        },
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          isPrimary: device.isPrimary,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get delivery regions for current contragent
const getMyDeliveryRegions = async (req, res) => {
  try {
    const contragentId = req.user.userId;

    const contragent = await Contragent.findById(contragentId)
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .select('-password');

    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Ensure deliveryRegions is always present (even if empty)
    const deliveryRegions = contragent.deliveryRegions || [];

    res.status(200).json({
      success: true,
      data: {
        deliveryRegions: deliveryRegions,
      },
    });
  } catch (error) {
    console.error('Error fetching delivery regions:', error);
    res.status(500).json({
      success: false,
      message: 'Yetkazib berish hududlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update delivery regions for current contragent
const updateMyDeliveryRegions = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { deliveryRegions } = req.body;

    const contragent = await Contragent.findById(contragentId);
    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Check if contragent is tuman level (not mfy)
    if (contragent.contragentLevel === 'mfy') {
      return res.status(400).json({
        success: false,
        message: 'Maxalla kontragentlar uchun bu API ishlamaydi. Xizmat ko\'rsatish hududlarini boshqa API orqali yangilang.',
      });
    }

    // Validate deliveryRegions
    if (!Array.isArray(deliveryRegions)) {
      return res.status(400).json({
        success: false,
        message: 'Yetkazib berish hududlari array bo\'lishi kerak',
      });
    }

    // Validate each delivery region
    const Region = require('../models/Region');
    for (let i = 0; i < deliveryRegions.length; i++) {
      const region = deliveryRegions[i];
      
      if (!region.viloyat) {
        return res.status(400).json({
          success: false,
          message: `Yetkazib berish hududi ${i + 1}: viloyat kiritilishi shart`,
        });
      }

      // Validate viloyat
      const viloyatRegion = await Region.findById(region.viloyat);
      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: `Yetkazib berish hududi ${i + 1}: viloyat topilmadi yoki noto'g'ri tur`,
        });
      }

      // Validate tuman if provided
      if (region.tuman) {
        const tumanRegion = await Region.findById(region.tuman);
        if (!tumanRegion || tumanRegion.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: `Yetkazib berish hududi ${i + 1}: tuman topilmadi yoki noto'g'ri tur`,
          });
        }

        // Check if tuman belongs to viloyat
        if (tumanRegion.parent?.toString() !== region.viloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: `Yetkazib berish hududi ${i + 1}: tuman tanlangan viloyatga tegishli emas`,
          });
        }
      }
    }

    // Update delivery regions
    const updated = await Contragent.findByIdAndUpdate(
      contragentId,
      { deliveryRegions: deliveryRegions },
      { new: true, runValidators: true }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name icon')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Yetkazib berish hududlari yangilandi',
      data: {
        deliveryRegions: updated.deliveryRegions,
      },
    });
  } catch (error) {
    console.error('Error updating delivery regions:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri region ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Yetkazib berish hududlarini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createContragent,
  getAllContragents,
  getContragentById,
  updateContragent,
  deleteContragent,
  loginContragent,
  getMe,
  updateMyProfile,
  updateMyLogo,
  getMyDeliveryRegions,
  updateMyDeliveryRegions,
};

