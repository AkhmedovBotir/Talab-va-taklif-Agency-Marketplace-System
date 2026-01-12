const mongoose = require('mongoose');

const maxallaProductSchema = new mongoose.Schema(
  {
    baseProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BaseProduct',
      required: [true, 'Asosiy maxsulot kiritilishi shart'],
    },
    contragent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contragent',
      required: [true, 'Kontragent kiritilishi shart'],
    },
    quantity: {
      type: Number,
      required: [true, 'Miqdor kiritilishi shart'],
      min: [0, 'Miqdor 0 dan kichik bo\'la olmaydi'],
    },
    price: {
      type: Number,
      required: [true, 'Narx kiritilishi shart'],
      min: [0, 'Narx 0 dan kichik bo\'la olmaydi'],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Asl narx kiritilishi shart'],
      min: [0, 'Asl narx 0 dan kichik bo\'la olmaydi'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique baseProduct per contragent
maxallaProductSchema.index(
  { baseProduct: 1, contragent: 1 },
  { unique: true }
);

// Indexes
maxallaProductSchema.index({ contragent: 1 });
maxallaProductSchema.index({ baseProduct: 1 });
maxallaProductSchema.index({ status: 1 });
maxallaProductSchema.index({ createdAt: -1 });

const MaxallaProduct = mongoose.model('MaxallaProduct', maxallaProductSchema);

module.exports = MaxallaProduct;
