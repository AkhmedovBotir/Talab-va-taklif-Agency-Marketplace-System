const mongoose = require('mongoose');

const financeSubmissionSchema = new mongoose.Schema(
  {
    fromAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Kimdan kiritilishi shart'],
    },
    fromAgentType: {
      type: String,
      enum: ['mfy', 'tuman', 'viloyat'],
      required: [true, 'Agent turi kiritilishi shart'],
    },
    toAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null, // null bo'lsa, moliya bo'limiga
    },
    toAgentType: {
      type: String,
      enum: ['tuman', 'viloyat', 'finance'],
      required: [true, 'Qabul qiluvchi turi kiritilishi shart'],
    },
    amount: {
      type: Number,
      required: [true, 'Summa kiritilishi shart'],
      min: [0, 'Summa 0 dan kichik bo\'la olmaydi'],
    },
    submissionDate: {
      type: Date,
      required: [true, 'Topshiruv sanasi kiritilishi shart'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
      required: true,
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentTransaction',
        required: true,
      },
    ],
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'confirmedByModel',
      default: null,
    },
    confirmedByModel: {
      type: String,
      enum: ['Agent', 'Admin'],
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'rejectedByModel',
      default: null,
    },
    rejectedByModel: {
      type: String,
      enum: ['Agent', 'Admin'],
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: [500, 'Rad etish sababi 500 ta belgidan oshmasligi kerak'],
    },
    // Qo'shimcha ma'lumotlar
    notes: {
      type: String,
      default: '',
      maxlength: [1000, 'Eslatma 1000 ta belgidan oshmasligi kerak'],
    },
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
    transactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
financeSubmissionSchema.index({ fromAgent: 1, submissionDate: -1 });
financeSubmissionSchema.index({ toAgent: 1, status: 1 });
financeSubmissionSchema.index({ status: 1 });
financeSubmissionSchema.index({ submissionDate: -1 });
financeSubmissionSchema.index({ fromAgentType: 1, toAgentType: 1 });

const FinanceSubmission = mongoose.model('FinanceSubmission', financeSubmissionSchema);

module.exports = FinanceSubmission;

