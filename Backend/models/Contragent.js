const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const contragentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    inn: {
      type: String,
      required: [true, 'INN is required'],
      trim: true,
      match: [/^\d{9}$|^\d{12}$/, 'INN must be 9 or 12 digits'],
    },
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Viloyat is required'],
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Tuman is required'],
    },
    mfy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'MFY is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please provide a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    logo: {
      type: String,
      default: null,
      trim: true,
    },
    // Marketplace uchun ajratilgan (tanlangan) kontragentlar flag'i
    isFeaturedForMarketplace: {
      type: Boolean,
      default: false,
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
contragentSchema.pre('save', async function (next) {
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
contragentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
contragentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
contragentSchema.index({ inn: 1 }, { unique: true });
contragentSchema.index({ phone: 1 }, { unique: true });
contragentSchema.index({ viloyat: 1 });
contragentSchema.index({ tuman: 1 });
contragentSchema.index({ mfy: 1 });
contragentSchema.index({ status: 1 });
contragentSchema.index({ isFeaturedForMarketplace: 1 });

const Contragent = mongoose.model('Contragent', contragentSchema);

module.exports = Contragent;

