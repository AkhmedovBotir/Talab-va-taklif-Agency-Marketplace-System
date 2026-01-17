const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema(
  {
    // Transaction type
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Tranzaksiya turi kiritilishi shart'],
    },
    // Transaction category
    category: {
      type: String,
      enum: [
        // Admin transactions
        'admin_to_punkt', // Admin punktga pul yuboradi
        // Punkt transactions
        'punkt_received_from_admin', // Punkt admin'dan pul oladi
        'punkt_to_contragent_zaklad', // Punkt kontragentga zaklad beradi
        'punkt_to_contragent_final_payment', // Punkt kontragentga qolgan asl narx to'laydi
        'punkt_to_contragent_profit', // Punkt kontragentga sof foyda to'laydi
        'punkt_received_from_agent', // Punkt agentdan pul oladi
        // Agent transactions
        'agent_paid_to_punkt', // Agent punktga pul to'laydi
        'agent_received_from_customer', // Agent mijozdan pul oladi
        // Contragent transactions
        'contragent_received_zaklad', // Kontragent zaklad oladi
        'contragent_received_final_payment', // Kontragent qolgan asl narx oladi
        'contragent_received_profit', // Kontragent sof foyda oladi
        'contragent_received_full_payment', // Kontragent to'liq to'lov oladi (punktdan) - deprecated
      ],
      required: [true, 'Tranzaksiya kategoriyasi kiritilishi shart'],
    },
    // Amount
    amount: {
      type: Number,
      required: [true, 'Summa kiritilishi shart'],
      min: [0, 'Summa 0 dan kichik bo\'la olmaydi'],
    },
    // Related order (if transaction is related to an order)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    // Related contragent request (if transaction is for zaklad)
    contragentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Reference to order.contragentRequests[]._id
    },
    // User who initiated the transaction
    fromUser: {
      userType: {
        type: String,
        enum: ['Admin', 'Punkt', 'Agent', 'Contragent', 'MarketplaceUser'],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
    // User who receives the transaction
    toUser: {
      userType: {
        type: String,
        enum: ['Admin', 'Punkt', 'Agent', 'Contragent', 'MarketplaceUser'],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
    // Description
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Tavsif 1000 ta belgidan oshmasligi kerak'],
      default: '',
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      required: true,
    },
    // Additional data for zaklad (percentage)
    zakladPercentage: {
      type: Number,
      min: [0, 'Foiz 0 dan kichik bo\'la olmaydi'],
      max: [100, 'Foiz 100 dan katta bo\'la olmaydi'],
      default: null,
    },
    // Timestamps
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
financeTransactionSchema.index({ type: 1 });
financeTransactionSchema.index({ category: 1 });
financeTransactionSchema.index({ order: 1 });
financeTransactionSchema.index({ status: 1 });
financeTransactionSchema.index({ 'fromUser.userType': 1, 'fromUser.userId': 1 });
financeTransactionSchema.index({ 'toUser.userType': 1, 'toUser.userId': 1 });
financeTransactionSchema.index({ createdAt: -1 });
financeTransactionSchema.index({ category: 1, status: 1 });

const FinanceTransaction = mongoose.model('FinanceTransaction', financeTransactionSchema);

module.exports = FinanceTransaction;
