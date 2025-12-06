const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String, // question index yoki unique identifier
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'date', 'file'],
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // String, Number, Array, yoki Object (file uchun)
      required: true,
    },
  },
  { _id: false }
);

// Baholash sxemasi
const evaluationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: [0, 'Baho 0 dan kam bo\'lishi mumkin emas'],
      max: [10, 'Baho 10 dan oshmasligi kerak'],
    },
  },
  { _id: false }
);

// Intervyu bosqichi sxemasi
const stageSchema = new mongoose.Schema(
  {
    stageName: {
      type: String,
      required: true,
      trim: true,
    },
    stageOrder: {
      type: Number,
      required: true,
      min: [1, 'Bosqich tartibi 1 dan kam bo\'lishi mumkin emas'],
    },
    interviewDate: {
      type: Date,
      required: true,
    },
    interviewTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Vaqt formati noto\'g\'ri (HH:MM)'],
    },
    location: {
      type: String,
      trim: true,
    },
    interviewer: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    evaluation: {
      type: [evaluationSchema],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: true }
);

// Yakuniy qaror sxemasi
const finalDecisionSchema = new mongoose.Schema(
  {
    result: {
      type: String,
      enum: ['pending', 'hired', 'rejected'],
      default: 'pending',
    },
    reason: {
      type: String,
      trim: true,
    },
    responseStatus: {
      type: String,
      enum: ['waiting', 'responded'],
      default: 'waiting',
    },
    respondedAt: {
      type: Date,
    },
    decidedAt: {
      type: Date,
    },
    decidedBy: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const vacancyApplicationSchema = new mongoose.Schema(
  {
    vacancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: [true, 'Vakansiya ID kiritilishi shart'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VacancyApplicant',
      required: [true, 'Nomzod ID kiritilishi shart'],
    },
    answers: {
      type: [answerSchema],
      required: [true, 'Javoblar kiritilishi shart'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Kamida bitta javob kiritilishi shart',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
    },
    // Admin tomonidan qabul qilish/bekor qilish
    adminDecision: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    adminEvaluation: {
      type: [evaluationSchema],
      default: [],
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    adminDecidedAt: {
      type: Date,
    },
    adminDecidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    // Intervyu bosqichlari
    interviewStages: {
      type: [stageSchema],
      default: [],
    },
    // Yakuniy qaror
    finalDecision: {
      type: finalDecisionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
vacancyApplicationSchema.index({ vacancy: 1, applicant: 1 }, { unique: true });
vacancyApplicationSchema.index({ applicant: 1 });
vacancyApplicationSchema.index({ vacancy: 1 });
vacancyApplicationSchema.index({ status: 1 });
vacancyApplicationSchema.index({ createdAt: -1 });

const VacancyApplication = mongoose.model('VacancyApplication', vacancyApplicationSchema);

module.exports = VacancyApplication;


