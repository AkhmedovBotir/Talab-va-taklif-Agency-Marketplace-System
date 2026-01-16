const mongoose = require('mongoose');

const kpiBonusDistributionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Taqsimlash nomi kiritilishi shart'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: null,
    },
    // KPI bonus taqsimlash foizlari (jami 100% bo'lishi kerak)
    // KPI miqdori (foyda * kpiBonusPercent / 100) 100% sifatida olinadi va quyidagicha taqsimlanadi
    distribution: {
      punkt: {
        type: Number,
        required: true,
        min: [0, 'Punkt foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Punkt foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      agent: {
        type: Number,
        required: true,
        min: [0, 'Agent foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Agent foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      manager: {
        type: Number,
        required: true,
        min: [0, 'Menejer foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Menejer foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      finance: {
        type: Number,
        required: true,
        min: [0, 'Moliya bo\'limi foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Moliya bo\'limi foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      deliveryService: {
        type: Number,
        required: true,
        min: [0, 'Yetkazib berish xizmati foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Yetkazib berish xizmati foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Validation: Jami foizlar 100% bo'lishi kerak
kpiBonusDistributionSchema.pre('save', function (next) {
  const total =
    this.distribution.punkt +
    this.distribution.agent +
    this.distribution.manager +
    this.distribution.finance +
    this.distribution.deliveryService;

  if (total !== 100) {
    return next(
      new Error(
        `KPI taqsimlashlar yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: ${total}%`
      )
    );
  }

  next();
});

// Indexes
kpiBonusDistributionSchema.index({ isActive: 1 });
kpiBonusDistributionSchema.index({ createdBy: 1 });
kpiBonusDistributionSchema.index({ createdAt: -1 });

const KpiBonusDistribution = mongoose.model(
  'KpiBonusDistribution',
  kpiBonusDistributionSchema
);

module.exports = KpiBonusDistribution;

