const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'productModel', // Dynamic reference based on productType
      required: [true, 'Maxsulot kiritilishi shart'],
    },
    productType: {
      type: String,
      enum: ['tuman', 'maxalla'],
      default: 'tuman',
      required: true,
    },
    productModel: {
      type: String,
      enum: ['Product', 'MaxallaProduct'],
      default: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Miqdor kiritilishi shart'],
      min: [1, 'Miqdor kamida 1 bo\'lishi kerak'],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Foydalanuvchi kiritilishi shart'],
    },
    cartType: {
      type: String,
      enum: ['tuman', 'maxalla'],
      default: 'tuman',
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - user + cartType must be unique
cartSchema.index({ user: 1, cartType: 1 }, { unique: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;






