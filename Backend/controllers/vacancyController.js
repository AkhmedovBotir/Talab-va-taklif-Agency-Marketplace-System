const Vacancy = require('../models/Vacancy');

// Create vacancy (admin only)
const createVacancy = async (req, res) => {
  try {
    const {
      name,
      target, // 'agent' | 'punkt'
      experience,
      type, // 'parttime' | 'fulltime'
      salary,
      description,
      responsibilities,
      preferences,
      skills = [],
      minAge,
      maxAge,
      questions = [],
    } = req.body;

    // Basic required checks
    if (!name || !target || !type) {
      return res.status(400).json({
        success: false,
        message: 'name, target, type majburiy',
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kamida bitta savol kiritilishi shart',
      });
    }

    // Validate question types quickly before save
    const allowedQuestionTypes = ['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'date', 'file'];
    for (const q of questions) {
      if (!q.question || !q.type) {
        return res.status(400).json({
          success: false,
          message: 'Har bir savol uchun question va type majburiy',
        });
      }
      if (!allowedQuestionTypes.includes(q.type)) {
        return res.status(400).json({
          success: false,
          message: `Savol turi noto'g'ri: ${q.type}`,
        });
      }
    }

    const vacancy = await Vacancy.create({
      name,
      target,
      experience,
      type,
      salary,
      description,
      responsibilities,
      preferences,
      skills,
      minAge,
      maxAge,
      questions,
    });

    res.status(201).json({
      success: true,
      message: 'Vakansiya muvaffaqiyatli yaratildi',
      data: vacancy,
    });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    res.status(500).json({
      success: false,
      message: 'Vakansiya yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get vacancies (admin) with filters and pagination
const getVacancies = async (req, res) => {
  try {
    const { target, type, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (target) filter.target = target;
    if (type) filter.type = type;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Vacancy.countDocuments(filter);
    const vacancies = await Vacancy.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: vacancies.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: vacancies,
    });
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    res.status(500).json({
      success: false,
      message: 'Vakansiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get vacancy by ID (admin)
const getVacancyById = async (req, res) => {
  try {
    const { id } = req.params;
    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }
    res.status(200).json({
      success: true,
      data: vacancy,
    });
  } catch (error) {
    console.error('Error fetching vacancy:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri vakansiya ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Vakansiyani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update vacancy (admin) - to'liq yangilash
const updateVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      target,
      experience,
      type,
      salary,
      description,
      responsibilities,
      preferences,
      skills,
      minAge,
      maxAge,
      questions,
    } = req.body;

    // Find vacancy
    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Validate questions if provided
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kamida bitta savol kiritilishi shart',
        });
      }

      // Validate question types
      const allowedQuestionTypes = ['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'date', 'file'];
      for (const q of questions) {
        if (!q.question || !q.type) {
          return res.status(400).json({
            success: false,
            message: 'Har bir savol uchun question va type majburiy',
          });
        }
        if (!allowedQuestionTypes.includes(q.type)) {
          return res.status(400).json({
            success: false,
            message: `Savol turi noto'g'ri: ${q.type}`,
          });
        }
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (target !== undefined) updateData.target = target;
    if (experience !== undefined) updateData.experience = experience;
    if (type !== undefined) updateData.type = type;
    if (salary !== undefined) updateData.salary = salary;
    if (description !== undefined) updateData.description = description;
    if (responsibilities !== undefined) updateData.responsibilities = responsibilities;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (skills !== undefined) updateData.skills = skills;
    if (minAge !== undefined) updateData.minAge = minAge;
    if (maxAge !== undefined) updateData.maxAge = maxAge;
    if (questions !== undefined) updateData.questions = questions;

    // Update vacancy
    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Vakansiya muvaffaqiyatli yangilandi',
      data: updatedVacancy,
    });
  } catch (error) {
    console.error('Error updating vacancy:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri vakansiya ID',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validatsiya xatosi',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Vakansiyani yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete vacancy (admin)
const deleteVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const vacancy = await Vacancy.findByIdAndDelete(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Vakansiya muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri vakansiya ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Vakansiyani o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createVacancy,
  getVacancies,
  getVacancyById,
  updateVacancy,
  deleteVacancy,
};


