const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
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
    mfy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
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

// Virtual field for agent type based on selected regions
agentSchema.virtual('agentType').get(function () {
  if (this.mfy) {
    return 'mfy'; // MFY agent
  } else if (this.tuman) {
    return 'tuman'; // Tuman agent
  } else {
    return 'viloyat'; // Viloyat agent
  }
});

// Hash password before saving
agentSchema.pre('save', async function (next) {
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
agentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
agentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
agentSchema.index({ viloyat: 1 });
agentSchema.index({ tuman: 1 });
agentSchema.index({ mfy: 1 });
// Unique index for phone - only for non-deleted agents
// Note: MongoDB partialFilterExpression doesn't support $or, so we handle duplicates in code
// This index allows multiple deleted agents to have the same phone
agentSchema.index({ phone: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDeleted: false } 
});
agentSchema.index({ status: 1 });
agentSchema.index({ isDeleted: 1 });
agentSchema.index({ deletedAt: 1 });

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;



