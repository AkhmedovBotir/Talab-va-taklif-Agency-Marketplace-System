const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    // User reference (polymorphic)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Foydalanuvchi kiritilishi shart'],
      refPath: 'userModel',
    },
    userModel: {
      type: String,
      required: [true, 'Foydalanuvchi modeli kiritilishi shart'],
      enum: ['Admin', 'Contragent', 'Punkt', 'Agent'],
    },
    // Device information
    deviceId: {
      type: String,
      required: [true, 'Qurilma ID kiritilishi shart'],
      trim: true,
    },
    deviceName: {
      type: String,
      trim: true,
      maxlength: [200, 'Qurilma nomi 200 ta belgidan oshmasligi kerak'],
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'web', 'unknown'],
      default: 'unknown',
    },
    platform: {
      type: String,
      trim: true,
      maxlength: [100, 'Platforma 100 ta belgidan oshmasligi kerak'],
    },
    os: {
      type: String,
      trim: true,
      maxlength: [100, 'Operatsion tizim 100 ta belgidan oshmasligi kerak'],
    },
    browser: {
      type: String,
      trim: true,
      maxlength: [100, 'Brauzer 100 ta belgidan oshmasligi kerak'],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent 500 ta belgidan oshmasligi kerak'],
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    // Last activity
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    // Location (optional)
    location: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one active device per user
deviceSchema.index({ user: 1, userModel: 1, isActive: 1 });
deviceSchema.index({ deviceId: 1, user: 1, userModel: 1 }, { unique: true });
deviceSchema.index({ user: 1, userModel: 1, isPrimary: 1 });
deviceSchema.index({ lastActivityAt: -1 });

// Method to check if device is primary
deviceSchema.methods.isPrimaryDevice = function () {
  return this.isPrimary === true;
};

// Method to deactivate device
deviceSchema.methods.deactivate = async function () {
  this.isActive = false;
  this.lastActivityAt = new Date();
  await this.save();
};

// Method to activate device
deviceSchema.methods.activate = async function () {
  this.isActive = true;
  this.lastLoginAt = new Date();
  this.lastActivityAt = new Date();
  await this.save();
};

// Static method to find or create device
deviceSchema.statics.findOrCreateDevice = async function (user, userModel, deviceData) {
  const { deviceId, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location } = deviceData;

  // Find existing device
  let device = await this.findOne({
    user: user._id,
    userModel,
    deviceId,
    isActive: true,
  });

  if (device) {
    // Update last activity
    device.lastLoginAt = new Date();
    device.lastActivityAt = new Date();
    if (ipAddress) device.ipAddress = ipAddress;
    if (userAgent) device.userAgent = userAgent;
    if (location) device.location = location;
    await device.save();
    return { device, isNew: false };
  }

  // Check if user has any active device
  const activeDevices = await this.find({
    user: user._id,
    userModel,
    isActive: true,
  });

  // If no active devices, this becomes primary
  const isPrimary = activeDevices.length === 0;

  // Create new device
  device = await this.create({
    user: user._id,
    userModel,
    deviceId,
    deviceName,
    deviceType,
    platform,
    os,
    browser,
    ipAddress,
    userAgent,
    location,
    isPrimary,
    isActive: true,
    lastLoginAt: new Date(),
    lastActivityAt: new Date(),
  });

  return { device, isNew: true };
};

// Static method to get user's active devices
deviceSchema.statics.getUserActiveDevices = async function (user, userModel) {
  return await this.find({
    user: user._id || user,
    userModel,
    isActive: true,
  }).sort({ lastActivityAt: -1 });
};

// Static method to get user's primary device
deviceSchema.statics.getUserPrimaryDevice = async function (user, userModel) {
  return await this.findOne({
    user: user._id || user,
    userModel,
    isPrimary: true,
    isActive: true,
  });
};

// Static method to deactivate all user devices except one
deviceSchema.statics.deactivateAllExcept = async function (user, userModel, exceptDeviceId) {
  await this.updateMany(
    {
      user: user._id || user,
      userModel,
      deviceId: { $ne: exceptDeviceId },
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        lastActivityAt: new Date(),
      },
    }
  );
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;




