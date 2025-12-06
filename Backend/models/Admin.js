const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['general', 'admin'],
      required: [true, 'Role is required'],
      default: 'general',
    },
    telefonRaqam: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please provide a valid phone number'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      lowercase: true,
    },
    parol: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: [true, 'Status is required'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('parol')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.parol = await bcrypt.hash(this.parol, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.parol);
};

// Remove password from JSON output
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.parol;
  return obj;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;

