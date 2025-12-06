const Vacancy = require('../models/Vacancy');
const VacancyApplication = require('../models/VacancyApplication');
const VacancyBookmark = require('../models/VacancyBookmark');
const VacancyView = require('../models/VacancyView');
const VacancyApplicant = require('../models/VacancyApplicant');

// Get all vacancies for applicant (with filters)
const getVacancies = async (req, res) => {
  try {
    const { target, type, search, page = 1, limit = 20 } = req.query;
    const applicantId = req.user.userId;

    const filter = {};

    if (target) {
      filter.target = target;
    }

    if (type) {
      filter.type = type;
    }

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
      .limit(limitNum)
      .lean();

    // Get application status and bookmark status for each vacancy
    const vacancyIds = vacancies.map((v) => v._id);
    const [applications, bookmarks] = await Promise.all([
      VacancyApplication.find({
        vacancy: { $in: vacancyIds },
        applicant: applicantId,
      }).select('vacancy status'),
      VacancyBookmark.find({
        vacancy: { $in: vacancyIds },
        applicant: applicantId,
      }).select('vacancy'),
    ]);

    const applicationMap = {};
    applications.forEach((app) => {
      applicationMap[app.vacancy.toString()] = app.status;
    });

    const bookmarkSet = new Set(bookmarks.map((b) => b.vacancy.toString()));

    // Get application counts and view counts for each vacancy
    const [applicationCounts, viewCounts] = await Promise.all([
      VacancyApplication.aggregate([
        { $match: { vacancy: { $in: vacancyIds } } },
        { $group: { _id: '$vacancy', count: { $sum: 1 } } },
      ]),
      VacancyView.aggregate([
        { $match: { vacancy: { $in: vacancyIds } } },
        { $group: { _id: '$vacancy', count: { $sum: 1 } } },
      ]),
    ]);

    const applicationCountMap = {};
    applicationCounts.forEach((item) => {
      applicationCountMap[item._id.toString()] = item.count;
    });

    const viewCountMap = {};
    viewCounts.forEach((item) => {
      viewCountMap[item._id.toString()] = item.count;
    });

    const vacanciesWithStatus = vacancies.map((vacancy) => ({
      ...vacancy,
      applicationStatus: applicationMap[vacancy._id.toString()] || null,
      isBookmarked: bookmarkSet.has(vacancy._id.toString()),
      applicationCount: applicationCountMap[vacancy._id.toString()] || 0,
      viewCount: viewCountMap[vacancy._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: vacanciesWithStatus.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: vacanciesWithStatus,
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

// Get vacancy by ID
const getVacancyById = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Get application status and bookmark status
    const [application, bookmark] = await Promise.all([
      VacancyApplication.findOne({
        vacancy: id,
        applicant: applicantId,
      }).select('status'),
      VacancyBookmark.findOne({
        vacancy: id,
        applicant: applicantId,
      }),
    ]);

    // Get application count and view count
    const [applicationCount, viewCount] = await Promise.all([
      VacancyApplication.countDocuments({ vacancy: id }),
      VacancyView.countDocuments({ vacancy: id }),
    ]);

    const vacancyObj = vacancy.toObject();
    vacancyObj.applicationStatus = application ? application.status : null;
    vacancyObj.isBookmarked = !!bookmark;
    vacancyObj.applicationCount = applicationCount;
    vacancyObj.viewCount = viewCount;

    res.status(200).json({
      success: true,
      data: vacancyObj,
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

// Apply to vacancy (submit application with questionnaire answers)
const applyToVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const applicantId = req.user.userId;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Javoblar kiritilishi shart',
      });
    }

    // Check if vacancy exists
    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Check if already applied
    const existingApplication = await VacancyApplication.findOne({
      vacancy: id,
      applicant: applicantId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bu vakansiyaga allaqachon topshirgansiz',
      });
    }

    // Validate answers against vacancy questions
    if (answers.length !== vacancy.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Barcha savollarga javob berilishi shart',
      });
    }

    // Validate each answer
    const validatedAnswers = [];
    for (let i = 0; i < vacancy.questions.length; i++) {
      const question = vacancy.questions[i];
      const answer = answers.find((a) => a.questionId === i.toString() || a.questionId === question._id?.toString());

      if (!answer) {
        return res.status(400).json({
          success: false,
          message: `Savol ${i + 1} uchun javob topilmadi`,
        });
      }

      // Check required questions
      if (question.required && (!answer.answer || answer.answer === '')) {
        return res.status(400).json({
          success: false,
          message: `Savol "${question.question}" majburiy`,
        });
      }

      // Validate answer type
      if (answer.answer && answer.answer !== '') {
        if (question.type === 'number' && isNaN(answer.answer)) {
          return res.status(400).json({
            success: false,
            message: `Savol "${question.question}" uchun raqam kiritilishi kerak`,
          });
        }

        if (question.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer.answer)) {
          return res.status(400).json({
            success: false,
            message: `Savol "${question.question}" uchun to'g'ri email kiritilishi kerak`,
          });
        }

        if (question.type === 'phone' && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(answer.answer)) {
          return res.status(400).json({
            success: false,
            message: `Savol "${question.question}" uchun to'g'ri telefon raqam kiritilishi kerak`,
          });
        }

        if ((question.type === 'select' || question.type === 'radio') && !question.options.includes(answer.answer)) {
          return res.status(400).json({
            success: false,
            message: `Savol "${question.question}" uchun berilgan variantlardan birini tanlash kerak`,
          });
        }

        if (question.type === 'checkbox' && (!Array.isArray(answer.answer) || answer.answer.some((a) => !question.options.includes(a)))) {
          return res.status(400).json({
            success: false,
            message: `Savol "${question.question}" uchun berilgan variantlardan tanlash kerak`,
          });
        }
      }

      validatedAnswers.push({
        questionId: i.toString(),
        question: question.question,
        type: question.type,
        answer: answer.answer || '',
      });
    }

    // Create application
    const application = await VacancyApplication.create({
      vacancy: id,
      applicant: applicantId,
      answers: validatedAnswers,
      status: 'pending',
    });

    const populatedApplication = await VacancyApplication.findById(application._id)
      .populate('vacancy', 'name target type')
      .populate('applicant', 'firstName lastName phone');

    res.status(201).json({
      success: true,
      message: 'Vakansiyaga muvaffaqiyatli topshirildi',
      data: populatedApplication,
    });
  } catch (error) {
    console.error('Error applying to vacancy:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu vakansiyaga allaqachon topshirgansiz',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Vakansiyaga topshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get my applications
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const applicantId = req.user.userId;

    const filter = { applicant: applicantId };

    if (status) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await VacancyApplication.countDocuments(filter);

    const applications = await VacancyApplication.find(filter)
      .populate('vacancy', 'name target type experience salary description responsibilities preferences skills minAge maxAge')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({
      success: false,
      message: 'Topshirgan vakansiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get application by ID with full details (answers, evaluations, interview stages, final decision)
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    const application = await VacancyApplication.findOne({
      _id: id,
      applicant: applicantId,
    })
      .populate('vacancy', 'name target type experience salary description responsibilities preferences skills minAge maxAge questions')
      .populate('applicant', 'firstName lastName phone gender birthDate viloyat tuman mfy avatar')
      .populate('adminDecidedBy', 'username')
      .populate('applicant.viloyat', 'name type code')
      .populate('applicant.tuman', 'name type code')
      .populate('applicant.mfy', 'name type code');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Topshirishni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get application evaluations (admin evaluation and interview stage evaluations)
const getApplicationEvaluations = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    const application = await VacancyApplication.findOne({
      _id: id,
      applicant: applicantId,
    }).select('adminEvaluation interviewStages.evaluation interviewStages.stageName interviewStages.stageOrder');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Format evaluations
    const evaluations = {
      adminEvaluation: application.adminEvaluation || [],
      interviewStages: application.interviewStages.map((stage) => ({
        stageId: stage._id,
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        evaluation: stage.evaluation || [],
      })),
    };

    res.status(200).json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Baholashlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get application interview stages
const getApplicationInterviewStages = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    const application = await VacancyApplication.findOne({
      _id: id,
      applicant: applicantId,
    }).select('interviewStages');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Sort by stageOrder
    const stages = application.interviewStages.sort((a, b) => a.stageOrder - b.stageOrder);

    res.status(200).json({
      success: true,
      count: stages.length,
      data: stages,
    });
  } catch (error) {
    console.error('Error fetching interview stages:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu bosqichlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get single interview stage by ID
const getInterviewStageById = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const applicantId = req.user.userId;

    const application = await VacancyApplication.findOne({
      _id: id,
      applicant: applicantId,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    const stage = application.interviewStages.id(stageId);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Intervyu bosqichi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: stage,
    });
  } catch (error) {
    console.error('Error fetching interview stage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu bosqichini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Respond to final decision
const respondToFinalDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    const application = await VacancyApplication.findOne({
      _id: id,
      applicant: applicantId,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Check if final decision exists
    if (!application.finalDecision || application.finalDecision.result === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yakuniy qaror hali qilinmagan',
      });
    }

    // Check if already responded
    if (application.finalDecision.responseStatus === 'responded') {
      return res.status(400).json({
        success: false,
        message: 'Yakuniy qarorga allaqachon javob berilgan',
      });
    }

    // Update response status
    application.finalDecision.responseStatus = 'responded';
    application.finalDecision.respondedAt = new Date();
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Yakuniy qarorga javob berildi',
      data: {
        finalDecision: application.finalDecision,
      },
    });
  } catch (error) {
    console.error('Error responding to final decision:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Javob berishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Bookmark/unbookmark vacancy
const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    // Check if vacancy exists
    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Check if already bookmarked
    const existingBookmark = await VacancyBookmark.findOne({
      vacancy: id,
      applicant: applicantId,
    });

    if (existingBookmark) {
      // Remove bookmark
      await VacancyBookmark.findByIdAndDelete(existingBookmark._id);
      return res.status(200).json({
        success: true,
        message: 'Vakansiya saqlanganlar ro\'yxatidan olib tashlandi',
        isBookmarked: false,
      });
    } else {
      // Add bookmark
      await VacancyBookmark.create({
        vacancy: id,
        applicant: applicantId,
      });
      return res.status(200).json({
        success: true,
        message: 'Vakansiya saqlanganlar ro\'yxatiga qo\'shildi',
        isBookmarked: true,
      });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu vakansiya allaqachon saqlangan',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Saqlab olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get bookmarked vacancies
const getBookmarkedVacancies = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const applicantId = req.user.userId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await VacancyBookmark.countDocuments({ applicant: applicantId });

    const bookmarks = await VacancyBookmark.find({ applicant: applicantId })
      .populate('vacancy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get application status for each bookmarked vacancy
    const vacancyIds = bookmarks.map((b) => b.vacancy._id);
    const applications = await VacancyApplication.find({
      vacancy: { $in: vacancyIds },
      applicant: applicantId,
    }).select('vacancy status');

    const applicationMap = {};
    applications.forEach((app) => {
      applicationMap[app.vacancy.toString()] = app.status;
    });

    // Get application counts and view counts
    const [applicationCounts, viewCounts] = await Promise.all([
      VacancyApplication.aggregate([
        { $match: { vacancy: { $in: vacancyIds } } },
        { $group: { _id: '$vacancy', count: { $sum: 1 } } },
      ]),
      VacancyView.aggregate([
        { $match: { vacancy: { $in: vacancyIds } } },
        { $group: { _id: '$vacancy', count: { $sum: 1 } } },
      ]),
    ]);

    const applicationCountMap = {};
    applicationCounts.forEach((item) => {
      applicationCountMap[item._id.toString()] = item.count;
    });

    const viewCountMap = {};
    viewCounts.forEach((item) => {
      viewCountMap[item._id.toString()] = item.count;
    });

    const data = bookmarks.map((bookmark) => {
      const vacancy = bookmark.vacancy.toObject ? bookmark.vacancy.toObject() : bookmark.vacancy;
      return {
        ...vacancy,
        applicationStatus: applicationMap[vacancy._id.toString()] || null,
        isBookmarked: true,
        applicationCount: applicationCountMap[vacancy._id.toString()] || 0,
        viewCount: viewCountMap[vacancy._id.toString()] || 0,
        bookmarkedAt: bookmark.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data,
    });
  } catch (error) {
    console.error('Error fetching bookmarked vacancies:', error);
    res.status(500).json({
      success: false,
      message: 'Saqlangan vakansiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Track vacancy view
const trackVacancyView = async (req, res) => {
  try {
    const { id } = req.params;
    const applicantId = req.user.userId;

    // Check if vacancy exists
    const vacancy = await Vacancy.findById(id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Try to create view record (unique index ensures one view per user-vacancy pair)
    try {
      await VacancyView.create({
        vacancy: id,
        applicant: applicantId,
      });

      // Get updated view count
      const viewCount = await VacancyView.countDocuments({ vacancy: id });

      return res.status(200).json({
        success: true,
        message: 'Ko\'rish muvaffaqiyatli qayd etildi',
        viewCount,
      });
    } catch (error) {
      // If duplicate (already viewed), just return success with current count
      if (error.code === 11000) {
        const viewCount = await VacancyView.countDocuments({ vacancy: id });
        return res.status(200).json({
          success: true,
          message: 'Ko\'rish allaqachon qayd etilgan',
          viewCount,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error tracking vacancy view:', error);
    res.status(500).json({
      success: false,
      message: 'Ko\'rishni qayd etishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getVacancies,
  getVacancyById,
  applyToVacancy,
  getMyApplications,
  getApplicationById,
  getApplicationEvaluations,
  getApplicationInterviewStages,
  getInterviewStageById,
  respondToFinalDecision,
  toggleBookmark,
  getBookmarkedVacancies,
  trackVacancyView,
};

