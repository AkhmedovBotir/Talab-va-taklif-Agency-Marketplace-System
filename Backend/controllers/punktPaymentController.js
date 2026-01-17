const FinanceTransaction = require('../models/FinanceTransaction');
const Order = require('../models/Order');
const Contragent = require('../models/Contragent');

// Punkt kontragentga zaklad berish (delivered_to_punkt dan keyin)
const payZakladToContragent = async (req, res) => {
  try {
    const { orderId, contragentRequestId, zakladPercentage } = req.body;
    const { punkt } = req.user;

    if (!orderId || !contragentRequestId || !zakladPercentage) {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma ID, kontragent so\'rov ID va zaklad foizi kiritilishi shart',
      });
    }

    if (zakladPercentage < 0 || zakladPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Zaklad foizi 0-100 orasida bo\'lishi kerak',
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Check if order is delivered to punkt
    if (order.status !== 'delivered_to_punkt') {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma hali punktga yetkazilmagan',
      });
    }

    // Find contragent request
    const contragentRequest = order.contragentRequests.find(
      (req) => req._id.toString() === contragentRequestId.toString()
    );

    if (!contragentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent so\'rovi topilmadi',
      });
    }

    if (contragentRequest.status !== 'delivered_to_punkt') {
      return res.status(400).json({
        success: false,
        message: 'Bu kontragent so\'rovi hali punktga yetkazilmagan',
      });
    }

    // Check if zaklad already paid
    const existingTransaction = await FinanceTransaction.findOne({
      order: orderId,
      contragentRequest: contragentRequestId,
      category: 'punkt_to_contragent_zaklad',
      status: 'completed',
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Bu kontragentga zaklad allaqachon berilgan',
      });
    }

    // Calculate zaklad amount based on items in this request
    let zakladAmount = 0;
    const requestItemIds = contragentRequest.itemIds || [];
    
    requestItemIds.forEach((itemIndex) => {
      if (order.items[itemIndex]) {
        const item = order.items[itemIndex];
        const itemTotal = item.price * item.quantity;
        zakladAmount += (itemTotal * zakladPercentage) / 100;
      }
    });

    if (zakladAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Zaklad summasi 0 dan katta bo\'lishi kerak',
      });
    }

    // Get contragent
    const contragent = await Contragent.findById(contragentRequest.contragentId);
    if (!contragent) {
      return res.status(404).json({
        success: false,
        message: 'Kontragent topilmadi',
      });
    }

    // Create transaction for Punkt (expense)
    const punktTransaction = await FinanceTransaction.create({
      type: 'expense', // Punkt uchun chiqim
      category: 'punkt_to_contragent_zaklad',
      amount: zakladAmount,
      order: orderId,
      contragentRequest: contragentRequestId,
      zakladPercentage,
      description: `Punkt tomonidan kontragentga zaklad berildi (${zakladPercentage}%)`,
      fromUser: {
        userType: 'Punkt',
        userId: punkt._id,
      },
      toUser: {
        userType: 'Contragent',
        userId: contragentRequest.contragentId,
      },
      status: 'completed',
      completedAt: new Date(),
    });

    // Create transaction for Contragent (income)
    const contragentTransaction = await FinanceTransaction.create({
      type: 'income', // Kontragent uchun kirim
      category: 'contragent_received_zaklad',
      amount: zakladAmount,
      order: orderId,
      contragentRequest: contragentRequestId,
      zakladPercentage,
      description: `Kontragent punktdan zaklad oldi (${zakladPercentage}%)`,
      fromUser: {
        userType: 'Punkt',
        userId: punkt._id,
      },
      toUser: {
        userType: 'Contragent',
        userId: contragentRequest.contragentId,
      },
      status: 'completed',
      completedAt: new Date(),
    });

    // Populate for response
    await punktTransaction.populate('order', 'orderNumber totalPrice');
    await punktTransaction.populate('toUser.userId', 'name inn phone');

    res.status(201).json({
      success: true,
      message: 'Zaklad muvaffaqiyatli berildi',
      data: {
        punktTransaction,
        contragentTransaction: {
          _id: contragentTransaction._id,
          type: contragentTransaction.type,
          category: contragentTransaction.category,
          amount: contragentTransaction.amount,
          order: punktTransaction.order,
          toUser: punktTransaction.toUser,
          zakladPercentage: contragentTransaction.zakladPercentage,
          description: contragentTransaction.description,
          status: contragentTransaction.status,
          completedAt: contragentTransaction.completedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error paying zaklad to contragent:', error);
    res.status(500).json({
      success: false,
      message: 'Zaklad berishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Punkt agentdan pul oladi (assigned_to_agent dan keyin)
// Bu funksiya agent tomonidan chaqiriladi, lekin punkt uchun transaction yaratiladi
// Aslida bu funksiya agentPaymentController'da bo'ladi, bu yerda faqat punkt o'z tranzaksiyalarini ko'radi

// Punkt kontragentlarga zaklad berish uchun buyurtmalarni olish (delivered_to_punkt status)
const getOrdersForZaklad = async (req, res) => {
  try {
    const { punkt } = req.user;

    // Find orders delivered to this punkt that haven't received zaklad yet
    const orders = await Order.find({
      $or: [
        { currentPunkt: punkt._id },
        { confirmedByPunkt: punkt._id },
      ],
      status: 'delivered_to_punkt',
      orderType: 'tuman',
    })
      .populate('contragentRequests.contragentId', 'name inn phone')
      .populate('deliveryViloyat', 'name type code')
      .populate('deliveryTuman', 'name type code')
      .sort({ createdAt: -1 });

    // Filter orders with delivered contragent requests
    const ordersWithDeliveredRequests = [];

    for (const order of orders) {
      const deliveredRequests = [];
      
      for (const contragentRequest of order.contragentRequests) {
        if (contragentRequest.status === 'delivered_to_punkt') {
          // Check if zaklad already paid
          const zakladPaid = await FinanceTransaction.findOne({
            order: order._id,
            contragentRequest: contragentRequest._id,
            category: 'punkt_to_contragent_zaklad',
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

            deliveredRequests.push({
              ...contragentRequest.toObject(),
              potentialZakladAmount: potentialZaklad,
            });
          }
        }
      }

      if (deliveredRequests.length > 0) {
        const orderObj = order.toObject();
        orderObj.contragentRequestsForZaklad = deliveredRequests;
        ordersWithDeliveredRequests.push(orderObj);
      }
    }

    res.status(200).json({
      success: true,
      count: ordersWithDeliveredRequests.length,
      data: ordersWithDeliveredRequests,
    });
  } catch (error) {
    console.error('Error fetching orders for zaklad:', error);
    res.status(500).json({
      success: false,
      message: 'Zaklad berish uchun buyurtmalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Punkt o'zining kirim/chiqimlarini olish
const getPunktTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const { punkt } = req.user;

    const filter = {
      $or: [
        { 'fromUser.userType': 'Punkt', 'fromUser.userId': punkt._id },
        { 'toUser.userType': 'Punkt', 'toUser.userId': punkt._id },
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
      .populate('contragentRequest')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate totals
    // Income: transactions where punkt is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Punkt',
          'toUser.userId': punkt._id,
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

    // Expense: transactions where punkt is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Punkt',
          'fromUser.userId': punkt._id,
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
    console.error('Error fetching punkt transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Tranzaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Punkt balansini olish
const getPunktBalance = async (req, res) => {
  try {
    const { punkt } = req.user;

    // Income: transactions where punkt is the receiver (toUser)
    const incomeTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'toUser.userType': 'Punkt',
          'toUser.userId': punkt._id,
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

    // Expense: transactions where punkt is the sender (fromUser)
    const expenseTotal = await FinanceTransaction.aggregate([
      {
        $match: {
          'fromUser.userType': 'Punkt',
          'fromUser.userId': punkt._id,
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
    console.error('Error fetching punkt balance:', error);
    res.status(500).json({
      success: false,
      message: 'Balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  payZakladToContragent,
  getOrdersForZaklad,
  getPunktTransactions,
  getPunktBalance,
};
