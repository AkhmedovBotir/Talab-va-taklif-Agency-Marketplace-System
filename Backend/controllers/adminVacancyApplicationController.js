const VacancyApplication = require('../models/VacancyApplication');
const Vacancy = require('../models/Vacancy');
const VacancyApplicant = require('../models/VacancyApplicant');
const Punkt = require('../models/Punkt');
const Agent = require('../models/Agent');
const Region = require('../models/Region');
const { cacheInvalidators } = require('../middleware/cache');

// Get all applications for a vacancy (admin only)
const getApplicationsByVacancy = async (req, res) => {
  try {
    const { vacancyId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Check if vacancy exists
    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        message: 'Vakansiya topilmadi',
      });
    }

    // Build filter
    const filter = { vacancy: vacancyId };
    if (status) {
      filter.status = status;
    }

    const total = await VacancyApplication.countDocuments(filter);

    const applications = await VacancyApplication.find(filter)
      .populate('applicant', 'firstName lastName phone gender birthDate avatar viloyat tuman mfy')
      .populate('adminDecidedBy', 'username')
      .populate('applicant.viloyat', 'name')
      .populate('applicant.tuman', 'name')
      .populate('applicant.mfy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

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
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Topshirishlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get application by ID with full details (admin only)
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await VacancyApplication.findById(id)
      .populate('vacancy')
      .populate('applicant', '-password')
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

// Accept or reject application (admin only)
const decideApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, evaluation = [], notes } = req.body;
    const adminId = req.user.userId;

    if (!decision || !['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Qaror (accepted yoki rejected) kiritilishi shart',
      });
    }

    const application = await VacancyApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Validate evaluation if provided
    if (Array.isArray(evaluation) && evaluation.length > 0) {
      for (const evalItem of evaluation) {
        if (!evalItem.name || typeof evalItem.score !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Baholash formati noto\'g\'ri. Har bir element {name: string, score: number} bo\'lishi kerak',
          });
        }
        if (evalItem.score < 0 || evalItem.score > 10) {
          return res.status(400).json({
            success: false,
            message: 'Baho 0 dan 10 gacha bo\'lishi kerak',
          });
        }
      }
    }

    // Update application
    application.adminDecision = decision;
    application.status = decision === 'accepted' ? 'accepted' : 'rejected';
    if (evaluation.length > 0) {
      application.adminEvaluation = evaluation;
    }
    if (notes) {
      application.adminNotes = notes;
    }
    application.adminDecidedAt = new Date();
    application.adminDecidedBy = adminId;

    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');
    await application.populate('adminDecidedBy', 'username');

    res.status(200).json({
      success: true,
      message: `Topshirish ${decision === 'accepted' ? 'qabul qilindi' : 'bekor qilindi'}`,
      data: application,
    });
  } catch (error) {
    console.error('Error deciding application:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Qaror qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Add interview stage (admin only)
const addInterviewStage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stageName,
      stageOrder,
      interviewDate,
      interviewTime,
      location,
      interviewer,
      notes,
    } = req.body;

    if (!stageName || !stageOrder || !interviewDate || !interviewTime) {
      return res.status(400).json({
        success: false,
        message: 'stageName, stageOrder, interviewDate, interviewTime majburiy',
      });
    }

    const application = await VacancyApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Check if application is accepted
    if (application.adminDecision !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Intervyu faqat qabul qilingan topshirishlar uchun rejalashtiriladi',
      });
    }

    // Validate date
    const interviewDateTime = new Date(interviewDate);
    if (isNaN(interviewDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Intervyu sanasi noto\'g\'ri',
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(interviewTime)) {
      return res.status(400).json({
        success: false,
        message: 'Vaqt formati noto\'g\'ri (HH:MM)',
      });
    }

    // Add new stage
    const newStage = {
      stageName,
      stageOrder: parseInt(stageOrder, 10),
      interviewDate: interviewDateTime,
      interviewTime,
      location: location || '',
      interviewer: interviewer || '',
      notes: notes || '',
      status: 'scheduled',
      result: 'pending',
      evaluation: [],
    };

    application.interviewStages.push(newStage);
    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');

    res.status(200).json({
      success: true,
      message: 'Intervyu bosqichi qo\'shildi',
      data: application,
    });
  } catch (error) {
    console.error('Error adding interview stage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu bosqichini qo\'shishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update interview stage (admin only)
const updateInterviewStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const {
      stageName,
      stageOrder,
      interviewDate,
      interviewTime,
      location,
      interviewer,
      notes,
      status,
      result,
      evaluation = [],
    } = req.body;

    const application = await VacancyApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Find stage
    const stage = application.interviewStages.id(stageId);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Intervyu bosqichi topilmadi',
      });
    }

    // Update fields
    if (stageName !== undefined) stage.stageName = stageName;
    if (stageOrder !== undefined) stage.stageOrder = parseInt(stageOrder, 10);
    if (interviewDate !== undefined) {
      const date = new Date(interviewDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Intervyu sanasi noto\'g\'ri',
        });
      }
      stage.interviewDate = date;
    }
    if (interviewTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(interviewTime)) {
        return res.status(400).json({
          success: false,
          message: 'Vaqt formati noto\'g\'ri (HH:MM)',
        });
      }
      stage.interviewTime = interviewTime;
    }
    if (location !== undefined) stage.location = location;
    if (interviewer !== undefined) stage.interviewer = interviewer;
    if (notes !== undefined) stage.notes = notes;
    if (status !== undefined) {
      if (!['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status noto\'g\'ri',
        });
      }
      stage.status = status;
      if (status === 'completed') {
        stage.completedAt = new Date();
      }
    }
    if (result !== undefined) {
      if (!['pending', 'passed', 'failed'].includes(result)) {
        return res.status(400).json({
          success: false,
          message: 'Natija noto\'g\'ri',
        });
      }
      stage.result = result;
    }
    if (Array.isArray(evaluation) && evaluation.length > 0) {
      // Validate evaluation
      for (const evalItem of evaluation) {
        if (!evalItem.name || typeof evalItem.score !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Baholash formati noto\'g\'ri',
          });
        }
        if (evalItem.score < 0 || evalItem.score > 10) {
          return res.status(400).json({
            success: false,
            message: 'Baho 0 dan 10 gacha bo\'lishi kerak',
          });
        }
      }
      stage.evaluation = evaluation;
    }

    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');

    res.status(200).json({
      success: true,
      message: 'Intervyu bosqichi yangilandi',
      data: application,
    });
  } catch (error) {
    console.error('Error updating interview stage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu bosqichini yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Make final decision (admin only)
const makeFinalDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, reason, decidedBy } = req.body;
    const adminId = req.user.userId;

    if (!result || !['hired', 'rejected'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Yakuniy qaror (hired yoki rejected) kiritilishi shart',
      });
    }

    const application = await VacancyApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Topshirish topilmadi',
      });
    }

    // Check if all interview stages are completed
    if (application.interviewStages.length > 0) {
      const incompleteStages = application.interviewStages.filter(
        (stage) => stage.status !== 'completed'
      );
      if (incompleteStages.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Barcha intervyu bosqichlari yakunlanishi kerak',
        });
      }

      // Check if all stages passed
      const failedStages = application.interviewStages.filter(
        (stage) => stage.result === 'failed'
      );
      if (failedStages.length > 0 && result === 'hired') {
        return res.status(400).json({
          success: false,
          message: 'Muvaffaqiyatsiz intervyu bosqichlari bor. Ishga qabul qilish mumkin emas',
        });
      }
    }

    // Update final decision
    application.finalDecision = {
      result,
      reason: reason || '',
      responseStatus: 'waiting',
      decidedAt: new Date(),
      decidedBy: decidedBy || '',
    };

    // Update application status
    application.status = result === 'hired' ? 'accepted' : 'rejected';

    // If hired, create Punkt or Agent based on vacancy target
    let createdUser = null;
    if (result === 'hired') {
      // Populate vacancy and applicant
      await application.populate('vacancy');
      await application.populate('applicant');

      const vacancy = application.vacancy;
      const applicant = application.applicant;

      if (vacancy.target === 'punkt') {
        // Create Punkt
        const punktName = `${applicant.firstName} ${applicant.lastName}`;
        
        // Check if phone already exists
        const existingPhone = await Punkt.findOne({
          phone: applicant.phone,
          isDeleted: { $ne: true },
        });
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: 'Bu telefon raqami allaqachon punkt sifatida mavjud',
          });
        }

        // Validate viloyat
        const viloyatRegion = await Region.findById(applicant.viloyat);
        if (!viloyatRegion || viloyatRegion.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
          });
        }

        // Validate tuman if provided
        if (applicant.tuman) {
          const tumanRegion = await Region.findById(applicant.tuman).populate('parent');
          if (!tumanRegion || tumanRegion.type !== 'district') {
            return res.status(400).json({
              success: false,
              message: 'Tuman topilmadi yoki noto\'g\'ri tur',
            });
          }
          if (tumanRegion.parent && tumanRegion.parent._id.toString() !== applicant.viloyat.toString()) {
            return res.status(400).json({
              success: false,
              message: 'Tuman viloyatga tegishli emas',
            });
          }
        }

        // Check if there's already an active punkt in this position
        const positionFilter = {
          viloyat: applicant.viloyat,
          tuman: applicant.tuman || null,
          isDeleted: { $ne: true },
          status: 'active',
        };

        const existingPunktInPosition = await Punkt.findOne(positionFilter);
        if (existingPunktInPosition) {
          const tumanName = applicant.tuman ? ' va tuman' : '';
          return res.status(400).json({
            success: false,
            message: `Bu viloyat${tumanName} uchun allaqachon faol punkt mavjud`,
          });
        }

        // Create Punkt - use phone as default password (user will change it)
        // Password will be hashed automatically by Punkt model's pre('save') hook
        const punkt = await Punkt.create({
          name: punktName,
          phone: applicant.phone,
          password: applicant.phone, // Default password is phone number (user should change it)
          viloyat: applicant.viloyat,
          tuman: applicant.tuman || null,
          status: 'active',
        });

        // Populate regions
        await punkt.populate([
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
        ]);

        // Invalidate cache
        await cacheInvalidators.invalidatePunktCache();

        createdUser = {
          type: 'punkt',
          data: punkt,
        };
      } else if (vacancy.target === 'agent') {
        // Create Agent
        const agentName = `${applicant.firstName} ${applicant.lastName}`;
        
        // Check if phone already exists
        const existingPhone = await Agent.findOne({
          phone: applicant.phone,
          isDeleted: { $ne: true },
        });
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: 'Bu telefon raqami allaqachon agent sifatida mavjud',
          });
        }

        // Validate regions
        const viloyatRegion = await Region.findById(applicant.viloyat);
        if (!viloyatRegion || viloyatRegion.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
          });
        }

        // Validate tuman if provided
        if (applicant.tuman) {
          const tumanRegion = await Region.findById(applicant.tuman);
          if (!tumanRegion || tumanRegion.type !== 'district') {
            return res.status(400).json({
              success: false,
              message: 'Tuman topilmadi yoki noto\'g\'ri tur',
            });
          }
          if (tumanRegion.parent?.toString() !== applicant.viloyat.toString()) {
            return res.status(400).json({
              success: false,
              message: 'Tuman tanlangan viloyatga tegishli emas',
            });
          }
        }

        // Validate mfy if provided
        if (applicant.mfy) {
          if (!applicant.tuman) {
            return res.status(400).json({
              success: false,
              message: 'MFY tanlash uchun tuman ham tanlanishi kerak',
            });
          }
          const mfyRegion = await Region.findById(applicant.mfy);
          if (!mfyRegion || mfyRegion.type !== 'mfy') {
            return res.status(400).json({
              success: false,
              message: 'MFY topilmadi yoki noto\'g\'ri tur',
            });
          }
          if (mfyRegion.parent?.toString() !== applicant.tuman.toString()) {
            return res.status(400).json({
              success: false,
              message: 'MFY tanlangan tumanga tegishli emas',
            });
          }
        }

        // Check if there's already an active agent in this position
        const positionFilter = {
          viloyat: applicant.viloyat,
          isDeleted: { $ne: true },
          status: 'active',
        };

        if (applicant.tuman) {
          positionFilter.tuman = applicant.tuman;
        } else {
          positionFilter.tuman = null;
        }

        if (applicant.mfy) {
          positionFilter.mfy = applicant.mfy;
        } else {
          positionFilter.mfy = null;
        }

        const existingAgentInPosition = await Agent.findOne(positionFilter);
        if (existingAgentInPosition) {
          let positionName = 'Bu viloyat';
          if (applicant.tuman) {
            positionName += ' va tuman';
          }
          if (applicant.mfy) {
            positionName += ' va MFY';
          }
          return res.status(400).json({
            success: false,
            message: `${positionName} uchun allaqachon faol agent mavjud`,
          });
        }

        // Create Agent - use phone as default password (user will change it)
        // Password will be hashed automatically by Agent model's pre('save') hook
        const agent = await Agent.create({
          name: agentName,
          viloyat: applicant.viloyat,
          tuman: applicant.tuman || null,
          mfy: applicant.mfy || null,
          phone: applicant.phone,
          password: applicant.phone, // Default password is phone number (user should change it)
          status: 'active',
        });

        // Populate regions
        await agent.populate('viloyat', 'name type code');
        if (agent.tuman) {
          await agent.populate('tuman', 'name type code');
        }
        if (agent.mfy) {
          await agent.populate('mfy', 'name type code');
        }

        // Determine agent type
        const agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

        // Invalidate cache
        await cacheInvalidators.invalidateAgentCache();

        createdUser = {
          type: 'agent',
          data: {
            ...agent.toObject(),
            agentType,
          },
        };
      }
    }

    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');
    await application.populate('adminDecidedBy', 'username');
    await application.populate('vacancy', 'name target');

    res.status(200).json({
      success: true,
      message: `Yakuniy qaror: ${result === 'hired' ? 'Ishga qabul qilindi' : 'Rad etildi'}`,
      data: {
        application,
        createdUser, // null if rejected or if target is not agent/punkt
      },
    });
  } catch (error) {
    console.error('Error making final decision:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri topshirish ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Yakuniy qaror qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete interview stage (admin only)
const deleteInterviewStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;

    const application = await VacancyApplication.findById(id);
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

    application.interviewStages.pull(stageId);
    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');

    res.status(200).json({
      success: true,
      message: 'Intervyu bosqichi o\'chirildi',
      data: application,
    });
  } catch (error) {
    console.error('Error deleting interview stage:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu bosqichini o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get interview stage by ID (admin only)
const getInterviewStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;

    const application = await VacancyApplication.findById(id)
      .populate('vacancy', 'name target type')
      .populate('applicant', '-password')
      .populate('applicant.viloyat', 'name type code')
      .populate('applicant.tuman', 'name type code')
      .populate('applicant.mfy', 'name type code');

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
      data: {
        application: {
          _id: application._id,
          vacancy: application.vacancy,
          applicant: application.applicant,
          status: application.status,
          adminDecision: application.adminDecision,
        },
        interviewStage: stage,
      },
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

// Submit interview result (admin only)
const submitInterviewResult = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { result, evaluation = [], notes } = req.body;

    if (!result || !['passed', 'failed'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Natija (passed yoki failed) kiritilishi shart',
      });
    }

    const application = await VacancyApplication.findById(id);
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

    // Validate evaluation if provided
    if (Array.isArray(evaluation) && evaluation.length > 0) {
      for (const evalItem of evaluation) {
        if (!evalItem.name || typeof evalItem.score !== 'number') {
          return res.status(400).json({
            success: false,
            message: 'Baholash formati noto\'g\'ri. Har bir element {name: string, score: number} bo\'lishi kerak',
          });
        }
        if (evalItem.score < 0 || evalItem.score > 10) {
          return res.status(400).json({
            success: false,
            message: 'Baho 0 dan 10 gacha bo\'lishi kerak',
          });
        }
      }
    }

    // Update stage result and evaluation
    stage.result = result;
    if (evaluation.length > 0) {
      stage.evaluation = evaluation;
    }
    if (notes !== undefined) {
      stage.notes = notes;
    }

    // If result is passed or failed, mark as completed
    if (result === 'passed' || result === 'failed') {
      stage.status = 'completed';
      stage.completedAt = new Date();
    }

    await application.save();

    // Populate for response
    await application.populate('applicant', '-password');
    await application.populate('vacancy', 'name target type');

    res.status(200).json({
      success: true,
      message: `Intervyu natijasi: ${result === 'passed' ? 'Muvaffaqiyatli o\'tdi' : 'Muvaffaqiyatsiz'}`,
      data: {
        application: {
          _id: application._id,
          vacancy: application.vacancy,
          applicant: application.applicant,
          status: application.status,
        },
        interviewStage: stage,
      },
    });
  } catch (error) {
    console.error('Error submitting interview result:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Intervyu natijasini kiritishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getApplicationsByVacancy,
  getApplicationById,
  decideApplication,
  addInterviewStage,
  updateInterviewStage,
  deleteInterviewStage,
  getInterviewStage,
  submitInterviewResult,
  makeFinalDecision,
};

