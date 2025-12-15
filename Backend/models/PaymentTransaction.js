const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Buyurtma kiritilishi shart'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Foydalanuvchi kiritilishi shart'],
    },
    amount: {
      type: Number,
      required: [true, 'To\'lov summasi kiritilishi shart'],
      min: [0, 'Summa 0 dan kichik bo\'la olmaydi'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      required: [true, 'To\'lov usuli kiritilishi shart'],
    },
    status: {
      type: String,
      enum: ['pending', 'collected', 'submitted', 'received', 'confirmed', 'rejected'],
      default: 'pending',
      required: true,
    },
    // MFY Agent
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    // Tuman Agent
    submittedToDistrict: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    submittedToDistrictAt: {
      type: Date,
      default: null,
    },
    receivedByDistrict: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    receivedByDistrictAt: {
      type: Date,
      default: null,
    },
    // Viloyat Agent
    submittedToProvince: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    submittedToProvinceAt: {
      type: Date,
      default: null,
    },
    receivedByProvince: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    receivedByProvinceAt: {
      type: Date,
      default: null,
    },
    // Moliya Bo'limi
    submittedToFinance: {
      type: Date,
      default: null,
    },
    receivedByFinance: {
      type: Boolean,
      default: false,
    },
    receivedByFinanceAt: {
      type: Date,
      default: null,
    },
    confirmedByFinance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    confirmedByFinanceAt: {
      type: Date,
      default: null,
    },
    // Hozirgi egasi
    currentHolder: {
      type: String,
      enum: ['user', 'mfy_agent', 'district_agent', 'province_agent', 'finance'],
      default: 'user',
    },
    currentHolderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Tracking uchun
    transactionPath: [
      {
        holder: {
          type: String,
          enum: ['user', 'mfy_agent', 'district_agent', 'province_agent', 'finance'],
        },
        holderId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        action: {
          type: String,
          enum: ['paid', 'collected', 'submitted', 'received', 'confirmed'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
    rejectionReason: {
      type: String,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentTransactionSchema.index({ order: 1 }, { unique: true });
paymentTransactionSchema.index({ user: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ currentHolder: 1, currentHolderId: 1 });
paymentTransactionSchema.index({ collectedBy: 1 });
paymentTransactionSchema.index({ collectedAt: 1 });
paymentTransactionSchema.index({ submittedToDistrict: 1 });
paymentTransactionSchema.index({ submittedToProvince: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

// Method to add transaction path
paymentTransactionSchema.methods.addTransactionPath = function (holder, holderId, action, note = '') {
  this.transactionPath.push({
    holder,
    holderId,
    action,
    timestamp: new Date(),
    note,
  });
};

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = PaymentTransaction;


