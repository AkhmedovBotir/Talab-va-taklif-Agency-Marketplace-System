const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Ism kiritilishi shart'],
      trim: true,
      minlength: [2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [50, 'Ism 50 ta belgidan oshmasligi kerak'],
    },
    lastName: {
      type: String,
      required: [true, 'Familiya kiritilishi shart'],
      trim: true,
      minlength: [2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [50, 'Familiya 50 ta belgidan oshmasligi kerak'],
    },
    phone: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'To\'g\'ri telefon raqam formatini kiriting'],
    },
    telegramId: {
      type: String,
      default: null,
      trim: true,
    },
    registrationType: {
      type: String,
      enum: ['bot', 'web'],
      default: 'web',
    },
    // Vacancy information (embedded for easy access)
    vacancyTitle: {
      type: String,
      default: null,
    },
    vacancyDepartment: {
      type: String,
      default: null,
    },
    vacancyPosition: {
      type: String,
      default: null,
    },
    // Interview information
    interviewRating: {
      type: Number,
      default: null,
      min: 0,
      max: 10,
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    // Test results
    averageTestScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    // Application status
    applicationStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
candidateSchema.index({ phone: 1 });
candidateSchema.index({ lastName: 1, firstName: 1 });

// Virtual for full name
candidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

candidateSchema.set('toJSON', { virtuals: true });
candidateSchema.set('toObject', { virtuals: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;

