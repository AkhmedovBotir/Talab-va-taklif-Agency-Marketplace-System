const mongoose = require('mongoose');

const financeReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      required: [true, 'Hisobot turi kiritilishi shart'],
    },
    startDate: {
      type: Date,
      required: [true, 'Boshlanish sanasi kiritilishi shart'],
    },
    endDate: {
      type: Date,
      required: [true, 'Tugash sanasi kiritilishi shart'],
    },
    // Umumiy ma'lumotlar
    totalReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Viloyat bo'yicha
    byRegion: [
      {
        region: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        regionName: String,
        totalAmount: {
          type: Number,
          default: 0,
        },
        ordersCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Tuman bo'yicha
    byDistrict: [
      {
        district: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        districtName: String,
        region: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        regionName: String,
        totalAmount: {
          type: Number,
          default: 0,
        },
        ordersCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // MFY bo'yicha
    byMfy: [
      {
        mfy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        mfyName: String,
        district: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        districtName: String,
        region: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Region',
        },
        regionName: String,
        totalAmount: {
          type: Number,
          default: 0,
        },
        ordersCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // To'lov usullari bo'yicha
    byPaymentMethod: {
      cash: {
        type: Number,
        default: 0,
      },
      card: {
        type: Number,
        default: 0,
      },
    },
    // Agentlar bo'yicha
    byAgent: [
      {
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Agent',
        },
        agentName: String,
        totalAmount: {
          type: Number,
          default: 0,
        },
        ordersCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Tafsilotlar
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Yaratilgan vaqt
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
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
financeReportSchema.index({ reportType: 1, startDate: -1, endDate: -1 });
financeReportSchema.index({ generatedAt: -1 });

const FinanceReport = mongoose.model('FinanceReport', financeReportSchema);

module.exports = FinanceReport;


