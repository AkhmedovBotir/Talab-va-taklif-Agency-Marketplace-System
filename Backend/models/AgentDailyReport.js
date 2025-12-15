const mongoose = require('mongoose');

const agentDailyReportSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent kiritilishi shart'],
    },
    date: {
      type: Date,
      required: [true, 'Sana kiritilishi shart'],
    },
    agentType: {
      type: String,
      enum: ['mfy', 'tuman', 'viloyat'],
      required: [true, 'Agent turi kiritilishi shart'],
    },
    // Buyurtmalar
    ordersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // To'lovlar
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    collectedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    submittedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Transaksiyalar
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentTransaction',
      },
    ],
    // Cash va Card ajratish
    cashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Status
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    // Qo'shimcha ma'lumotlar
    notes: {
      type: String,
      default: '',
      maxlength: [1000, 'Eslatma 1000 ta belgidan oshmasligi kerak'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
agentDailyReportSchema.index({ agent: 1, date: 1 }, { unique: true });
agentDailyReportSchema.index({ date: -1 });
agentDailyReportSchema.index({ agentType: 1 });
agentDailyReportSchema.index({ isSubmitted: 1 });

const AgentDailyReport = mongoose.model('AgentDailyReport', agentDailyReportSchema);

module.exports = AgentDailyReport;


