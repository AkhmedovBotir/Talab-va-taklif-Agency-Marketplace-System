const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Savol kiritilishi shart'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'email', 'phone', 'select', 'radio', 'checkbox', 'date', 'file'],
      required: [true, 'Savol turi kiritilishi shart'],
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    placeholder: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const vacancySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nom kiritilishi shart'],
      trim: true,
      minlength: [2, 'Nom kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [300, 'Nom 300 ta belgidan oshmasligi kerak'],
    },
    target: {
      type: String,
      enum: ['agent', 'punkt'],
      required: [true, 'Target (agent|punkt) kiritilishi shart'],
    },
    experience: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['parttime', 'fulltime'],
      required: [true, 'Ish turi (parttime|fulltime) kiritilishi shart'],
    },
    salary: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: mongoose.Schema.Types.Mixed, // delta formatni saqlash uchun
      default: null,
    },
    responsibilities: {
      type: mongoose.Schema.Types.Mixed, // delta formatni saqlash uchun
      default: null,
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed, // delta formatni saqlash uchun
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    minAge: {
      type: Number,
      default: null,
      min: [0, 'Yosh manfiy bo\'lishi mumkin emas'],
    },
    maxAge: {
      type: Number,
      default: null,
      min: [0, 'Yosh manfiy bo\'lishi mumkin emas'],
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Kamida bitta savol kiritilishi shart',
      },
    },
  },
  {
    timestamps: true,
  }
);

vacancySchema.index({ target: 1 });
vacancySchema.index({ type: 1 });
vacancySchema.index({ createdAt: -1 });

const Vacancy = mongoose.model('Vacancy', vacancySchema);

module.exports = Vacancy;





