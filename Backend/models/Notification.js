const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error', 'announcement', 'promotion', 'update'],
      default: 'info',
    },
    targetType: {
      type: String,
      enum: [
        'all',
        'punkts',
        'mfy_agents', // All agents use mfy_agents (backward compatibility)
        'marketplace_users',
        'contragents',
      ],
      required: [true, 'Target type is required'],
    },
    // Optional: specific target IDs (if empty, sends to all of targetType)
    targetIds: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetRefModel',
    }],
    targetRefModel: {
      type: String,
      enum: ['Punkt', 'Agent', 'MarketplaceUser', 'Contragent'],
    },
    // For viloyat/tuman filtering
    viloyatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
    },
    tumanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
    },
    mfyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    readBy: [{
      recipientId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      recipientType: {
        type: String,
        enum: ['Punkt', 'Agent', 'MarketplaceUser', 'Contragent'],
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ targetType: 1, createdAt: -1 });
notificationSchema.index({ isActive: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

