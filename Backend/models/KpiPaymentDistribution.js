const mongoose = require('mongoose');

const kpiPaymentDistributionSchema = new mongoose.Schema(
  {
    // Kimga to'lov (agent yoki punkt)
    recipientType: {
      type: String,
      enum: ['agent', 'punkt'],
      required: [true, 'Qabul qiluvchi turi kiritilishi shart'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Qabul qiluvchi kiritilishi shart'],
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Agent', 'Punkt'],
    },
    // Agent bo'lsa, uning turi
    agentType: {
      type: String,
      enum: ['viloyat', 'tuman', 'mfy'],
      default: null,
    },
    // To'lov summasi
    amount: {
      type: Number,
      required: [true, 'To\'lov summasi kiritilishi shart'],
      min: [0, 'Summa 0 dan kichik bo\'la olmaydi'],
    },
    // To'lov holati
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
      required: true,
    },
    // To'landi deb belgilangan vaqt
    paidAt: {
      type: Date,
      default: null,
    },
    // To'lovni tasdiqlagan admin
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    // Qo'shimcha ma'lumotlar
    notes: {
      type: String,
      default: null,
    },
    // Qaysi KPI transaksiyalardan yig'ilgan
    kpiTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KpiBonusTransaction',
      },
    ],
    // To'lov muddati (opsional)
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
kpiPaymentDistributionSchema.index({ recipientType: 1, recipient: 1 });
kpiPaymentDistributionSchema.index({ status: 1 });
kpiPaymentDistributionSchema.index({ agentType: 1 });
kpiPaymentDistributionSchema.index({ createdAt: -1 });
kpiPaymentDistributionSchema.index({ paidAt: -1 });

// Compound index for efficient queries
kpiPaymentDistributionSchema.index({ recipientType: 1, status: 1 });
kpiPaymentDistributionSchema.index({ recipientType: 1, recipient: 1, status: 1 });

const KpiPaymentDistribution = mongoose.model(
  'KpiPaymentDistribution',
  kpiPaymentDistributionSchema
);

module.exports = KpiPaymentDistribution;


