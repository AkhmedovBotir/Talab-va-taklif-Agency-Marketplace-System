const mongoose = require('mongoose');

const kpiBonusTransactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Buyurtma kiritilishi shart'],
    },
    orderItem: {
      // Order item ma'lumotlari (buyurtma item ID emas, chunki order item _id yo'q)
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      originalPrice: {
        type: Number,
        required: true,
      },
      kpiBonusPercent: {
        type: Number,
        required: true,
      },
    },
    // Jami KPI bonus summa ((price - originalPrice) * quantity * kpiBonusPercent / 100)
    totalKpiAmount: {
      type: Number,
      required: [true, 'Jami KPI summa kiritilishi shart'],
      min: [0, 'Jami KPI summa 0 dan kichik bo\'la olmaydi'],
    },
    // Taqsimlash konfiguratsiyasi
    distributionConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KpiBonusDistribution',
      required: true,
    },
    // Taqsimlangan summalar
    // KPI miqdori (foyda * kpiBonusPercent / 100) 100% sifatida olinadi va quyidagicha taqsimlanadi
    amounts: {
      punkt: {
        type: Number,
        default: 0,
        min: 0,
      },
      agent: {
        type: Number,
        default: 0,
        min: 0,
      },
      manager: {
        type: Number,
        default: 0,
        min: 0,
      },
      finance: {
        type: Number,
        default: 0,
        min: 0,
      },
      deliveryService: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // Kimlarga ajratilgan
    recipients: {
      punkt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Punkt',
        default: null,
      },
      agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        default: null,
      },
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ViloyatManager',
        default: null,
      },
    },
    // Buyurtma holati
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed_by_punkt',
        'requested_to_contragent',
        'accepted_by_contragent',
        'delivered_to_punkt',
        'assigned_to_agent',
        'confirmed_by_agent',
        'confirmed_by_customer',
        'cancelled',
      ],
      required: true,
    },
    // Bonus to'langanligi
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Qo'shimcha ma'lumotlar
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
kpiBonusTransactionSchema.index({ order: 1 });
kpiBonusTransactionSchema.index({ 'orderItem.product': 1 });
kpiBonusTransactionSchema.index({ 'recipients.punkt': 1 });
kpiBonusTransactionSchema.index({ 'recipients.agent': 1 });
kpiBonusTransactionSchema.index({ 'recipients.manager': 1 });
kpiBonusTransactionSchema.index({ orderStatus: 1 });
kpiBonusTransactionSchema.index({ isPaid: 1 });
kpiBonusTransactionSchema.index({ createdAt: -1 });

const KpiBonusTransaction = mongoose.model(
  'KpiBonusTransaction',
  kpiBonusTransactionSchema
);

module.exports = KpiBonusTransaction;

