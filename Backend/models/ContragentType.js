const mongoose = require('mongoose');

const contragentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [200, 'Nomi 200 ta belgidan oshmasligi kerak'],
    },
    icon: {
      type: String,
      required: [true, 'Icon kiritilishi shart'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contragentTypeSchema.index({ name: 1 });
contragentTypeSchema.index({ status: 1 });

const ContragentType = mongoose.model('ContragentType', contragentTypeSchema);

module.exports = ContragentType;





