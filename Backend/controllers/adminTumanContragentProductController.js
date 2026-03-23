const Product = require('../models/Product');
const Category = require('../models/Category');
const Contragent = require('../models/Contragent');

/**
 * Admin: Tuman kontragentlari ro'yxati (maxsulot qo'shish uchun tanlash)
 */
const getTumanContragents = async (req, res) => {
  try {
    const { viloyat, tuman, status = 'active', page = 1, limit = 50 } = req.query;

    const filter = { contragentLevel: 'tuman' };
    if (status) filter.status = status;
    if (viloyat) filter.viloyat = viloyat;
    if (tuman) filter.tuman = tuman;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await Contragent.countDocuments(filter);
    const contragents = await Contragent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .populate('activityType', 'name')
      .select('-password')
      .sort({ name: 1 })
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
    console.error('Error fetching tuman contragents for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Tuman kontragentlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

/**
 * Admin: Tuman kontragenti uchun maxsulot qo'shish
 */
const createTumanContragentProduct = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const {
      contragentId,
      name,
      description,
      price,
      originalPrice,
      images,
      category,
      subcategory,
      quantity,
      unit,
      unitSize,
      length,
      width,
      weight,
      status,
      kpiBonusPercent,
      deliveryRegions: bodyDeliveryRegions,
    } = req.body;

    const contragent = await Contragent.findById(contragentId);
    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }
    if (contragent.contragentLevel !== 'tuman') {
      return res.status(400).json({
        success: false,
        message: 'Faqat tuman darajadagi kontragent uchun maxsulot qo\'shish mumkin',
      });
    }
    if (contragent.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Kontragent faol emas',
      });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Kategoriya topilmadi' });
    }
    if (categoryDoc.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Kategoriya faol emas' });
    }
    if (categoryDoc.createdByModel !== 'Admin') {
      return res.status(400).json({ success: false, message: 'Bu kategoriya foydalanish uchun ruxsat berilmagan' });
    }
    if (categoryDoc.parent) {
      return res.status(400).json({ success: false, message: 'Kategoriya top-level bo\'lishi kerak' });
    }

    let productCensored = categoryDoc.censored || false;
    if (subcategory) {
      const subcategoryDoc = await Category.findById(subcategory);
      if (!subcategoryDoc) {
        return res.status(400).json({ success: false, message: 'Sub kategoriya topilmadi' });
      }
      if (subcategoryDoc.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Sub kategoriya faol emas' });
      }
      if (subcategoryDoc.createdByModel !== 'Admin') {
        return res.status(400).json({ success: false, message: 'Bu sub kategoriya foydalanish uchun ruxsat berilmagan' });
      }
      if (subcategoryDoc.parent?.toString() !== category.toString()) {
        return res.status(400).json({ success: false, message: 'Sub kategoriya tanlangan kategoriyaga tegishli emas' });
      }
      productCensored = subcategoryDoc.censored || categoryDoc.censored || false;
    }

    const deliveryRegions = Array.isArray(bodyDeliveryRegions) && bodyDeliveryRegions.length > 0
      ? bodyDeliveryRegions
      : (contragent.deliveryRegions || []);

    const productCode = await Product.generateProductCode(contragentId);

    const product = await Product.create({
      name,
      description: description || null,
      price,
      originalPrice,
      images: images || [],
      category,
      subcategory: subcategory || null,
      quantity,
      unit,
      unitSize: unitSize || null,
      length: length || null,
      width: width || null,
      weight: weight || null,
      status: status || 'active',
      contragent: contragentId,
      deliveryRegions,
      kpiBonusPercent,
      productCode,
      moderationStatus: 'approved',
      moderatedBy: adminId,
      moderatedAt: new Date(),
      censored: productCensored,
    });

    await product.populate('category', 'name slug');
    if (product.subcategory) await product.populate('subcategory', 'name slug');
    await product.populate('contragent', 'name inn phone viloyat tuman');
    await product.populate('deliveryRegions.viloyat', 'name type code');
    await product.populate('deliveryRegions.tuman', 'name type code');

    res.status(201).json({
      success: true,
      message: 'Tuman kontragenti uchun maxsulot muvaffaqiyatli qo\'shildi',
      data: product,
    });
  } catch (error) {
    console.error('Error creating tuman contragent product:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors || {}).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({ success: false, message: 'Validatsiya xatosi', errors });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Maxsulot kodi allaqachon mavjud' });
    }
    res.status(500).json({
      success: false,
      message: 'Maxsulot qo\'shishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

/**
 * Admin: Tuman kontragentlari maxsulotlari ro'yxati
 */
const getTumanContragentProducts = async (req, res) => {
  try {
    const { contragentId, category, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (contragentId) {
      const contragent = await Contragent.findById(contragentId).select('contragentLevel');
      if (!contragent || contragent.contragentLevel !== 'tuman') {
        return res.status(400).json({
          success: false,
          message: 'Tuman kontragenti topilmadi',
        });
      }
      filter.contragent = contragentId;
    } else {
      const tumanContragentIds = await Contragent.find({ contragentLevel: 'tuman' }).distinct('_id');
      filter.contragent = { $in: tumanContragentIds };
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone viloyat tuman')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    console.error('Error fetching tuman contragent products:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri ID formati' });
    }
    res.status(500).json({
      success: false,
      message: 'Maxsulotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

/**
 * Admin: Tuman kontragent maxsuloti by ID
 */
const getTumanContragentProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('contragent', 'name inn phone viloyat tuman mfy activityType')
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Maxsulot topilmadi' });
    }

    const contragent = await Contragent.findById(product.contragent._id).select('contragentLevel');
    if (!contragent || contragent.contragentLevel !== 'tuman') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot tuman kontragentiga tegishli emas',
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching tuman contragent product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri maxsulot ID' });
    }
    res.status(500).json({
      success: false,
      message: 'Maxsulotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

/**
 * Admin: Tuman kontragent maxsulotini yangilash
 */
const updateTumanContragentProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Maxsulot topilmadi' });
    }

    const contragent = await Contragent.findById(product.contragent).select('contragentLevel');
    if (!contragent || contragent.contragentLevel !== 'tuman') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot tuman kontragentiga tegishli emas',
      });
    }

    const allowed = [
      'name', 'description', 'price', 'originalPrice', 'images', 'category', 'subcategory',
      'quantity', 'unit', 'unitSize', 'length', 'width', 'weight', 'status',
      'kpiBonusPercent', 'deliveryRegions',
    ];
    const toUpdate = {};
    allowed.forEach((key) => {
      if (updateFields[key] !== undefined) toUpdate[key] = updateFields[key];
    });

    if (Object.keys(toUpdate).length === 0) {
      return res.status(400).json({ success: false, message: 'Yangilash uchun hech narsa yuborilmadi' });
    }

    if (toUpdate.category) {
      const cat = await Category.findById(toUpdate.category);
      if (!cat || cat.status !== 'active' || cat.createdByModel !== 'Admin' || cat.parent) {
        return res.status(400).json({ success: false, message: 'Kategoriya noto\'g\'ri yoki faol emas' });
      }
    }
    if (toUpdate.subcategory) {
      const sub = await Category.findById(toUpdate.subcategory);
      if (!sub || sub.status !== 'active' || sub.createdByModel !== 'Admin') {
        return res.status(400).json({ success: false, message: 'Sub kategoriya noto\'g\'ri yoki faol emas' });
      }
    }

    Object.assign(product, toUpdate);
    await product.save();

    await product.populate('category', 'name slug');
    if (product.subcategory) await product.populate('subcategory', 'name slug');
    await product.populate('contragent', 'name inn phone viloyat tuman');
    await product.populate('deliveryRegions.viloyat', 'name type code');
    await product.populate('deliveryRegions.tuman', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli yangilandi',
      data: product,
    });
  } catch (error) {
    console.error('Error updating tuman contragent product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri maxsulot ID' });
    }
    res.status(500).json({
      success: false,
      message: 'Maxsulotni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

/**
 * Admin: Tuman kontragent maxsulotini o'chirish (status = archived)
 */
const deleteTumanContragentProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Maxsulot topilmadi' });
    }

    const contragent = await Contragent.findById(product.contragent).select('contragentLevel');
    if (!contragent || contragent.contragentLevel !== 'tuman') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot tuman kontragentiga tegishli emas',
      });
    }

    product.status = 'archived';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Maxsulot muvaffaqiyatli o\'chirildi (arxivlandi)',
      data: { _id: product._id, status: product.status },
    });
  } catch (error) {
    console.error('Error deleting tuman contragent product:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri maxsulot ID' });
    }
    res.status(500).json({
      success: false,
      message: 'Maxsulotni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getTumanContragents,
  createTumanContragentProduct,
  getTumanContragentProducts,
  getTumanContragentProductById,
  updateTumanContragentProduct,
  deleteTumanContragentProduct,
};
