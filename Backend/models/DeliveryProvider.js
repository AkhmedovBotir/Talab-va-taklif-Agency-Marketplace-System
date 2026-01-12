const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const deliveryProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Yetkazib beruvchi nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Yetkazib beruvchi nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [200, 'Yetkazib beruvchi nomi 200 ta belgidan oshmasligi kerak'],
    },
    phone: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'To\'g\'ri telefon raqam formatini kiriting'],
    },
    password: {
      type: String,
      required: [true, 'Parol kiritilishi shart'],
      minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'],
      select: false, // Don't return password by default
    },
    contragent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contragent',
      required: [true, 'Kontragent kiritilishi shart'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Eslatmalar 1000 ta belgidan oshmasligi kerak'],
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique phone per contragent (excluding deleted)
deliveryProviderSchema.index(
  { contragent: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Hash password before saving
deliveryProviderSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
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
deliveryProviderSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
deliveryProviderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
deliveryProviderSchema.index({ contragent: 1 });
deliveryProviderSchema.index({ status: 1 });
deliveryProviderSchema.index({ isDeleted: 1 });
deliveryProviderSchema.index({ createdAt: -1 });

const DeliveryProvider = mongoose.model('DeliveryProvider', deliveryProviderSchema);

module.exports = DeliveryProvider;
