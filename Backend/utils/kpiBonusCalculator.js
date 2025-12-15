const KpiBonusDistribution = require('../models/KpiBonusDistribution');
const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');

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
      const profitPerUnit = item.price - item.originalPrice;
      const totalKpiAmount = (profitPerUnit * item.quantity * item.kpiBonusPercent) / 100;

      // Calculate amounts for each recipient
      const amounts = {
        punkt: (totalKpiAmount * distribution.distribution.punkt) / 100,
        viloyatAgent: (totalKpiAmount * distribution.distribution.viloyatAgent) / 100,
        tumanAgent: (totalKpiAmount * distribution.distribution.tumanAgent) / 100,
        mfyAgent: (totalKpiAmount * distribution.distribution.mfyAgent) / 100,
        finance: (totalKpiAmount * distribution.distribution.finance) / 100,
        punktTransfer: 0,
      };

      // Calculate punkt transfer amounts if applicable
      // Punkt transfer foizining yarmi fromPunkt ga, yarmi toPunkt ga
      let fromPunktAmount = 0;
      let toPunktAmount = 0;

      if (order.punktToPunktRequests && order.punktToPunktRequests.length > 0 && distribution.distribution.punktTransfer > 0) {
        const transferAmount = (totalKpiAmount * distribution.distribution.punktTransfer) / 100;
        // Yarmi fromPunkt ga, yarmi toPunkt ga
        fromPunktAmount = transferAmount / 2;
        toPunktAmount = transferAmount / 2;
        amounts.punktTransfer = transferAmount;
      }

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
          viloyatAgent: recipients.viloyatAgent,
          tumanAgent: recipients.tumanAgent,
          mfyAgent: recipients.mfyAgent,
          fromPunkt: recipients.fromPunkt,
          toPunkt: recipients.toPunkt,
          fromPunktAmount,
          toPunktAmount,
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
    viloyatAgent: null,
    tumanAgent: null,
    mfyAgent: null,
    fromPunkt: null,
    toPunkt: null,
  };

  // Get punkt
  if (order.confirmedByPunkt) {
    recipients.punkt = order.confirmedByPunkt._id;
  } else if (order.currentPunkt) {
    recipients.punkt = order.currentPunkt._id;
  }

  // Get agents
  if (order.assignedToAgent) {
    const agent = await Agent.findById(order.assignedToAgent._id);
    if (agent) {
      if (agent.mfy) {
        recipients.mfyAgent = agent._id;
        // Get tuman agent for this tuman
        const tumanAgent = await Agent.findOne({
          tuman: agent.tuman,
          mfy: null,
          status: 'active',
        });
        if (tumanAgent) {
          recipients.tumanAgent = tumanAgent._id;
        }
      } else if (agent.tuman) {
        recipients.tumanAgent = agent._id;
      }
    }

    // Get viloyat agent
    const viloyatAgent = await Agent.findOne({
      viloyat: order.deliveryViloyat._id,
      tuman: null,
      mfy: null,
      status: 'active',
    });
    if (viloyatAgent) {
      recipients.viloyatAgent = viloyatAgent._id;
    }
  }

  // Get punkt transfer recipients
  if (order.punktToPunktRequests && order.punktToPunktRequests.length > 0) {
    const acceptedRequest = order.punktToPunktRequests.find(
      (req) => req.status === 'accepted' || req.status === 'delivered'
    );
    if (acceptedRequest) {
      recipients.fromPunkt = acceptedRequest.fromPunktId._id || acceptedRequest.fromPunktId;
      recipients.toPunkt = acceptedRequest.toPunktId._id || acceptedRequest.toPunktId;
    }
  }

  return recipients;
};

module.exports = {
  calculateAndCreateKpiBonus,
  getRecipients,
};

