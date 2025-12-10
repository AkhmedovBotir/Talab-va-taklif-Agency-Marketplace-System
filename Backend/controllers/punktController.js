const Punkt = require('../models/Punkt');
const jwt = require('jsonwebtoken');

// Create new punkt
const createPunkt = async (req, res) => {
  try {
    const { name, phone, password, viloyat, tuman, status } = req.body;

    // Check if phone number already exists
    const existingPhone = await Punkt.findOne({ phone });
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

    res.status(201).json({
      success: true,
      message: 'Punkt muvaffaqiyatli yaratildi',
      data: punkt,
    });
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

    const punkt = await Punkt.findById(id)
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

    // If phone is being updated, check for duplicates
    if (updateData.phone) {
      const existingPhone = await Punkt.findOne({
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

    // If password is being updated, we need to hash it first
    // We'll use save() method instead of findByIdAndUpdate to trigger pre('save') hook
    if (updateData.password) {
      const punkt = await Punkt.findById(id);
      
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

    // If password is not being updated, use findByIdAndUpdate
    const punkt = await Punkt.findByIdAndUpdate(
      id,
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

// Delete punkt
const deletePunkt = async (req, res) => {
  try {
    const { id } = req.params;

    const punkt = await Punkt.findByIdAndDelete(id);

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Punkt muvaffaqiyatli o\'chirildi',
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

    // Find punkt with password field included
    const punkt = await Punkt.findOne({ phone }).select('+password');

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

module.exports = {
  createPunkt,
  getAllPunkts,
  getPunktById,
  updatePunkt,
  deletePunkt,
  loginPunkt,
  getPunktsForSelection,
};



