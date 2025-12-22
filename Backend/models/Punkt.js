const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const punktSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
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
        return !this.passwordSetupAllowed; // Password is not required if passwordSetupAllowed is true
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    passwordSetupAllowed: {
      type: Boolean,
      default: false,
    },
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Viloyat is required'],
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

// Hash password before saving
punktSchema.pre('save', async function (next) {
  if (this.passwordSetupAllowed && !this.password) {
    return next(); // Skip hashing if passwordSetupAllowed is true and no password is provided
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
punktSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
punktSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
punktSchema.index({ viloyat: 1 });
punktSchema.index({ tuman: 1 });
// Unique index for phone - only for non-deleted punkts
// Note: MongoDB partialFilterExpression doesn't support $or, so we handle duplicates in code
// This index allows multiple deleted punkts to have the same phone
punktSchema.index({ phone: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDeleted: false } 
});
punktSchema.index({ status: 1 });
punktSchema.index({ isDeleted: 1 });
punktSchema.index({ deletedAt: 1 });

const Punkt = mongoose.model('Punkt', punktSchema);

module.exports = Punkt;



