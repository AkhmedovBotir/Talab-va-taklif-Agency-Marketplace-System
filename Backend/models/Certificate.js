const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Nomzod kiritilishi shart'],
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Berilgan admin kiritilishi shart'],
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    revocationReason: {
      type: String,
      default: null,
      maxlength: [500, 'Bekor qilish sababi 500 ta belgidan oshmasligi kerak'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ qrCode: 1 }, { unique: true });
certificateSchema.index({ candidate: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ issuedDate: 1 });

// Static method to generate QR code
certificateSchema.statics.generateQrCode = function () {
  return crypto.createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex');
};

// Static method to generate certificate number
certificateSchema.statics.generateCertificateNumber = async function (issuedDate) {
  const Counter = require('./Counter');
  const date = issuedDate || new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const counterName = `certificate_${dateStr}`;
  const sequence = await Counter.getNextValue(counterName);
  return `CERT-${dateStr}-${sequence}`;
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;

