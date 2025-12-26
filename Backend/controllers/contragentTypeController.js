const ContragentType = require('../models/ContragentType');

// Create new contragent type
const createContragentType = async (req, res) => {
  try {
    const { name, icon, status } = req.body;

    const contragentType = await ContragentType.create({
      name,
      icon,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Kontragent faoliyat turi muvaffaqiyatli yaratildi',
      data: contragentType,
    });
  } catch (error) {
    console.error('Error creating contragent type:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragent faoliyat turini yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all contragent types
const getAllContragentTypes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const contragentTypes = await ContragentType.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contragentTypes.length,
      data: contragentTypes,
    });
  } catch (error) {
    console.error('Error fetching contragent types:', error);
    res.status(500).json({
      success: false,
      message: 'Kontragent faoliyat turlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get contragent type by ID
const getContragentTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const contragentType = await ContragentType.findById(id);

    if (!contragentType) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent faoliyat turi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: contragentType,
    });
  } catch (error) {
    console.error('Error fetching contragent type:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent faoliyat turi ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragent faoliyat turini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update contragent type
const updateContragentType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contragentType = await ContragentType.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contragentType) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent faoliyat turi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kontragent faoliyat turi muvaffaqiyatli yangilandi',
      data: contragentType,
    });
  } catch (error) {
    console.error('Error updating contragent type:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent faoliyat turi ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragent faoliyat turini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete contragent type
const deleteContragentType = async (req, res) => {
  try {
    const { id } = req.params;

    const contragentType = await ContragentType.findByIdAndDelete(id);

    if (!contragentType) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent faoliyat turi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kontragent faoliyat turi muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting contragent type:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri kontragent faoliyat turi ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kontragent faoliyat turini o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createContragentType,
  getAllContragentTypes,
  getContragentTypeById,
  updateContragentType,
  deleteContragentType,
};


