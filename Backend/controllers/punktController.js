const Punkt = require('../models/Punkt');
const Contragent = require('../models/Contragent');
const jwt = require('jsonwebtoken');

// Create new punkt
const createPunkt = async (req, res) => {
  try {
    const { name, phone, password, viloyat, tuman, status } = req.body;

    // Check if phone number already exists (only non-deleted)
    const existingPhone = await Punkt.findOne({
      phone,
      isDeleted: { $ne: true },
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    // Validate viloyat exists and has correct type
    const Region = require('../models/Region');
    const viloyatRegion = await Region.findById(viloyat);

    if (!viloyatRegion || viloyatRegion.type !== 'region') {
      return res.status(400).json({
        success: false,
        message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
      });
    }

    // Validate tuman if provided
    if (tuman) {
      const tumanRegion = await Region.findById(tuman).populate('parent');
      if (!tumanRegion || tumanRegion.type !== 'district') {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki noto\'g\'ri tur',
        });
      }
      // Check if tuman belongs to viloyat
      if (tumanRegion.parent && tumanRegion.parent._id.toString() !== viloyat.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Tuman viloyatga tegishli emas',
        });
      }
    }

    // Check if there's already an active punkt in this position (viloyat + tuman)
    const positionFilter = {
      viloyat,
      tuman: tuman || null,
      isDeleted: { $ne: true },
      status: 'active',
    };

    const existingPunktInPosition = await Punkt.findOne(positionFilter);
    if (existingPunktInPosition) {
      const tumanName = tuman ? ' va tuman' : '';
      return res.status(400).json({
        success: false,
        message: `Bu viloyat${tumanName} uchun allaqachon faol punkt mavjud`,
      });
    }

    try {
      const punkt = await Punkt.create({
        name,
        phone,
        password,
        viloyat,
        tuman: tuman || null,
        status: status || 'active',
      });

      // Populate viloyat and tuman
      await punkt.populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ]);

      // Invalidate cache

      res.status(201).json({
        success: true,
        message: 'Punkt muvaffaqiyatli yaratildi',
        data: punkt,
      });
    } catch (createError) {
      // Handle duplicate key error (phone already exists)
      if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.phone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud (arxivda yoki faol punktda)',
        });
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error creating punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Punkt yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all punkts
const getAllPunkts = async (req, res) => {
  try {
    const { status, viloyat, tuman, page = 1, limit = 10 } = req.query;
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

    // Only show non-deleted punkts (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Punkt.countDocuments(filter);

    // Get punkts with pagination
    const punkts = await Punkt.find(filter)
      .populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ])
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
    console.error('Error fetching punkts:', error);
    res.status(500).json({
      success: false,
      message: 'Punktlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkt by ID
const getPunktById = async (req, res) => {
  try {
    const { id } = req.params;

    const punkt = await Punkt.findOne({ _id: id, isDeleted: false })
      .populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ])
      .select('-password');

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: punkt,
    });
  } catch (error) {
    console.error('Error fetching punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri punkt ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Punktni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update punkt
const updatePunkt = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If phone is being updated, check for duplicates (only non-deleted)
    if (updateData.phone) {
      const existingPhone = await Punkt.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
        isDeleted: { $ne: true },
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
      const Region = require('../models/Region');
      const viloyatRegion = await Region.findById(updateData.viloyat);
      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
        });
      }
    }

    // If tuman is being updated, validate it
    if (updateData.tuman !== undefined) {
      const Region = require('../models/Region');
      if (updateData.tuman) {
        const tumanRegion = await Region.findById(updateData.tuman).populate('parent');
        if (!tumanRegion || tumanRegion.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi yoki noto\'g\'ri tur',
          });
        }
        // Check if tuman belongs to viloyat (use updateData.viloyat if provided, otherwise get from existing punkt)
        const currentViloyat = updateData.viloyat || (await Punkt.findById(id))?.viloyat;
        if (tumanRegion.parent && tumanRegion.parent._id.toString() !== currentViloyat?.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman viloyatga tegishli emas',
          });
        }
      }
    }

    // Check if position (viloyat + tuman) is being changed
    // If so, check if there's already an active punkt in the new position
    if (updateData.viloyat !== undefined || updateData.tuman !== undefined) {
      const currentPunkt = await Punkt.findOne({
        _id: id,
        isDeleted: { $ne: true },
      });

      if (currentPunkt) {
        const newViloyat = updateData.viloyat || currentPunkt.viloyat;
        const newTuman = updateData.tuman !== undefined ? (updateData.tuman || null) : currentPunkt.tuman;

        const positionFilter = {
          viloyat: newViloyat,
          tuman: newTuman,
          isDeleted: { $ne: true },
          status: 'active',
          _id: { $ne: id }, // Exclude current punkt
        };

        const existingPunktInPosition = await Punkt.findOne(positionFilter);
        if (existingPunktInPosition) {
          const tumanName = newTuman ? ' va tuman' : '';
          return res.status(400).json({
            success: false,
            message: `Bu viloyat${tumanName} uchun allaqachon faol punkt mavjud`,
          });
        }
      }
    }

    // If password is being updated, we need to hash it first
    // We'll use save() method instead of findByIdAndUpdate to trigger pre('save') hook
    if (updateData.password) {
    const punkt = await Punkt.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });
      
      if (!punkt) {
        return res.status(404).json({
          success: false,
          message: 'Punkt topilmadi',
        });
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (key !== 'password') {
          punkt[key] = updateData[key];
        }
      });

      // Set password (will be hashed by pre('save') hook)
      punkt.password = updateData.password;
      
      // Save to trigger pre('save') hook for password hashing
      await punkt.save();

      // Populate viloyat and tuman
      await punkt.populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ]);

      // Invalidate cache

      return res.status(200).json({
        success: true,
        message: 'Punkt muvaffaqiyatli yangilandi',
        data: {
          _id: punkt._id,
          name: punkt.name,
          phone: punkt.phone,
          viloyat: punkt.viloyat,
          tuman: punkt.tuman,
          status: punkt.status,
          createdAt: punkt.createdAt,
          updatedAt: punkt.updatedAt,
        },
      });
    }

    // If password is not being updated, use findOneAndUpdate
    const punkt = await Punkt.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ])
      .select('-password');

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Punkt muvaffaqiyatli yangilandi',
      data: punkt,
    });
  } catch (error) {
    console.error('Error updating punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri punkt ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Punktni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete punkt (soft delete)
const deletePunkt = async (req, res) => {
  try {
    const { id } = req.params;

    const punkt = await Punkt.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'inactive',
      },
      { new: true }
    );

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Punkt muvaffaqiyatli o\'chirildi (arxivga o\'tkazildi)',
    });
  } catch (error) {
    console.error('Error deleting punkt:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri punkt ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Punktni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login punkt
const loginPunkt = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find punkt with password field included (only non-deleted)
    const punkt = await Punkt.findOne({
      phone,
      isDeleted: { $ne: true },
    }).select('+password');

    if (!punkt) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if punkt is active
    if (punkt.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Check if password is set
    if (!punkt.password) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatilmagan. Iltimos, avval parol o\'rnating',
      });
    }

    // Compare password
    const isPasswordValid = await punkt.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Generate JWT token (24 hours)
    const token = jwt.sign(
      {
        id: punkt._id,
        phone: punkt.phone,
        type: 'punkt',
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '24h',
      }
    );

    // Populate viloyat and tuman
    await punkt.populate([
      { path: 'viloyat', select: 'name type code' },
      { path: 'tuman', select: 'name type code' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        punkt: {
          _id: punkt._id,
          name: punkt.name,
          phone: punkt.phone,
          viloyat: punkt.viloyat,
          tuman: punkt.tuman,
          status: punkt.status,
          createdAt: punkt.createdAt,
          updatedAt: punkt.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkts for selection (punkt ID tanlash uchun)
const getPunktsForSelection = async (req, res) => {
  try {
    const { status, viloyat, tuman, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Only show non-deleted punkts (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

    // Only show active punkts by default
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    // Search by name or phone
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

    // Get punkts with pagination - minimal fields for selection
    const punkts = await Punkt.find(filter)
      .populate([
        { path: 'viloyat', select: 'name type code' },
        { path: 'tuman', select: 'name type code' },
      ])
      .select('_id name phone viloyat tuman status')
      .sort({ name: 1 })
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
    console.error('Error fetching punkts for selection:', error);
    res.status(500).json({
      success: false,
      message: 'Punktlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get contragents in punkt's region (o'z hududidagi contragentlar)
const getContragentsInRegion = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {
      viloyat: punkt.viloyat._id || punkt.viloyat,
    };

    // Filter by tuman if punkt has tuman
    if (punkt.tuman) {
      filter.tuman = punkt.tuman._id || punkt.tuman;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Contragent.countDocuments(filter);

    const contragents = await Contragent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
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
    console.error('Error fetching contragents in region:', error);
    res.status(500).json({
      success: false,
      message: 'Contragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createPunkt,
  getAllPunkts,
  getPunktById,
  updatePunkt,
  deletePunkt,
  loginPunkt,
  getPunktsForSelection,
  getContragentsInRegion,
};



