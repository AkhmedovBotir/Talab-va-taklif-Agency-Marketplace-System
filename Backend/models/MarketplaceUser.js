const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const marketplaceUserSchema = new mongoose.Schema(
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
    gender: {
      type: String,
      enum: ['ayol', 'erkak'],
      required: [true, 'Jins kiritilishi shart'],
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
    birthDate: {
      type: Date,
      required: [true, 'Tug\'ilgan sana kiritilishi shart'],
    },
    password: {
      type: String,
      required: [true, 'Parol kiritilishi shart'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'],
      select: false, // Don't return password by default
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
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

// Hash password before saving
marketplaceUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
marketplaceUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
marketplaceUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
marketplaceUserSchema.index({ phone: 1 }, { unique: true });
marketplaceUserSchema.index({ viloyat: 1 });
marketplaceUserSchema.index({ tuman: 1 });
marketplaceUserSchema.index({ mfy: 1 });
marketplaceUserSchema.index({ status: 1 });

const MarketplaceUser = mongoose.model('MarketplaceUser', marketplaceUserSchema);

module.exports = MarketplaceUser;

