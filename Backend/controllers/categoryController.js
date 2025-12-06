const Category = require('../models/Category');

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, parent, status } = req.body;
    const { userId, userType } = req.user; // From authentication middleware

    // If parent is provided, validate it exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ota kategoriya topilmadi',
        });
      }
    }

    const category = await Category.create({
      name,
      parent: parent || null,
      status: status || 'active',
      createdBy: userId,
      createdByModel: userType,
    });

    // Populate parent if exists
    if (category.parent) {
      await category.populate('parent', 'name slug status');
    }

    res.status(201).json({
      success: true,
      message: 'Kategoriya muvaffaqiyatli yaratildi',
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
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

// Create subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, parent, status } = req.body;
    const { userId, userType } = req.user;

    // Parent is required for subcategory
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Sub kategoriya uchun ota kategoriya kiritilishi shart',
      });
    }

    // Validate parent exists
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

    const category = await Category.create({
      name,
      parent,
      status: status || 'active',
      createdBy: userId,
      createdByModel: userType,
    });

    // Populate parent
    await category.populate('parent', 'name slug status');

    res.status(201).json({
      success: true,
      message: 'Sub kategoriya muvaffaqiyatli yaratildi',
      data: category,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
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

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const { status, parent, page = 1, limit = 10 } = req.query;
    const filter = { parent: null }; // Only top-level categories

    if (status) {
      filter.status = status;
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
        select: 'name username phone',
        options: { strictPopulate: false },
      })
      .populate('subcategories', 'name slug status')
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

// Get all subcategories
const getAllSubcategories = async (req, res) => {
  try {
    const { status, parent, page = 1, limit = 10 } = req.query;
    const filter = { parent: { $ne: null } }; // Only subcategories

    if (status) {
      filter.status = status;
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
      .populate('parent', 'name slug status')
      .populate({
        path: 'createdBy',
        select: 'name username phone',
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

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parent', 'name slug status')
      .populate('subcategories', 'name slug status')
      .populate({
        path: 'createdBy',
        select: 'name username phone',
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

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent, status } = req.body;

    // If parent is being updated, validate it
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        // Removing parent (making it a top-level category)
        // Check if this category has subcategories
        const hasSubcategories = await Category.findOne({ parent: id });
        if (hasSubcategories) {
          return res.status(400).json({
            success: false,
            message: 'Bu kategoriyaning sub kategoriyalari mavjud. Avval sub kategoriyalarni o\'chiring yoki boshqa kategoriyaga ko\'chiring',
          });
        }
      } else {
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
        // Prevent circular reference
        if (parent === id) {
          return res.status(400).json({
            success: false,
            message: 'Kategoriya o\'zining ota kategoriyasi bo\'la olmaydi',
          });
        }
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, parent: parent === '' ? null : parent, status },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('parent', 'name slug status')
      .populate('subcategories', 'name slug status')
      .populate({
        path: 'createdBy',
        select: 'name username phone',
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
      message: 'Kategoriya muvaffaqiyatli yangilandi',
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error.code === 11000) {
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

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent, status } = req.body;

    // If parent is being updated, validate it
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        return res.status(400).json({
          success: false,
          message: 'Sub kategoriya uchun ota kategoriya kiritilishi shart',
        });
      }

      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ota kategoriya topilmadi',
        });
      }

      // Check if parent has a parent
      if (parentCategory.parent) {
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
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, parent, status },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('parent', 'name slug status')
      .populate({
        path: 'createdBy',
        select: 'name username phone',
        options: { strictPopulate: false },
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Sub kategoriya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub kategoriya muvaffaqiyatli yangilandi',
      data: category,
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);

    if (error.code === 11000) {
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

// Update category status
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
      .populate('parent', 'name slug status')
      .populate('subcategories', 'name slug status')
      .populate({
        path: 'createdBy',
        select: 'name username phone',
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

// Delete category
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

// Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
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

