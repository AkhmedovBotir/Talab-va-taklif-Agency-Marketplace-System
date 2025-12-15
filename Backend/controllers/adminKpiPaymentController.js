const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const KpiPaymentDistribution = require('../models/KpiPaymentDistribution');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// ==================== TO'LANMAGAN TO'LOVLAR RO'YXATI ====================

// Barcha to'lanmagan KPI to'lovlarini olish (agentlar va punktlar bo'yicha guruhlangan)
const getUnpaidPayments = async (req, res) => {
  try {
    const { recipientType, agentType, viloyatId, tumanId, mfyId, page = 1, limit = 50 } = req.query;

    const filter = {
      status: 'pending',
    };

    if (recipientType) {
      filter.recipientType = recipientType;
    }

    if (agentType) {
      filter.agentType = agentType;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get unpaid payments
    let payments = await KpiPaymentDistribution.find(filter)
      .populate({
        path: 'recipient',
        select: 'name phone viloyat tuman',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
        ],
      })
      .populate('kpiTransactions', 'order orderItem totalKpiAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate mfy separately for agents only
    for (const payment of payments) {
      if (payment.recipientType === 'agent' && payment.recipient) {
        await payment.populate({
          path: 'recipient',
          select: 'name phone viloyat tuman mfy',
          populate: [
            {
              path: 'viloyat',
              select: 'name type code',
            },
            {
              path: 'tuman',
              select: 'name type code',
            },
            {
              path: 'mfy',
              select: 'name type code',
            },
          ],
        });
      }
    }

    // Filter by region if needed
    if (viloyatId || tumanId || mfyId) {
      payments = payments.filter((payment) => {
        const recipient = payment.recipient;
        if (!recipient) return false;

        if (mfyId && recipient.mfy) {
          return recipient.mfy._id.toString() === mfyId.toString();
        }
        if (tumanId && recipient.tuman) {
          return recipient.tuman._id.toString() === tumanId.toString();
        }
        if (viloyatId && recipient.viloyat) {
          return recipient.viloyat._id.toString() === viloyatId.toString();
        }
        return false;
      });
    }

    // Get total count
    const total = await KpiPaymentDistribution.countDocuments(filter);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalUnpaidAmount = await KpiPaymentDistribution.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalAmount,
      totalUnpaidAmount: totalUnpaidAmount[0]?.total || 0,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getUnpaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// To'lanmagan to'lovlarni guruhlab olish (agentlar va punktlar bo'yicha)
const getUnpaidPaymentsGrouped = async (req, res) => {
  try {
    const { recipientType, agentType } = req.query;

    const matchFilter = {
      status: 'pending',
    };

    if (recipientType) {
      matchFilter.recipientType = recipientType;
    }

    if (agentType) {
      matchFilter.agentType = agentType;
    }

    // Group by recipient
    const grouped = await KpiPaymentDistribution.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            recipient: '$recipient',
            recipientType: '$recipientType',
            agentType: '$agentType',
          },
          totalAmount: { $sum: '$amount' },
          paymentsCount: { $sum: 1 },
          kpiTransactions: { $push: '$kpiTransactions' },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Populate recipient details
    const populated = await Promise.all(
      grouped.map(async (group) => {
        const recipientId = group._id.recipient;
        let recipient = null;

        if (group._id.recipientType === 'agent') {
          recipient = await Agent.findById(recipientId)
            .populate('viloyat', 'name type code')
            .populate('tuman', 'name type code')
            .populate('mfy', 'name type code')
            .select('name phone viloyat tuman mfy agentType');
        } else if (group._id.recipientType === 'punkt') {
          recipient = await Punkt.findById(recipientId)
            .populate('viloyat', 'name type code')
            .populate('tuman', 'name type code')
            .select('name phone viloyat tuman');
        }

        return {
          recipient,
          recipientType: group._id.recipientType,
          agentType: group._id.agentType,
          totalAmount: group.totalAmount,
          paymentsCount: group.paymentsCount,
        };
      })
    );

    // Calculate totals
    const totalAmount = populated.reduce((sum, p) => sum + p.totalAmount, 0);

    res.status(200).json({
      success: true,
      count: populated.length,
      totalAmount,
      data: populated,
    });
  } catch (error) {
    console.error('Error in getUnpaidPaymentsGrouped:', error);
    res.status(500).json({
      success: false,
      message: 'Guruhlangan to\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LOVNI TASDIQLASH ====================

// Bir yoki bir nechta to'lovlarni "to'landi" deb belgilash
const markPaymentsAsPaid = async (req, res) => {
  try {
    const { paymentIds, notes } = req.body;
    const admin = req.user.admin;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'To\'lov ID lari kiritilishi shart',
      });
    }

    // Check if all payments exist and are pending
    const payments = await KpiPaymentDistribution.find({
      _id: { $in: paymentIds },
      status: 'pending',
    });

    if (payments.length !== paymentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi to\'lovlar topilmadi yoki allaqachon to\'langan',
      });
    }

    // Update payments
    const now = new Date();
    await KpiPaymentDistribution.updateMany(
      { _id: { $in: paymentIds } },
      {
        $set: {
          status: 'paid',
          paidAt: now,
          paidBy: admin._id,
          notes: notes || null,
        },
      }
    );

    // Update related KPI transactions
    const allKpiTransactionIds = [];
    payments.forEach((payment) => {
      if (payment.kpiTransactions && payment.kpiTransactions.length > 0) {
        allKpiTransactionIds.push(...payment.kpiTransactions);
      }
    });

    if (allKpiTransactionIds.length > 0) {
      // Update isPaid for related transactions
      await KpiBonusTransaction.updateMany(
        { _id: { $in: allKpiTransactionIds } },
        {
          $set: {
            isPaid: true,
            paidAt: now,
          },
        }
      );
    }

    // Get updated payments with full details
    const updatedPayments = await KpiPaymentDistribution.find({
      _id: { $in: paymentIds },
    })
      .populate({
        path: 'recipient',
        select: 'name phone viloyat tuman',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
        ],
      })
      .populate('paidBy', 'name phone');

    // Populate mfy for agents
    for (const payment of updatedPayments) {
      if (payment.recipientType === 'agent' && payment.recipient) {
        await payment.populate({
          path: 'recipient.mfy',
          select: 'name type code',
        });
      }
    }

    // Send notifications to recipients
    let io = null;
    try {
      io = getIO();
    } catch (error) {
      console.warn('Socket.io not initialized, notifications will be saved but not sent via socket');
    }

    const notifications = [];

    for (const payment of updatedPayments) {
      if (!payment.recipient) continue;

      // Determine targetType based on recipientType and agentType
      let targetType = null;
      if (payment.recipientType === 'agent') {
        if (payment.agentType === 'viloyat') {
          targetType = 'viloyat_agents';
        } else if (payment.agentType === 'tuman') {
          targetType = 'tuman_agents';
        } else if (payment.agentType === 'mfy') {
          targetType = 'mfy_agents';
        }
      } else if (payment.recipientType === 'punkt') {
        targetType = 'punkts';
      }

      if (!targetType) continue;

      // Format amount
      const formattedAmount = payment.amount.toLocaleString('uz-UZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      // Get recipient name
      const recipientName = payment.recipient.name || 'Noma\'lum';

      // Format date
      const formattedDate = now.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create notification
      try {
        const notification = await Notification.create({
          title: 'KPI To\'lovi To\'landi',
          message: `Hurmatli ${recipientName}, sizga ${formattedAmount} so'm miqdorida KPI to'lovi to'landi. To'lov sanasi: ${formattedDate}.`,
          type: 'success',
          targetType,
          targetIds: [payment.recipient._id],
          targetRefModel: payment.recipientType === 'agent' ? 'Agent' : 'Punkt',
          sentBy: admin._id,
        });

        notifications.push(notification);

        // Emit socket event
        if (io) {
          const eventData = {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            targetType: notification.targetType,
            createdAt: notification.createdAt,
          };

          // Emit to specific room
          io.to(targetType).emit('notification:new', eventData);

          // Emit to specific user
          const userRoom = payment.recipientType === 'agent' 
            ? `agent:${payment.recipient._id}` 
            : `punkt:${payment.recipient._id}`;
          io.to(userRoom).emit('notification:new', eventData);
        }
      } catch (notifError) {
        console.error(`Error creating notification for payment ${payment._id}:`, notifError);
        // Continue with other payments even if one notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: `${payments.length} ta to'lov muvaffaqiyatli to'landi deb belgilandi`,
      count: updatedPayments.length,
      notificationsSent: notifications.length,
      data: updatedPayments,
    });
  } catch (error) {
    console.error('Error in markPaymentsAsPaid:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovlarni belgilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LOVLAR STATISTIKASI ====================

// To'lovlar statistikasini olish
const getPaymentStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paidAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.paidAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.paidAt.$lte = end;
      }
    }

    // Total unpaid
    const unpaidStats = await KpiPaymentDistribution.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total paid
    const paidFilter = { status: 'paid', ...dateFilter };
    const paidStats = await KpiPaymentDistribution.aggregate([
      { $match: paidFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // By recipient type
    const byRecipientType = await KpiPaymentDistribution.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$recipientType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // By agent type
    const byAgentType = await KpiPaymentDistribution.aggregate([
      { $match: { status: 'pending', recipientType: 'agent' } },
      {
        $group: {
          _id: '$agentType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.paidAt?.$gte || null,
          endDate: dateFilter.paidAt?.$lte || null,
        },
        unpaid: {
          totalAmount: unpaidStats[0]?.totalAmount || 0,
          count: unpaidStats[0]?.count || 0,
        },
        paid: {
          totalAmount: paidStats[0]?.totalAmount || 0,
          count: paidStats[0]?.count || 0,
        },
        byRecipientType: byRecipientType.reduce((acc, item) => {
          acc[item._id] = {
            totalAmount: item.totalAmount,
            count: item.count,
          };
          return acc;
        }, {}),
        byAgentType: byAgentType.reduce((acc, item) => {
          acc[item._id] = {
            totalAmount: item.totalAmount,
            count: item.count,
          };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error in getPaymentStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovlar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LANGAN TO'LOVLAR ====================

// To'langan to'lovlarni olish
const getPaidPayments = async (req, res) => {
  try {
    const { recipientType, agentType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {
      status: 'paid',
    };

    if (recipientType) {
      filter.recipientType = recipientType;
    }

    if (agentType) {
      filter.agentType = agentType;
    }

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.paidAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paidAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let payments = await KpiPaymentDistribution.find(filter)
      .populate({
        path: 'recipient',
        select: 'name phone viloyat tuman',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
        ],
      })
      .populate('paidBy', 'name phone')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate mfy separately for agents only
    for (const payment of payments) {
      if (payment.recipientType === 'agent' && payment.recipient) {
        await payment.populate({
          path: 'recipient',
          select: 'name phone viloyat tuman mfy',
          populate: [
            {
              path: 'viloyat',
              select: 'name type code',
            },
            {
              path: 'tuman',
              select: 'name type code',
            },
            {
              path: 'mfy',
              select: 'name type code',
            },
          ],
        });
      }
    }

    const total = await KpiPaymentDistribution.countDocuments(filter);

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalAmount,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getPaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'langan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== KPI TO'LOVLARINI YARATISH (SYNC) ====================

// KPI transaksiyalardan to'lovlarni yaratish/yangilash
const syncKpiPayments = async (req, res) => {
  try {
    // Get all unpaid KPI transactions
    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      isPaid: false,
    })
      .populate('recipients.punkt')
      .populate('recipients.viloyatAgent')
      .populate('recipients.tumanAgent')
      .populate('recipients.mfyAgent')
      .populate('recipients.fromPunkt')
      .populate('recipients.toPunkt');

    const createdPayments = [];
    const updatedPayments = [];

    // Process each transaction
    for (const transaction of kpiTransactions) {
      // Process punkt
      if (transaction.recipients.punkt && transaction.amounts.punkt > 0) {
        await processPayment(
          'punkt',
          transaction.recipients.punkt._id,
          transaction.amounts.punkt,
          transaction._id,
          createdPayments,
          updatedPayments
        );
      }

      // Process viloyat agent
      if (transaction.recipients.viloyatAgent && transaction.amounts.viloyatAgent > 0) {
        await processPayment(
          'agent',
          transaction.recipients.viloyatAgent._id,
          transaction.amounts.viloyatAgent,
          transaction._id,
          createdPayments,
          updatedPayments,
          'viloyat'
        );
      }

      // Process tuman agent
      if (transaction.recipients.tumanAgent && transaction.amounts.tumanAgent > 0) {
        await processPayment(
          'agent',
          transaction.recipients.tumanAgent._id,
          transaction.amounts.tumanAgent,
          transaction._id,
          createdPayments,
          updatedPayments,
          'tuman'
        );
      }

      // Process MFY agent
      if (transaction.recipients.mfyAgent && transaction.amounts.mfyAgent > 0) {
        await processPayment(
          'agent',
          transaction.recipients.mfyAgent._id,
          transaction.amounts.mfyAgent,
          transaction._id,
          createdPayments,
          updatedPayments,
          'mfy'
        );
      }

      // Process fromPunkt (transfer)
      if (transaction.recipients.fromPunkt && transaction.recipients.fromPunktAmount > 0) {
        await processPayment(
          'punkt',
          transaction.recipients.fromPunkt._id,
          transaction.recipients.fromPunktAmount,
          transaction._id,
          createdPayments,
          updatedPayments
        );
      }

      // Process toPunkt (transfer)
      if (transaction.recipients.toPunkt && transaction.recipients.toPunktAmount > 0) {
        await processPayment(
          'punkt',
          transaction.recipients.toPunkt._id,
          transaction.recipients.toPunktAmount,
          transaction._id,
          createdPayments,
          updatedPayments
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'KPI to\'lovlari muvaffaqiyatli sinxronlashtirildi',
      created: createdPayments.length,
      updated: updatedPayments.length,
      data: {
        created: createdPayments,
        updated: updatedPayments,
      },
    });
  } catch (error) {
    console.error('Error in syncKpiPayments:', error);
    res.status(500).json({
      success: false,
      message: 'KPI to\'lovlarini sinxronlashtirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Helper function to process payment
async function processPayment(
  recipientType,
  recipientId,
  amount,
  kpiTransactionId,
  createdPayments,
  updatedPayments,
  agentType = null
) {
  // Check if payment already exists for this recipient (pending status)
  const existingPayment = await KpiPaymentDistribution.findOne({
    recipientType,
    recipient: recipientId,
    status: 'pending',
    ...(agentType && { agentType }),
  });

  if (existingPayment) {
    // Add transaction if not already in the array
    if (!existingPayment.kpiTransactions.includes(kpiTransactionId)) {
      existingPayment.kpiTransactions.push(kpiTransactionId);
    }
    // Update amount (add to existing)
    existingPayment.amount += amount;
    await existingPayment.save();
    if (!updatedPayments.includes(existingPayment._id.toString())) {
      updatedPayments.push(existingPayment._id);
    }
  } else {
    // Create new payment
    const newPayment = new KpiPaymentDistribution({
      recipientType,
      recipient: recipientId,
      recipientModel: recipientType === 'agent' ? 'Agent' : 'Punkt',
      agentType,
      amount,
      status: 'pending',
      kpiTransactions: [kpiTransactionId],
    });

    await newPayment.save();
    createdPayments.push(newPayment._id);
  }
}

module.exports = {
  getUnpaidPayments,
  getUnpaidPaymentsGrouped,
  markPaymentsAsPaid,
  getPaymentStatistics,
  getPaidPayments,
  syncKpiPayments,
};

