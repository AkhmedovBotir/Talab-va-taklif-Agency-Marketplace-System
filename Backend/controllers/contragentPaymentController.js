const FinanceTransaction = require('../models/FinanceTransaction');
const Order = require('../models/Order');
const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');

// Kontragent o'zining kirim/chiqimlarini olish
const getContragentTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const { userId } = req.user; // Contragent ID

    const filter = {
      $or: [
        { 'fromUser.userType': 'Contragent', 'fromUser.userId': userId },
        { 'toUser.userType': 'Contragent', 'toUser.userId': userId },
      ],
    };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await FinanceTransaction.countDocuments(filter);

    const transactions = await FinanceTransaction.find(filter)
      .populate('order', 'orderNumber totalPrice')
      .populate('fromUser.userId', 'name inn phone')
      .populate('toUser.userId', 'name phone')
      .populate('contragentRequest')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate totals
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          ...filter,
          type: 'income',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          ...filter,
          type: 'expense',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalIncome: incomeTotal[0]?.total || 0,
        totalExpense: expenseTotal[0]?.total || 0,
        balance: (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0),
        qarz: ((incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0)) < 0 
          ? Math.abs((incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0)) 
          : 0,
        haq: ((incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0)) > 0 
          ? (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0) 
          : 0,
      },
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching contragent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Tranzaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Kontragent balansini olish
const getContragentBalance = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID

    // Income: transactions where contragent is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Contragent',
          'toUser.userId': userId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Expense: transactions where contragent is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Contragent',
          'fromUser.userId': userId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalIncome = incomeTotal[0]?.total || 0;
    const totalExpense = expenseTotal[0]?.total || 0;
    const balance = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        // Qarz va haq
        qarz: balance < 0 ? Math.abs(balance) : 0, // Agar balans manfiy bo'lsa, qarz
        haq: balance > 0 ? balance : 0, // Agar balans musbat bo'lsa, haq
      },
    });
  } catch (error) {
    console.error('Error fetching contragent balance:', error);
    res.status(500).json({
      success: false,
      message: 'Balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Kontragent zaklad ma'lumotlarini olish (qarz/haq)
const getContragentZakladInfo = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID
    const { orderId, contragentRequestId } = req.query;

    const filter = {
      'toUser.userType': 'Contragent',
      'toUser.userId': userId,
      category: 'contragent_received_zaklad',
      status: 'completed',
    };

    if (orderId) filter.order = orderId;
    if (contragentRequestId) filter.contragentRequest = contragentRequestId;

    // Get zaklad transactions
    const zakladTransactions = await FinanceTransaction.find(filter)
      .populate('order', 'orderNumber totalPrice totalOriginalPrice')
      .populate('fromUser.userId', 'name phone viloyat tuman')
      .populate('contragentRequest')
      .sort({ createdAt: -1 });

    // Calculate totals
    const zakladTotal = zakladTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get pending zaklads (orders delivered but zaklad not paid yet)
    const pendingZaklads = [];
    
    // Find all orders where this contragent has delivered but zaklad not paid
    const orderFilter = {
      'contragentRequests.contragentId': userId,
      'contragentRequests.status': 'delivered_to_punkt',
      status: 'delivered_to_punkt',
    };
    
    if (orderId) {
      orderFilter._id = orderId;
    }
    
    const orders = await Order.find(orderFilter)
      .populate('contragentRequests.contragentId', 'name inn phone')
      .sort({ createdAt: -1 });
    
    for (const order of orders) {
      for (const contragentRequest of order.contragentRequests) {
        if (
          contragentRequest.contragentId.toString() === userId.toString() &&
          contragentRequest.status === 'delivered_to_punkt'
        ) {
          // Check if zaklad already paid
          const zakladPaid = await FinanceTransaction.findOne({
            order: order._id,
            contragentRequest: contragentRequest._id,
            category: 'contragent_received_zaklad',
            status: 'completed',
          });

          if (!zakladPaid) {
            // Calculate potential zaklad amount
            let potentialZaklad = 0;
            const requestItemIds = contragentRequest.itemIds || [];
            requestItemIds.forEach((itemIndex) => {
              if (order.items[itemIndex]) {
                const item = order.items[itemIndex];
                const itemTotal = item.price * item.quantity;
                // Assume 40% as default (punkt can set this)
                potentialZaklad += (itemTotal * 40) / 100;
              }
            });

            pendingZaklads.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              contragentRequestId: contragentRequest._id,
              potentialZakladAmount: potentialZaklad,
              deliveredAt: contragentRequest.deliveredToPunktAt,
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        zakladTransactions,
        zakladTotal,
        pendingZaklads,
        summary: {
          totalZakladReceived: zakladTotal,
          pendingZakladCount: pendingZaklads.length,
          pendingZakladTotal: pendingZaklads.reduce((sum, p) => sum + p.potentialZakladAmount, 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contragent zaklad info:', error);
    res.status(500).json({
      success: false,
      message: 'Zaklad ma\'lumotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== OLD KPI PAYMENT FUNCTIONS ====================

// Get my paid payments (to'langan to'lovlar)
const getMyPaidPayments = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const filter = {
      contragent: userId,
      status: 'paid',
    };

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await ContragentPaymentDistribution.countDocuments(filter);

    const payments = await ContragentPaymentDistribution.find(filter)
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .populate('paidBy', 'name phone')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching paid payments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'langan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get my unpaid payments (to'lanmagan to'lovlar)
const getMyUnpaidPayments = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID
    const { page = 1, limit = 50 } = req.query;

    const filter = {
      contragent: userId,
      status: 'pending',
    };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await ContragentPaymentDistribution.countDocuments(filter);

    const payments = await ContragentPaymentDistribution.find(filter)
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Update isOverdue
    const now = new Date();
    for (const payment of payments) {
      if (payment.dueDate && now > payment.dueDate) {
        payment.isOverdue = true;
        await payment.save();
      }
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching unpaid payments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get my payment statistics
const getMyPaymentStatistics = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID

    const paidTotal = await ContragentPaymentDistribution.aggregate([
      {
        $match: {
          contragent: userId,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const unpaidTotal = await ContragentPaymentDistribution.aggregate([
      {
        $match: {
          contragent: userId,
          status: 'pending',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        paid: {
          total: paidTotal[0]?.total || 0,
          count: paidTotal[0]?.count || 0,
        },
        unpaid: {
          total: unpaidTotal[0]?.total || 0,
          count: unpaidTotal[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lov statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get payment by ID
const getMyPaymentById = async (req, res) => {
  try {
    const { userId } = req.user; // Contragent ID
    const { id } = req.params;

    const payment = await ContragentPaymentDistribution.findOne({
      _id: id,
      contragent: userId,
    })
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .populate('paidBy', 'name phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'To\'lov topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyPaidPayments,
  getMyUnpaidPayments,
  getMyPaymentStatistics,
  getMyPaymentById,
  getContragentTransactions,
  getContragentBalance,
  getContragentZakladInfo,
};
