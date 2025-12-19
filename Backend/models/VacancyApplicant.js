const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const vacancyApplicantSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Ism kiritilishi shart'],
      trim: true,
      minlength: [2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [100, 'Ism 100 ta belgidan oshmasligi kerak'],
    },
    lastName: {
      type: String,
      required: [true, 'Familiya kiritilishi shart'],
      trim: true,
      minlength: [2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [100, 'Familiya 100 ta belgidan oshmasligi kerak'],
    },
    phone: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'To\'g\'ri telefon raqam formatini kiriting'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    birthDate: {
      type: Date,
      required: [true, 'Tug\'ilgan sana kiritilishi shart'],
    },
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Viloyat kiritilishi shart'],
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Tuman kiritilishi shart'],
    },
    mfy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'MFY kiritilishi shart'],
    },
    password: {
      type: String,
      required: [true, 'Parol kiritilishi shart'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password
vacancyApplicantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

vacancyApplicantSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

vacancyApplicantSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

vacancyApplicantSchema.index({ phone: 1 }, { unique: true });
vacancyApplicantSchema.index({ viloyat: 1 });
vacancyApplicantSchema.index({ tuman: 1 });
vacancyApplicantSchema.index({ mfy: 1 });

const VacancyApplicant = mongoose.model('VacancyApplicant', vacancyApplicantSchema);

module.exports = VacancyApplicant;



