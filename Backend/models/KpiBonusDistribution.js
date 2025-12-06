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
    distribution: {
      punkt: {
        type: Number,
        required: true,
        min: [0, 'Punkt foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Punkt foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      viloyatAgent: {
        type: Number,
        required: true,
        min: [0, 'Viloyat agent foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Viloyat agent foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      tumanAgent: {
        type: Number,
        required: true,
        min: [0, 'Tuman agent foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Tuman agent foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      mfyAgent: {
        type: Number,
        required: true,
        min: [0, 'MFY agent foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'MFY agent foizi 100 dan katta bo\'la olmaydi'],
        default: 0,
      },
      // Punktlar orasida almashishda qo'shimcha foiz
      // Bu foizning yarmi fromPunkt ga, yarmi toPunkt ga ajratiladi
      punktTransfer: {
        type: Number,
        required: false,
        min: [0, 'Punkt transfer foizi 0 dan kichik bo\'la olmaydi'],
        max: [100, 'Punkt transfer foizi 100 dan katta bo\'la olmaydi'],
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
    this.distribution.viloyatAgent +
    this.distribution.tumanAgent +
    this.distribution.mfyAgent;

  if (total !== 100) {
    return next(
      new Error(
        `Asosiy taqsimlashlar yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: ${total}%`
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

