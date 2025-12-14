const PaymentTransaction = require('../models/PaymentTransaction');
const AgentDailyReport = require('../models/AgentDailyReport');
const FinanceSubmission = require('../models/FinanceSubmission');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Region = require('../models/Region');

// ==================== MFY AGENT FUNCTIONS ====================

// MFY Agent: Kunlik hisobot
const getMfyDailyReport = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    // MFY agent ekanligini tekshirish
    if (agent.agentType !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat MFY agentlar uchun',
      });
    }

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

      // Topshirilgan summalarni hisoblash
      const submittedTransactions = await PaymentTransaction.find({
        collectedBy: agentId,
        submittedToDistrict: { $exists: true, $ne: null },
        submittedToDistrictAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const submittedAmount = submittedTransactions.reduce((sum, t) => sum + t.amount, 0);

      report = new AgentDailyReport({
        agent: agentId,
        date: reportDate,
        agentType: 'mfy',
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
    console.error('Error in getMfyDailyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// MFY Agent: Kutilayotgan to'lovlarni ko'rish
const getMfyPendingPayments = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat MFY agentlar uchun',
      });
    }

    // MFY agent hududidagi kutilayotgan to'lovlar
    // Avval buyurtmalarni topamiz
    const mfyId = agent.mfy?._id?.toString() || agent.mfy?.toString();
    const orders = await Order.find({
      deliveryMfy: mfyId,
      status: 'confirmed_by_customer',
      paymentStatus: 'paid',
    }).select('_id');

    const orderIds = orders.map((o) => o._id);

    const pendingTransactions = await PaymentTransaction.find({
      status: 'pending',
      currentHolder: 'user',
      order: { $in: orderIds },
    })
      .populate('order', 'orderNumber totalPrice status deliveryMfy')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions,
    });
  } catch (error) {
    console.error('Error in getMfyPendingPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Kutilayotgan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// MFY Agent: To'lovni qabul qilish
const collectPayment = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { transactionId } = req.params;

    if (agent.agentType !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat MFY agentlar uchun',
      });
    }

    const transaction = await PaymentTransaction.findById(transactionId).populate('order');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'To\'lov transaksiyasi topilmadi',
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu to\'lov allaqachon qabul qilingan',
      });
    }

    // Buyurtma MFY agent hududida bo'lishi kerak
    const orderMfy = transaction.order.deliveryMfy?.toString() || transaction.order.deliveryMfy;
    if (orderMfy !== (agent.mfy?._id?.toString() || agent.mfy?.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Bu to\'lov sizning hududingizga tegishli emas',
      });
    }

    // To'lovni qabul qilish
    transaction.status = 'collected';
    transaction.collectedBy = agentId;
    transaction.collectedAt = new Date();
    transaction.currentHolder = 'mfy_agent';
    transaction.currentHolderId = agentId;
    transaction.addTransactionPath('mfy_agent', agentId, 'collected', 'MFY agent tomonidan qabul qilindi');

    await transaction.save();

    // Kunlik hisobotni yangilash
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let report = await AgentDailyReport.findOne({
      agent: agentId,
      date: today,
    });

    if (!report) {
      report = new AgentDailyReport({
        agent: agentId,
        date: today,
        agentType: 'mfy',
        transactions: [],
      });
    }

    if (!report.transactions.includes(transaction._id)) {
      report.transactions.push(transaction._id);
      report.ordersCount += 1;
      report.totalAmount += transaction.amount;
      report.collectedAmount += transaction.amount;
      report.pendingAmount += transaction.amount;

      if (transaction.paymentMethod === 'cash') {
        report.cashAmount += transaction.amount;
      } else {
        report.cardAmount += transaction.amount;
      }

      await report.save();
    }

    res.status(200).json({
      success: true,
      message: 'To\'lov muvaffaqiyatli qabul qilindi',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        collectedAt: transaction.collectedAt,
      },
    });
  } catch (error) {
    console.error('Error in collectPayment:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovni qabul qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// MFY Agent: Tuman agentga topshirish
const submitToDistrict = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { transactionIds, notes } = req.body;

    if (agent.agentType !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat MFY agentlar uchun',
      });
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaksiyalar ro\'yxati kiritilishi shart',
      });
    }

    // Tuman agentni topish
    if (!agent.tuman) {
      return res.status(400).json({
        success: false,
        message: 'Tuman agent topilmadi',
      });
    }

    const districtAgent = await Agent.findOne({
      tuman: agent.tuman,
      mfy: null,
    }).populate('tuman', 'name');

    if (!districtAgent) {
      return res.status(404).json({
        success: false,
        message: 'Tuman agent topilmadi',
      });
    }

    // Transaksiyalarni tekshirish
    const transactions = await PaymentTransaction.find({
      _id: { $in: transactionIds },
      collectedBy: agentId,
      status: 'collected',
      currentHolder: 'mfy_agent',
      currentHolderId: agentId,
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi transaksiyalar topilmadi yoki qabul qilinmagan',
      });
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const cashAmount = transactions
      .filter((t) => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cardAmount = transactions
      .filter((t) => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.amount, 0);

    // Topshiruv yaratish
    const submission = new FinanceSubmission({
      fromAgent: agentId,
      fromAgentType: 'mfy',
      toAgent: districtAgent._id,
      toAgentType: 'tuman',
      amount: totalAmount,
      submissionDate: new Date(),
      transactions: transactionIds,
      cashAmount,
      cardAmount,
      transactionsCount: transactions.length,
      notes: notes || '',
    });

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transaction of transactions) {
      transaction.status = 'submitted';
      transaction.submittedToDistrict = districtAgent._id;
      transaction.submittedToDistrictAt = new Date();
      transaction.currentHolder = 'district_agent';
      transaction.currentHolderId = districtAgent._id;
      transaction.addTransactionPath('mfy_agent', agentId, 'submitted', `Tuman agentga topshirildi: ${districtAgent.name}`);
      await transaction.save();
    }

    // Kunlik hisobotni yangilash
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await AgentDailyReport.findOne({
      agent: agentId,
      date: today,
    });

    if (report) {
      report.submittedAmount += totalAmount;
      report.pendingAmount -= totalAmount;
      report.isSubmitted = true;
      report.submittedAt = new Date();
      await report.save();
    }

    res.status(201).json({
      success: true,
      message: 'To\'lovlar muvaffaqiyatli topshirildi',
      submission: {
        id: submission._id,
        amount: submission.amount,
        transactionsCount: submission.transactionsCount,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in submitToDistrict:', error);
    res.status(500).json({
      success: false,
      message: 'Topshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// MFY Agent: Statistika
const getMfyStatistics = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'mfy') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat MFY agentlar uchun',
      });
    }

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

    const submittedTransactions = transactions.filter((t) => t.status === 'submitted' || t.status === 'received');
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
    console.error('Error in getMfyStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TUMAN AGENT FUNCTIONS ====================

// Tuman Agent: Tuman hisoboti
const getDistrictReport = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'tuman') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Tuman agentlar uchun',
      });
    }

    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    // Barcha MFY agentlardan kelgan topshiruvlar
    const startOfDay = new Date(reportDate);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'tuman',
      submissionDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('fromAgent', 'name phone')
      .populate('transactions')
      .sort({ createdAt: -1 });

    const totalReceived = submissions
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = submissions
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({
      success: true,
      report: {
        date: reportDate,
        submissionsCount: submissions.length,
        totalReceived,
        pendingAmount,
        submissions: submissions.map((s) => ({
          id: s._id,
          fromAgent: s.fromAgent,
          amount: s.amount,
          status: s.status,
          submissionDate: s.submissionDate,
          transactionsCount: s.transactionsCount,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getDistrictReport:', error);
    res.status(500).json({
      success: false,
      message: 'Tuman hisobotini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tuman Agent: MFY agentlardan kelgan topshiruvlarni ko'rish
const getDistrictSubmissions = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'tuman') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Tuman agentlar uchun',
      });
    }

    const { status = 'pending' } = req.query;

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'tuman',
      status,
    })
      .populate('fromAgent', 'name phone mfy')
      .populate('transactions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('Error in getDistrictSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tuman Agent: Topshiruvni tasdiqlash
const confirmDistrictSubmission = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { submissionId } = req.params;

    if (agent.agentType !== 'tuman') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Tuman agentlar uchun',
      });
    }

    const submission = await FinanceSubmission.findById(submissionId).populate('transactions');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Topshiruv topilmadi',
      });
    }

    if (submission.toAgent.toString() !== agentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu topshiruv sizga tegishli emas',
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu topshiruv allaqachon tasdiqlangan yoki rad etilgan',
      });
    }

    // Topshiruvni tasdiqlash
    submission.status = 'confirmed';
    submission.confirmedBy = agentId;
    submission.confirmedByModel = 'Agent';
    submission.confirmedAt = new Date();

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transactionId of submission.transactions) {
      const transaction = await PaymentTransaction.findById(transactionId);
      if (transaction) {
        transaction.status = 'received';
        transaction.receivedByDistrict = agentId;
        transaction.receivedByDistrictAt = new Date();
        transaction.currentHolder = 'district_agent';
        transaction.currentHolderId = agentId;
        transaction.addTransactionPath('district_agent', agentId, 'received', 'Tuman agent tomonidan qabul qilindi');
        await transaction.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Topshiruv muvaffaqiyatli tasdiqlandi',
      submission: {
        id: submission._id,
        status: submission.status,
        confirmedAt: submission.confirmedAt,
      },
    });
  } catch (error) {
    console.error('Error in confirmDistrictSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tuman Agent: Viloyat agentga topshirish
const submitToProvince = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { transactionIds, notes } = req.body;

    if (agent.agentType !== 'tuman') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Tuman agentlar uchun',
      });
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaksiyalar ro\'yxati kiritilishi shart',
      });
    }

    // Viloyat agentni topish
    if (!agent.viloyat) {
      return res.status(400).json({
        success: false,
        message: 'Viloyat agent topilmadi',
      });
    }

    const provinceAgent = await Agent.findOne({
      viloyat: agent.viloyat,
      tuman: null,
      mfy: null,
    }).populate('viloyat', 'name');

    if (!provinceAgent) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat agent topilmadi',
      });
    }

    // Transaksiyalarni tekshirish
    const transactions = await PaymentTransaction.find({
      _id: { $in: transactionIds },
      receivedByDistrict: agentId,
      status: 'received',
      currentHolder: 'district_agent',
      currentHolderId: agentId,
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi transaksiyalar topilmadi yoki qabul qilinmagan',
      });
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const cashAmount = transactions
      .filter((t) => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cardAmount = transactions
      .filter((t) => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.amount, 0);

    // Topshiruv yaratish
    const submission = new FinanceSubmission({
      fromAgent: agentId,
      fromAgentType: 'tuman',
      toAgent: provinceAgent._id,
      toAgentType: 'viloyat',
      amount: totalAmount,
      submissionDate: new Date(),
      transactions: transactionIds,
      cashAmount,
      cardAmount,
      transactionsCount: transactions.length,
      notes: notes || '',
    });

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transaction of transactions) {
      transaction.status = 'submitted';
      transaction.submittedToProvince = provinceAgent._id;
      transaction.submittedToProvinceAt = new Date();
      transaction.currentHolder = 'province_agent';
      transaction.currentHolderId = provinceAgent._id;
      transaction.addTransactionPath('district_agent', agentId, 'submitted', `Viloyat agentga topshirildi: ${provinceAgent.name}`);
      await transaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'To\'lovlar muvaffaqiyatli topshirildi',
      submission: {
        id: submission._id,
        amount: submission.amount,
        transactionsCount: submission.transactionsCount,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in submitToProvince:', error);
    res.status(500).json({
      success: false,
      message: 'Topshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tuman Agent: Statistika
const getDistrictStatistics = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'tuman') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Tuman agentlar uchun',
      });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'tuman',
      submissionDate: { $gte: start, $lte: end },
    });

    const totalReceived = submissions
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = submissions
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({
      success: true,
      statistics: {
        period: {
          startDate: start,
          endDate: end,
        },
        submissionsCount: submissions.length,
        totalReceived,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error('Error in getDistrictStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== VILOYAT AGENT FUNCTIONS ====================

// Viloyat Agent: Viloyat hisoboti
const getProvinceReport = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'viloyat') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Viloyat agentlar uchun',
      });
    }

    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(reportDate);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'viloyat',
      submissionDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('fromAgent', 'name phone tuman')
      .populate('transactions')
      .sort({ createdAt: -1 });

    const totalReceived = submissions
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = submissions
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({
      success: true,
      report: {
        date: reportDate,
        submissionsCount: submissions.length,
        totalReceived,
        pendingAmount,
        submissions: submissions.map((s) => ({
          id: s._id,
          fromAgent: s.fromAgent,
          amount: s.amount,
          status: s.status,
          submissionDate: s.submissionDate,
          transactionsCount: s.transactionsCount,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getProvinceReport:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat hisobotini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Viloyat Agent: Tuman agentlardan kelgan topshiruvlarni ko'rish
const getProvinceSubmissions = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'viloyat') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Viloyat agentlar uchun',
      });
    }

    const { status = 'pending' } = req.query;

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'viloyat',
      status,
    })
      .populate('fromAgent', 'name phone tuman')
      .populate('transactions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('Error in getProvinceSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Viloyat Agent: Topshiruvni tasdiqlash
const confirmProvinceSubmission = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { submissionId } = req.params;

    if (agent.agentType !== 'viloyat') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Viloyat agentlar uchun',
      });
    }

    const submission = await FinanceSubmission.findById(submissionId).populate('transactions');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Topshiruv topilmadi',
      });
    }

    if (submission.toAgent.toString() !== agentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu topshiruv sizga tegishli emas',
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu topshiruv allaqachon tasdiqlangan yoki rad etilgan',
      });
    }

    // Topshiruvni tasdiqlash
    submission.status = 'confirmed';
    submission.confirmedBy = agentId;
    submission.confirmedByModel = 'Agent';
    submission.confirmedAt = new Date();

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transactionId of submission.transactions) {
      const transaction = await PaymentTransaction.findById(transactionId);
      if (transaction) {
        transaction.status = 'received';
        transaction.receivedByProvince = agentId;
        transaction.receivedByProvinceAt = new Date();
        transaction.currentHolder = 'province_agent';
        transaction.currentHolderId = agentId;
        transaction.addTransactionPath('province_agent', agentId, 'received', 'Viloyat agent tomonidan qabul qilindi');
        await transaction.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Topshiruv muvaffaqiyatli tasdiqlandi',
      submission: {
        id: submission._id,
        status: submission.status,
        confirmedAt: submission.confirmedAt,
      },
    });
  } catch (error) {
    console.error('Error in confirmProvinceSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Viloyat Agent: Moliya bo'limiga topshirish
const submitToFinance = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;
    const { transactionIds, notes } = req.body;

    if (agent.agentType !== 'viloyat') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Viloyat agentlar uchun',
      });
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaksiyalar ro\'yxati kiritilishi shart',
      });
    }

    // Transaksiyalarni tekshirish
    const transactions = await PaymentTransaction.find({
      _id: { $in: transactionIds },
      receivedByProvince: agentId,
      status: 'received',
      currentHolder: 'province_agent',
      currentHolderId: agentId,
    });

    if (transactions.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi transaksiyalar topilmadi yoki qabul qilinmagan',
      });
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const cashAmount = transactions
      .filter((t) => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    const cardAmount = transactions
      .filter((t) => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.amount, 0);

    // Topshiruv yaratish
    const submission = new FinanceSubmission({
      fromAgent: agentId,
      fromAgentType: 'viloyat',
      toAgent: null, // Moliya bo'limiga
      toAgentType: 'finance',
      amount: totalAmount,
      submissionDate: new Date(),
      transactions: transactionIds,
      cashAmount,
      cardAmount,
      transactionsCount: transactions.length,
      notes: notes || '',
    });

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transaction of transactions) {
      transaction.submittedToFinance = new Date();
      transaction.currentHolder = 'finance';
      transaction.currentHolderId = null;
      transaction.addTransactionPath('province_agent', agentId, 'submitted', 'Moliya bo\'limiga topshirildi');
      await transaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'To\'lovlar muvaffaqiyatli moliya bo\'limiga topshirildi',
      submission: {
        id: submission._id,
        amount: submission.amount,
        transactionsCount: submission.transactionsCount,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in submitToFinance:', error);
    res.status(500).json({
      success: false,
      message: 'Topshirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Viloyat Agent: Statistika
const getProvinceStatistics = async (req, res) => {
  try {
    const agentId = req.user.userId;
    const agent = req.user.agent;

    if (agent.agentType !== 'viloyat') {
      return res.status(403).json({
        success: false,
        message: 'Bu funksiya faqat Viloyat agentlar uchun',
      });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgent: agentId,
      toAgentType: 'viloyat',
      submissionDate: { $gte: start, $lte: end },
    });

    const totalReceived = submissions
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = submissions
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({
      success: true,
      statistics: {
        period: {
          startDate: start,
          endDate: end,
        },
        submissionsCount: submissions.length,
        totalReceived,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error('Error in getProvinceStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  // MFY Agent
  getMfyDailyReport,
  getMfyPendingPayments,
  collectPayment,
  submitToDistrict,
  getMfyStatistics,
  // Tuman Agent
  getDistrictReport,
  getDistrictSubmissions,
  confirmDistrictSubmission,
  submitToProvince,
  getDistrictStatistics,
  // Viloyat Agent
  getProvinceReport,
  getProvinceSubmissions,
  confirmProvinceSubmission,
  submitToFinance,
  getProvinceStatistics,
};

