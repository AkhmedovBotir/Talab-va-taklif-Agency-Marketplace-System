const FinanceTransaction = require('../models/FinanceTransaction');
const Punkt = require('../models/Punkt');
const Admin = require('../models/Admin');

// Admin punktga pul yuborish
const sendMoneyToPunkt = async (req, res) => {
  try {
    const { punktId, amount, description } = req.body;
    const admin = req.user.admin;

    if (!punktId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Punkt ID va summa kiritilishi shart',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Summa 0 dan katta bo\'lishi kerak',
      });
    }

    // Check if punkt exists
    const punkt = await Punkt.findById(punktId);
    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    // Create transaction
    const transaction = await FinanceTransaction.create({
      type: 'expense', // Admin uchun chiqim
      category: 'admin_to_punkt',
      amount,
      description: description || `Admin tomonidan punktga pul yuborildi`,
      fromUser: {
        userType: 'Admin',
        userId: admin._id,
      },
      toUser: {
        userType: 'Punkt',
        userId: punktId,
      },
      status: 'completed',
      completedAt: new Date(),
    });

    // Populate for response
    await transaction.populate('toUser.userId', 'name phone viloyat tuman');

    res.status(201).json({
      success: true,
      message: 'Pul muvaffaqiyatli punktga yuborildi',
      data: transaction,
    });
  } catch (error) {
    console.error('Error sending money to punkt:', error);
    res.status(500).json({
      success: false,
      message: 'Pul yuborishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin o'zining kirim/chiqimlarini olish
const getAdminTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const admin = req.user.admin;

    const filter = {
      $or: [
        { 'fromUser.userType': 'Admin', 'fromUser.userId': admin._id },
        { 'toUser.userType': 'Admin', 'toUser.userId': admin._id },
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
    // Income: transactions where admin is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Admin',
          'toUser.userId': admin._id,
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

    // Expense: transactions where admin is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Admin',
          'fromUser.userId': admin._id,
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
    console.error('Error fetching admin transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Tranzaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin balansini olish
const getAdminBalance = async (req, res) => {
  try {
    const admin = req.user.admin;

    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Admin',
          'toUser.userId': admin._id,
          type: 'income',
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

    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Admin',
          'fromUser.userId': admin._id,
          type: 'expense',
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
    console.error('Error fetching admin balance:', error);
    res.status(500).json({
      success: false,
      message: 'Balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  sendMoneyToPunkt,
  getAdminTransactions,
  getAdminBalance,
};
