const mongoose = require('mongoose');

const smsVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
    },
    code: {
      type: String,
      required: [true, 'Kod kiritilishi shart'],
    },
    type: {
      type: String,
      enum: [
        'login',
        'register',
        'forgot_password',
        'contragent_password_setup',
        'punkt_password_setup',
        'agent_password_setup',
        'device_verification',
      ],
      required: [true, 'Kod turi kiritilishi shart'],
    },
    // Device verification specific fields
    deviceId: {
      type: String,
      default: null,
    },
    userModel: {
      type: String,
      enum: ['Admin', 'Contragent', 'Punkt', 'Agent'],
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active codes
smsVerificationSchema.index({ phone: 1, type: 1, isUsed: 1, expiresAt: 1 });

const SmsVerification = mongoose.model('SmsVerification', smsVerificationSchema);

module.exports = SmsVerification;

