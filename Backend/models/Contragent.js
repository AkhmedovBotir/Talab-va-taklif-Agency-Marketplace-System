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
      required: function() {
        // INN faqat tuman kontragentlar uchun required
        return this.contragentLevel !== 'mfy';
      },
      trim: true,
      match: [/^\d{9}$|^\d{12}$/, 'INN must be 9 or 12 digits'],
      default: null,
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
      required: function() {
        return !this.passwordSetupAllowed;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    passwordSetupAllowed: {
      type: Boolean,
      default: false,
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
    activityType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContragentType',
      required: [true, 'Faoliyat turi kiritilishi shart'],
    },
    contragentLevel: {
      type: String,
      enum: ['tuman', 'mfy'],
      default: 'tuman',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Maxalla kontragentlar uchun ish vaqti
    workingHours: {
      open: {
        type: String,
        trim: true,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Ish vaqti formati noto\'g\'ri (HH:MM)'],
        default: null,
      },
      close: {
        type: String,
        trim: true,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Ish vaqti formati noto\'g\'ri (HH:MM)'],
        default: null,
      },
    },
    // Maxalla kontragentlar uchun xizmat ko'rsatish hududlari
    serviceAreas: {
      tuman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region',
        default: null,
      },
      mfys: {
        type: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        }],
        default: [],
      },
    },
    // Oddiy kontragentlar uchun yetkazib berish hududlari (viloyat -> tuman)
    deliveryRegions: {
      type: [{
        viloyat: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
          required: true,
        },
        tuman: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
          default: null,
        },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
contragentSchema.pre('save', async function (next) {
  // Skip password hashing if passwordSetupAllowed is true and password is not set
  if (this.passwordSetupAllowed && !this.password) {
    return next();
  }

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
// INN unique, lekin faqat null bo'lmaganlar uchun
contragentSchema.index(
  { inn: 1 },
  {
    unique: true,
    sparse: true, // Sparse index allows multiple null values
    partialFilterExpression: { inn: { $exists: true, $ne: null } },
  }
);
contragentSchema.index({ phone: 1 }, { unique: true });
contragentSchema.index({ viloyat: 1 });
contragentSchema.index({ tuman: 1 });
contragentSchema.index({ mfy: 1 });
contragentSchema.index({ activityType: 1 });
contragentSchema.index({ contragentLevel: 1 });
contragentSchema.index({ status: 1 });
contragentSchema.index({ isFeaturedForMarketplace: 1 });
contragentSchema.index({ 'deliveryRegions.viloyat': 1 });
contragentSchema.index({ 'deliveryRegions.tuman': 1 });

const Contragent = mongoose.model('Contragent', contragentSchema);

module.exports = Contragent;

