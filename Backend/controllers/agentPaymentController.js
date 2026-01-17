const FinanceTransaction = require('../models/FinanceTransaction');
const Order = require('../models/Order');
const Punkt = require('../models/Punkt');

// Agent punktga to'liq summa to'lash (assigned_to_agent dan keyin, buyurtmani qabul qilganda)
const payOrderToPunkt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { agent } = req.user;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order is assigned to this agent
    if (!order.assignedToAgent || order.assignedToAgent.toString() !== agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga yuborilmagan',
      });
    }

    // Check if order is already paid
    const existingTransaction = await FinanceTransaction.findOne({
      order: orderId,
      category: 'agent_paid_to_punkt',
      'fromUser.userType': 'Agent',
      'fromUser.userId': agent._id,
      status: 'completed',
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma uchun to\'lov allaqachon amalga oshirilgan',
      });
    }

    // Get punkt
    const punkt = await Punkt.findById(order.assignedByPunkt || order.currentPunkt);
    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    // Create transaction
    const transaction = await FinanceTransaction.create({
      type: 'expense', // Agent uchun chiqim
      category: 'agent_paid_to_punkt',
      amount: order.totalPrice,
      order: orderId,
      description: `Agent tomonidan punktga buyurtma uchun to'liq to'lov qilindi`,
      fromUser: {
        userType: 'Agent',
        userId: agent._id,
      },
      toUser: {
        userType: 'Punkt',
        userId: punkt._id,
      },
      status: 'completed',
      completedAt: new Date(),
    });

    // Populate for response
    await transaction.populate('order', 'orderNumber totalPrice');
    await transaction.populate('toUser.userId', 'name phone viloyat tuman');

    res.status(201).json({
      success: true,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi',
      data: transaction,
    });
  } catch (error) {
    console.error('Error paying order to punkt:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lov amalga oshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Agent mijozdan pul oladi (confirmed_by_agent dan keyin)
// Bu funksiya mijoz tomonidan chaqiriladi, lekin agent uchun transaction yaratiladi
// Aslida bu funksiya orderController'da bo'ladi

// Agent to'lov qilishi kerak bo'lgan buyurtmalarni olish (assigned_to_agent status)
const getOrdersForPayment = async (req, res) => {
  try {
    const { agent } = req.user;

    // Find orders assigned to this agent that haven't been paid yet
    const orders = await Order.find({
      assignedToAgent: agent._id,
      status: { $in: ['assigned_to_agent', 'confirmed_by_agent'] },
    })
      .populate('user', 'name phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .populate('deliveryMfy', 'name type code')
      .populate('assignedByPunkt', 'name phone viloyat tuman')
      .sort({ assignedAt: -1 });

    // Check payment status for each order
    const ordersWithPaymentStatus = [];

    for (const order of orders) {
      const payment = await FinanceTransaction.findOne({
        order: order._id,
        category: 'agent_paid_to_punkt',
        'fromUser.userType': 'Agent',
        'fromUser.userId': agent._id,
        status: 'completed',
      });

      ordersWithPaymentStatus.push({
        ...order.toObject(),
        paymentStatus: payment ? 'paid' : 'unpaid',
        paymentTransaction: payment || null,
      });
    }

    res.status(200).json({
      success: true,
      count: ordersWithPaymentStatus.length,
      data: ordersWithPaymentStatus,
    });
  } catch (error) {
    console.error('Error fetching orders for payment:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lov qilish uchun buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Agent o'zining kirim/chiqimlarini olish
const getAgentTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const { agent } = req.user;

    const filter = {
      $or: [
        { 'fromUser.userType': 'Agent', 'fromUser.userId': agent._id },
        { 'toUser.userType': 'Agent', 'toUser.userId': agent._id },
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
      .populate('fromUser.userId', 'name phone')
      .populate('toUser.userId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate totals
    // Income: transactions where agent is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Agent',
          'toUser.userId': agent._id,
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

    // Expense: transactions where agent is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Agent',
          'fromUser.userId': agent._id,
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
    console.error('Error fetching agent transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Tranzaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Agent balansini olish
const getAgentBalance = async (req, res) => {
  try {
    const { agent } = req.user;

    // Income: transactions where agent is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Agent',
          'toUser.userId': agent._id,
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

    // Expense: transactions where agent is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Agent',
          'fromUser.userId': agent._id,
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
    console.error('Error fetching agent balance:', error);
    res.status(500).json({
      success: false,
      message: 'Balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  payOrderToPunkt,
  getOrdersForPayment,
  getAgentTransactions,
  getAgentBalance,
};
