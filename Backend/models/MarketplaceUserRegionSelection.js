const mongoose = require('mongoose');

const marketplaceUserRegionSelectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Foydalanuvchi kiritilishi shart'],
    },
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
marketplaceUserRegionSelectionSchema.index({ user: 1 }, { unique: true });
marketplaceUserRegionSelectionSchema.index({ viloyat: 1 });
marketplaceUserRegionSelectionSchema.index({ tuman: 1 });

const MarketplaceUserRegionSelection = mongoose.model(
  'MarketplaceUserRegionSelection',
  marketplaceUserRegionSelectionSchema
);

module.exports = MarketplaceUserRegionSelection;


