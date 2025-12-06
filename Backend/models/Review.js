const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Buyurtma kiritilishi shart'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Mahsulot kiritilishi shart'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Foydalanuvchi kiritilishi shart'],
    },
    rating: {
      type: Number,
      required: [true, 'Baholash kiritilishi shart'],
      min: [1, 'Baholash kamida 1 bo\'lishi kerak'],
      max: [5, 'Baholash maksimal 5 bo\'lishi kerak'],
    },
    commentTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewCommentTemplate',
      default: null,
    },
    customComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maxsus kommentariya 1000 ta belgidan oshmasligi kerak'],
      default: null,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewContact',
      default: null,
    },
    isPositive: {
      type: Boolean,
      default: null, // null - shablon tanlangan, true - ijobiy, false - salbiy
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ order: 1 });
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isPositive: 1 });
reviewSchema.index({ createdAt: -1 });

// Ensure one review per order-product combination
reviewSchema.index({ order: 1, product: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;





