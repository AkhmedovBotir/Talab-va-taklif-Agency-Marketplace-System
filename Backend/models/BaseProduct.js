const mongoose = require('mongoose');

const baseProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Maxsulot nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [500, 'Maxsulot nomi 500 ta belgidan oshmasligi kerak'],
    },
    description: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maksimal 5 ta rasm yuklash mumkin',
      },
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Kategoriya kiritilishi shart'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    unit: {
      type: String,
      enum: ['dona', 'litr', 'kg'],
      required: [true, 'Birlik kiritilishi shart'],
    },
    unitSize: {
      type: Number,
      default: null,
      min: [0, 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
baseProductSchema.index({ category: 1 });
baseProductSchema.index({ subcategory: 1 });
baseProductSchema.index({ status: 1 });
baseProductSchema.index({ createdBy: 1 });
baseProductSchema.index({ createdAt: -1 });

const BaseProduct = mongoose.model('BaseProduct', baseProductSchema);

module.exports = BaseProduct;
