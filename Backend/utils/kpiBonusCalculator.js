const KpiBonusDistribution = require('../models/KpiBonusDistribution');
const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const ViloyatManager = require('../models/ViloyatManager');

/**
 * Calculate and create KPI bonus transactions for an order
 * This function should be called when order status changes to certain states
 */
const calculateAndCreateKpiBonus = async (orderId, status) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items.product', 'contragent')
      .populate('confirmedByPunkt', 'viloyat tuman')
      .populate('assignedToAgent', 'viloyat tuman mfy')
      .populate('currentPunkt', 'viloyat tuman')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code');

    if (!order) {
      throw new Error('Buyurtma topilmadi');
    }

    // Get active KPI distribution
    const distribution = await KpiBonusDistribution.findOne({ isActive: true });

    if (!distribution) {
      console.warn('Active KPI distribution topilmadi');
      return;
    }

    // Only create transactions for certain statuses
    const validStatuses = [
      'confirmed_by_customer', // Final status - create all bonuses
    ];

    if (!validStatuses.includes(status)) {
      return; // Don't create transactions yet
    }

    // Check if transactions already exist for this order
    const existingTransactions = await KpiBonusTransaction.find({ order: orderId });
    if (existingTransactions.length > 0) {
      return; // Already calculated
    }

    // Get recipients based on order
    const recipients = await getRecipients(order);

    // Create transaction for each order item
    const transactions = [];

    for (const item of order.items) {
      // Calculate total KPI amount for this item
      // Formula: (price - originalPrice) * quantity * kpiBonusPercent / 100
      // Masalan: originalPrice = 5000, price = 6000, kpiBonusPercent = 50%
      // Foyda = 6000 - 5000 = 1000 so'm
      // KPI miqdori = 1000 * 50 / 100 = 500 so'm
      // Bu 500 so'm 100% sifatida olinadi va taqsimlanadi
      const profitPerUnit = item.price - item.originalPrice;
      const totalKpiAmount = (profitPerUnit * item.quantity * item.kpiBonusPercent) / 100;

      // Calculate amounts for each recipient
      // totalKpiAmount 100% sifatida olinadi va admin belgilagan foizlar asosida taqsimlanadi
      const amounts = {
        punkt: (totalKpiAmount * distribution.distribution.punkt) / 100,
        agent: (totalKpiAmount * distribution.distribution.agent) / 100,
        manager: (totalKpiAmount * distribution.distribution.manager) / 100,
        finance: (totalKpiAmount * distribution.distribution.finance) / 100,
        deliveryService: (totalKpiAmount * distribution.distribution.deliveryService) / 100,
      };

      const transaction = new KpiBonusTransaction({
        order: orderId,
        orderItem: {
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          kpiBonusPercent: item.kpiBonusPercent,
        },
        totalKpiAmount,
        distributionConfig: distribution._id,
        amounts,
        recipients: {
          punkt: recipients.punkt,
          agent: recipients.agent,
          manager: recipients.manager,
        },
        orderStatus: status,
        isPaid: false,
      });

      await transaction.save();
      transactions.push(transaction);
    }

    return transactions;
  } catch (error) {
    console.error('Error calculating KPI bonus:', error);
    throw error;
  }
};

/**
 * Get recipients for KPI bonus based on order
 */
const getRecipients = async (order) => {
  const recipients = {
    punkt: null,
    agent: null,
    manager: null,
  };

  // Get punkt
  if (order.confirmedByPunkt) {
    recipients.punkt = order.confirmedByPunkt._id;
  } else if (order.currentPunkt) {
    recipients.punkt = order.currentPunkt._id;
  }

  // Get agent (assigned agent)
  if (order.assignedToAgent) {
    recipients.agent = order.assignedToAgent._id;
  }

  // Get viloyat manager based on delivery viloyat
  if (order.deliveryViloyat) {
    const viloyatId = order.deliveryViloyat._id || order.deliveryViloyat;
    const manager = await ViloyatManager.findOne({
      viloyat: viloyatId,
      status: 'active',
    });
    if (manager) {
      recipients.manager = manager._id;
    }
  }

  return recipients;
};

module.exports = {
  calculateAndCreateKpiBonus,
  getRecipients,
};

