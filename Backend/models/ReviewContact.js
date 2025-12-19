const mongoose = require('mongoose');

const reviewContactSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: [true, 'Baholash kiritilishi shart'],
    },
    message: {
      type: String,
      required: [true, 'Xabar kiritilishi shart'],
      trim: true,
      maxlength: [2000, 'Xabar 2000 ta belgidan oshmasligi kerak'],
    },
    isPositive: {
      type: Boolean,
      required: [true, 'Ijobiylik belgilanishi shart'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak'],
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewContactSchema.index({ review: 1 }, { unique: true });
reviewContactSchema.index({ isPositive: 1 });
reviewContactSchema.index({ status: 1 });
reviewContactSchema.index({ createdAt: -1 });

const ReviewContact = mongoose.model('ReviewContact', reviewContactSchema);

module.exports = ReviewContact;





