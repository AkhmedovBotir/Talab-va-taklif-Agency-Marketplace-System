const Category = require('../models/Category');

// Create category (admin only)
const createCategory = async (req, res) => {
  try {
    const { name, image, censored, status } = req.body;
    const adminId = req.user.userId;

    const category = await Category.create({
      name,
      image: image || null,
      censored: censored !== undefined ? censored : false,
      parent: null, // Top-level category
      status: status || 'active',
      createdBy: adminId,
      createdByModel: 'Admin',
    });

    await category.populate('subcategories', 'name slug status image censored');

    res.status(201).json({
      success: true,
      message: 'Kategoriya muvaffaqiyatli yaratildi',
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      // Check if it's a duplicate name+parent combination
      if (error.keyPattern && error.keyPattern.name && error.keyPattern.parent) {
        return res.status(400).json({
          success: false,
          message: `Bu nom bilan kategoriya allaqachon mavjud. "${name}" nomi bilan kategoriya yaratilgan`,
        });
      }
      // Check if it's a duplicate slug
      if (error.keyPattern && error.keyPattern.slug) {
        return res.status(400).json({
          success: false,
          message: `Bu slug bilan kategoriya allaqachon mavjud. "${name}" nomi bilan kategoriya yaratilgan`,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Bu nom bilan kategoriya allaqachon mavjud',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriya yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Create subcategory (admin only)
const createSubcategory = async (req, res) => {
  try {
    const { name, parent, status } = req.body;
    const adminId = req.user.userId;

    // Parent is required for subcategory
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Sub kategoriya uchun ota kategoriya kiritilishi shart',
      });
    }

    // Validate parent exists and is a top-level category
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: 'Ota kategoriya topilmadi',
      });
    }

    // Check if parent has a parent (subcategory cannot have another subcategory as parent)
    if (parentCategory.parent) {
      return res.status(400).json({
        success: false,
        message: 'Sub kategoriya o\'zining sub kategoriyasiga ega bo\'la olmaydi',
      });
    }

    const subcategory = await Category.create({
      name,
      image: null, // Subcategory doesn't have image
      censored: parentCategory.censored, // Inherit censored from parent category
      parent,
      status: status || 'active',
      createdBy: adminId,
      createdByModel: 'Admin',
    });

    await subcategory.populate('parent', 'name slug status image censored');

    res.status(201).json({
      success: true,
      message: 'Sub kategoriya muvaffaqiyatli yaratildi',
      data: subcategory,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      // Check if it's a duplicate name+parent combination
      if (error.keyPattern && error.keyPattern.name && error.keyPattern.parent) {
        return res.status(400).json({
          success: false,
          message: `Bu nom bilan sub kategoriya allaqachon mavjud. "${name}" nomi bilan sub kategoriya bu kategoriya ostida yaratilgan`,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Bu nom bilan sub kategoriya allaqachon mavjud',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Sub kategoriya yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all categories (admin only - all categories)
const getAllCategories = async (req, res) => {
  try {
    const { status, censored, page = 1, limit = 50 } = req.query;
    const filter = { parent: null }; // Only top-level categories

    if (status) {
      filter.status = status;
    }

    if (censored !== undefined) {
      filter.censored = censored === 'true';
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Category.countDocuments(filter);

    // Get categories with pagination
    const categories = await Category.find(filter)
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      })
      .populate('subcategories', 'name slug status image censored')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all subcategories (admin only)
const getAllSubcategories = async (req, res) => {
  try {
    const { status, censored, parent, page = 1, limit = 50 } = req.query;
    const filter = { parent: { $ne: null } }; // Only subcategories

    if (status) {
      filter.status = status;
    }

    if (censored !== undefined) {
      filter.censored = censored === 'true';
    }

    if (parent) {
      filter.parent = parent;
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Category.countDocuments(filter);

    // Get subcategories with pagination
    const subcategories = await Category.find(filter)
      .populate('parent', 'name slug status image censored')
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: subcategories.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Sub kategoriyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get category by ID (admin only)
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parent', 'name slug status image censored')
      .populate('subcategories', 'name slug status image censored')
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriyani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update category (admin only)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, censored, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (censored !== undefined) updateData.censored = censored;
    if (status !== undefined) updateData.status = status;

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('parent', 'name slug status image censored')
      .populate('subcategories', 'name slug status image censored')
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    // If censored status was updated, update all subcategories to inherit the new value
    if (censored !== undefined) {
      await Category.updateMany(
        { parent: id },
        { censored: censored }
      );
    }

    // Re-populate subcategories to get updated censored values
    await category.populate('subcategories', 'name slug status image censored');

    res.status(200).json({
      success: true,
      message: 'Kategoriya muvaffaqiyatli yangilandi',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.code === 11000) {
      // Check if it's a duplicate name+parent combination
      if (error.keyPattern && error.keyPattern.name && error.keyPattern.parent) {
        const categoryName = name || 'Bu nom';
        return res.status(400).json({
          success: false,
          message: `Bu nom bilan kategoriya allaqachon mavjud. "${categoryName}" nomi bilan kategoriya yaratilgan`,
        });
      }
      // Check if it's a duplicate slug
      if (error.keyPattern && error.keyPattern.slug) {
        const categoryName = name || 'Bu nom';
        return res.status(400).json({
          success: false,
          message: `Bu slug bilan kategoriya allaqachon mavjud. "${categoryName}" nomi bilan kategoriya yaratilgan`,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Bu nom bilan kategoriya allaqachon mavjud',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriyani yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update subcategory (admin only)
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent, status } = req.body;

    // Get current subcategory to check parent
    const currentSubcategory = await Category.findById(id);
    if (!currentSubcategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub kategoriya topilmadi',
      });
    }

    // If parent is being updated, validate it
    let newParentCategory = null;
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya uchun ota kategoriya kiritilishi shart',
        });
      }

      newParentCategory = await Category.findById(parent);
      if (!newParentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ota kategoriya topilmadi',
        });
      }

      // Check if parent has a parent
      if (newParentCategory.parent) {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya o\'zining sub kategoriyasiga ega bo\'la olmaydi',
        });
      }

      // Prevent circular reference
      if (parent === id) {
        return res.status(400).json({
          success: false,
          message: 'Kategoriya o\'zining ota kategoriyasi bo\'la olmaydi',
        });
      }
    } else {
      // If parent is not being updated, get current parent
      newParentCategory = await Category.findById(currentSubcategory.parent);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (parent !== undefined) updateData.parent = parent;
    if (status !== undefined) updateData.status = status;
    
    // Always set image to null and inherit censored from parent
    updateData.image = null;
    if (newParentCategory) {
      updateData.censored = newParentCategory.censored;
    }

    const subcategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('parent', 'name slug status image censored')
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub kategoriya muvaffaqiyatli yangilandi',
      data: subcategory,
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);

    if (error.code === 11000) {
      // Check if it's a duplicate name+parent combination
      if (error.keyPattern && error.keyPattern.name && error.keyPattern.parent) {
        const categoryName = name || 'Bu nom';
        return res.status(400).json({
          success: false,
          message: `Bu nom bilan sub kategoriya allaqachon mavjud. "${categoryName}" nomi bilan sub kategoriya bu kategoriya ostida yaratilgan`,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Bu nom bilan sub kategoriya allaqachon mavjud',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri sub kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Sub kategoriyani yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update category status (admin only)
const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status "active" yoki "inactive" bo\'lishi kerak',
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('parent', 'name slug status image censored')
      .populate('subcategories', 'name slug status image censored')
      .populate({
        path: 'createdBy',
        select: 'name username telefonRaqam',
        options: { strictPopulate: false },
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kategoriya statusi muvaffaqiyatli yangilandi',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category status:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriya statusini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete category (admin only)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has subcategories
    const hasSubcategories = await Category.findOne({ parent: id });
    if (hasSubcategories) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriyaning sub kategoriyalari mavjud. Avval sub kategoriyalarni o\'chiring',
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kategoriya muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting category:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kategoriyani o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete subcategory (admin only)
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Category.findByIdAndDelete(id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub kategoriya muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri sub kategoriya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Sub kategoriyani o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createCategory,
  createSubcategory,
  getAllCategories,
  getAllSubcategories,
  getCategoryById,
  updateCategory,
  updateSubcategory,
  updateCategoryStatus,
  deleteCategory,
  deleteSubcategory,
};

