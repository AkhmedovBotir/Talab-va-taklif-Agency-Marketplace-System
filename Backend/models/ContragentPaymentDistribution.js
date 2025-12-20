const mongoose = require('mongoose');

const contragentPaymentDistributionSchema = new mongoose.Schema(
  {
    // Kimga to'lov (contragent)
    contragent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contragent',
      required: [true, 'Contragent kiritilishi shart'],
    },
    // To'lov summasi (totalPrice - totalKpiPrice)
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
    // Qaysi buyurtmalardan yig'ilgan
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    // To'lov muddati (belgilangan muddat)
    dueDate: {
      type: Date,
      required: [true, 'To\'lov muddati kiritilishi shart'],
    },
    // To'lov muddati o'tganmi (dueDate o'tgan va hali to'lanmagan)
    isOverdue: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contragentPaymentDistributionSchema.index({ contragent: 1 });
contragentPaymentDistributionSchema.index({ status: 1 });
contragentPaymentDistributionSchema.index({ createdAt: -1 });
contragentPaymentDistributionSchema.index({ paidAt: -1 });
contragentPaymentDistributionSchema.index({ dueDate: 1 });
contragentPaymentDistributionSchema.index({ isOverdue: 1 });

// Compound index for efficient queries
contragentPaymentDistributionSchema.index({ contragent: 1, status: 1 });
contragentPaymentDistributionSchema.index({ status: 1, dueDate: 1 });
contragentPaymentDistributionSchema.index({ status: 1, isOverdue: 1 });

// Middleware to update isOverdue before save
contragentPaymentDistributionSchema.pre('save', function (next) {
  if (this.status === 'pending' && this.dueDate) {
    const now = new Date();
    this.isOverdue = now > this.dueDate;
  } else {
    this.isOverdue = false;
  }
  next();
});

const ContragentPaymentDistribution = mongoose.model(
  'ContragentPaymentDistribution',
  contragentPaymentDistributionSchema
);

module.exports = ContragentPaymentDistribution;



