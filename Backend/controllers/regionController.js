const Region = require('../models/Region');
const { cacheInvalidators } = require('../middleware/cache');

// Create new region
const createRegion = async (req, res) => {
  try {
    const { name, type, parent, code, status } = req.body;

    // Check if code already exists
    const existingCode = await Region.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Bu kod allaqachon mavjud',
      });
    }

    // If parent is provided, validate it exists
    if (parent) {
      const parentRegion = await Region.findById(parent);
      if (!parentRegion) {
        return res.status(400).json({
          success: false,
          message: 'Ota xudud topilmadi',
        });
      }
    }

    const region = await Region.create({
      name,
      type,
      parent: parent || null,
      code,
      status: status || 'active',
    });

    // Populate parent if exists
    await region.populate('parent', 'name type code');

    // Invalidate cache
    await cacheInvalidators.invalidateRegionCache();

    res.status(201).json({
      success: true,
      message: 'Xudud muvaffaqiyatli yaratildi',
      data: region,
    });
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({
      success: false,
      message: 'Xudud yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all regions
const getAllRegions = async (req, res) => {
  try {
    const { type, parent, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (parent !== undefined) {
      if (parent === 'null' || parent === '') {
        filter.parent = null;
      } else {
        filter.parent = parent;
      }
    }

    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Region.countDocuments(filter);

    // Get regions with pagination
    const regions = await Region.find(filter)
      .populate('parent', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: regions.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: regions,
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Xududlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get region by ID
const getRegionById = async (req, res) => {
  try {
    const { id } = req.params;

    const region = await Region.findById(id).populate('parent', 'name type code');

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Xudud topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: region,
    });
  } catch (error) {
    console.error('Error fetching region:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Xududni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update region
const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingCode = await Region.findOne({
        code: updateData.code,
        _id: { $ne: id },
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Bu kod allaqachon mavjud',
        });
      }
    }

    // If parent is being updated, validate it exists
    if (updateData.parent) {
      const parentRegion = await Region.findById(updateData.parent);
      if (!parentRegion) {
        return res.status(400).json({
          success: false,
          message: 'Ota xudud topilmadi',
        });
      }

      // Prevent circular reference (region cannot be its own parent)
      if (updateData.parent === id) {
        return res.status(400).json({
          success: false,
          message: 'Xudud o\'zining ota xududi bo\'la olmaydi',
        });
      }
    }

    const region = await Region.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('parent', 'name type code');

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Xudud topilmadi',
      });
    }

    // Invalidate cache
    await cacheInvalidators.invalidateRegionCache();

    res.status(200).json({
      success: true,
      message: 'Xudud muvaffaqiyatli yangilandi',
      data: region,
    });
  } catch (error) {
    console.error('Error updating region:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Xududni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete region
const deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the region first
    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Xudud topilmadi',
      });
    }

    // Recursively delete all children regions
    const deleteChildren = async (parentId) => {
      const children = await Region.find({ parent: parentId });
      
      for (const child of children) {
        // Recursively delete grandchildren first
        await deleteChildren(child._id);
        // Then delete the child
        await Region.findByIdAndDelete(child._id);
      }
    };

    // Delete all children first
    await deleteChildren(id);

    // Delete the region itself
    await Region.findByIdAndDelete(id);

    // Invalidate cache
    await cacheInvalidators.invalidateRegionCache();

    res.status(200).json({
      success: true,
      message: 'Xudud va uning bolalar xududlari muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting region:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Xududni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get regions by type
const getRegionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { status, parent } = req.query;

    if (!['region', 'district', 'mfy'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud turi. Qabul qilinadigan turlar: region, district, mfy',
      });
    }

    const filter = { type };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add parent filter if provided
    if (parent !== undefined) {
      if (parent === 'null' || parent === '') {
        filter.parent = null;
      } else {
        filter.parent = parent;
      }
    }

    const regions = await Region.find(filter)
      .populate('parent', 'name type code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: regions.length,
      data: regions,
    });
  } catch (error) {
    console.error('Error fetching regions by type:', error);
    res.status(500).json({
      success: false,
      message: 'Xududlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get children of a region
const getRegionChildren = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Xudud topilmadi',
      });
    }

    const filter = { parent: id };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    const children = await Region.find(filter)
      .populate('parent', 'name type code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: children.length,
      data: children,
    });
  } catch (error) {
    console.error('Error fetching region children:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Bolalar xududlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update region status
const updateRegionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status "active" yoki "inactive" bo\'lishi kerak',
      });
    }

    const region = await Region.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    ).populate('parent', 'name type code');

    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Xudud topilmadi',
      });
    }

    // Invalidate cache
    await cacheInvalidators.invalidateRegionCache();

    res.status(200).json({
      success: true,
      message: 'Xudud statusi muvaffaqiyatli yangilandi',
      data: region,
    });
  } catch (error) {
    console.error('Error updating region status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri xudud ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Xudud statusini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createRegion,
  getAllRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
  getRegionsByType,
  getRegionChildren,
  updateRegionStatus,
};

