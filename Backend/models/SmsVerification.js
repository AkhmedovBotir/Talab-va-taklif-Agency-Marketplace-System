const mongoose = require('mongoose');

const smsVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Kod kiritilishi shart'],
    },
    type: {
      type: String,
      enum: ['login', 'register', 'forgot_password'],
      required: [true, 'Kod turi kiritilishi shart'],
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

