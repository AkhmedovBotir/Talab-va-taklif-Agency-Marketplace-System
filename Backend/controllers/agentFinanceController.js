const PaymentTransaction = require('../models/PaymentTransaction');
const AgentDailyReport = require('../models/AgentDailyReport');
const FinanceSubmission = require('../models/FinanceSubmission');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Region = require('../models/Region');
const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');

// ==================== AGENT FUNCTIONS ====================

// Agent: Kunlik hisobot
const getDailyReport = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    // All agents are now the same - no role check needed

    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Kunlik hisobotni topish yoki yaratish
    let report = await AgentDailyReport.findOne({
      agent: agentId,
      date: reportDate,
    }).populate('transactions');

    if (!report) {
      // Bugungi to'lovlarni topish
      const startOfDay = new Date(reportDate);
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      const transactions = await PaymentTransaction.find({
        collectedBy: agentId,
        collectedAt: { $gte: startOfDay, $lte: endOfDay },
      }).populate('order', 'orderNumber totalPrice');

      const ordersCount = transactions.length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const cashAmount = transactions
        .filter((t) => t.paymentMethod === 'cash')
        .reduce((sum, t) => sum + t.amount, 0);
      const cardAmount = transactions
        .filter((t) => t.paymentMethod === 'card')
        .reduce((sum, t) => sum + t.amount, 0);

      // Topshirilgan summalarni hisoblash (moliya bo'limiga)
      const submittedTransactions = await PaymentTransaction.find({
        collectedBy: agentId,
        submittedToFinance: { $exists: true, $ne: null },
        submittedToFinance: { $gte: startOfDay, $lte: endOfDay },
      });

      const submittedAmount = submittedTransactions.reduce((sum, t) => sum + t.amount, 0);

      report = new AgentDailyReport({
        agent: agentId,
        date: reportDate,
        ordersCount,
        totalAmount,
        collectedAmount: totalAmount,
        submittedAmount,
        pendingAmount: totalAmount - submittedAmount,
        cashAmount,
        cardAmount,
        transactions: transactions.map((t) => t._id),
      });

      await report.save();
    }

    res.status(200).json({
      success: true,
      report: {
        id: report._id,
        date: report.date,
        ordersCount: report.ordersCount,
        totalAmount: report.totalAmount,
        collectedAmount: report.collectedAmount,
        submittedAmount: report.submittedAmount,
        pendingAmount: report.pendingAmount,
        cashAmount: report.cashAmount,
        cardAmount: report.cardAmount,
        isSubmitted: report.isSubmitted,
        submittedAt: report.submittedAt,
        transactions: report.transactions,
      },
    });
  } catch (error) {
    console.error('Error in getDailyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Agent: Kutilayotgan to'lovlarni ko'rish
// REMOVED: getPendingPayments - Payment collection removed
// Agents no longer collect payments from customers
const getPendingPayments = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Bu funksiya olib tashlangan. Pul yig\'ish endi amalga oshirilmaydi.',
  });
};

// REMOVED: Payment collection functions have been removed
// Agents no longer collect payments from customers or submit to admin

// Agent: To'lovni qabul qilish - REMOVED
const collectPayment = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Bu funksiya olib tashlangan. Pul yig\'ish endi amalga oshirilmaydi.',
  });
};

// Agent: Statistika
const getStatistics = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    // All agents are now the same - no role check needed

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const transactions = await PaymentTransaction.find({
      collectedBy: agentId,
      collectedAt: { $gte: start, $lte: end },
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const cashAmount = transactions
      .filter((t) => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cardAmount = transactions
      .filter((t) => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.amount, 0);

    // Topshirilgan summalarni hisoblash (moliya bo'limiga)
    const submittedTransactions = transactions.filter((t) => t.submittedToFinance && t.submittedToFinance instanceof Date);
    const submittedAmount = submittedTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      statistics: {
        period: {
          startDate: start,
          endDate: end,
        },
        totalOrders: transactions.length,
        totalAmount,
        collectedAmount: totalAmount,
        submittedAmount,
        pendingAmount: totalAmount - submittedAmount,
        cashAmount,
        cardAmount,
      },
    });
  } catch (error) {
    console.error('Error in getStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// REMOVED: submitToFinance - Payment collection removed
// Agents no longer submit payments to admin

// Agent: Moliya bo'limiga topshirish - REMOVED
const submitToFinance = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Bu funksiya olib tashlangan. Pul yig\'ish endi amalga oshirilmaydi.',
  });
};

module.exports = {
  // Agent functions
  getDailyReport,
  // getPendingPayments - REMOVED: Payment collection removed
  // collectPayment - REMOVED: Payment collection removed
  // submitToFinance - REMOVED: Payment collection removed
  getStatistics,
};

