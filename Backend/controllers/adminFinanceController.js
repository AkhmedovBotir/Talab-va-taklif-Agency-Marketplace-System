const PaymentTransaction = require('../models/PaymentTransaction');
const FinanceSubmission = require('../models/FinanceSubmission');
const FinanceReport = require('../models/FinanceReport');
const AgentDailyReport = require('../models/AgentDailyReport');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Region = require('../models/Region');
const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');

// ==================== KUNLIK HISOBOT ====================

// Kunlik hisobot
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(reportDate);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Moliya bo'limiga topshirilgan to'lovlar
    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      submissionDate: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions');

    const confirmedSubmissions = submissions.filter((s) => s.status === 'confirmed');
    const totalReceived = confirmedSubmissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = confirmedSubmissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    // Viloyat bo'yicha
    const byRegion = {};
    confirmedSubmissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        date: reportDate,
        totalReceived,
        totalOrders,
        submissionsCount: submissions.length,
        confirmedCount: confirmedSubmissions.length,
        pendingCount: submissions.length - confirmedSubmissions.length,
        byRegion: Object.values(byRegion),
        submissions: submissions.map((s) => ({
          id: s._id,
          fromAgent: s.fromAgent,
          amount: s.amount,
          status: s.status,
          transactionsCount: s.transactionsCount,
          submissionDate: s.submissionDate,
        })),
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

// ==================== HAFTALIK HISOBOT ====================

// Haftalik hisobot
const getWeeklyReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Yakshanba
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      submissionDate: { $gte: startOfWeek, $lte: endOfWeek },
      status: 'confirmed',
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions');

    const totalReceived = submissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = submissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    // Viloyat bo'yicha
    const byRegion = {};
    submissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    // Kunlik taqsimot
    const dailyBreakdown = {};
    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      dailyBreakdown[dayKey] = {
        date: new Date(d),
        totalAmount: 0,
        ordersCount: 0,
      };
    }

    submissions.forEach((s) => {
      const dayKey = s.submissionDate.toISOString().split('T')[0];
      if (dailyBreakdown[dayKey]) {
        dailyBreakdown[dayKey].totalAmount += s.amount;
        dailyBreakdown[dayKey].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        period: {
          startDate: startOfWeek,
          endDate: endOfWeek,
        },
        totalReceived,
        totalOrders,
        byRegion: Object.values(byRegion),
        dailyBreakdown: Object.values(dailyBreakdown),
      },
    });
  } catch (error) {
    console.error('Error in getWeeklyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Haftalik hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== OYLIK HISOBOT ====================

// Oylik hisobot
const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const reportYear = year ? parseInt(year) : new Date().getFullYear();
    const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(reportYear, reportMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(reportYear, reportMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      submissionDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'confirmed',
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions');

    const totalReceived = submissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = submissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    // Viloyat bo'yicha
    const byRegion = {};
    submissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    // Tuman bo'yicha
    const byDistrict = {};
    submissions.forEach((s) => {
      const districtId = s.fromAgent?.tuman?._id?.toString() || s.fromAgent?.tuman?.toString();
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (districtId) {
        if (!byDistrict[districtId]) {
          byDistrict[districtId] = {
            district: s.fromAgent.tuman,
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byDistrict[districtId].totalAmount += s.amount;
        byDistrict[districtId].ordersCount += s.transactionsCount;
      }
    });

    // Kunlik taqsimot
    const dailyBreakdown = {};
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      dailyBreakdown[dayKey] = {
        date: new Date(d),
        totalAmount: 0,
        ordersCount: 0,
      };
    }

    submissions.forEach((s) => {
      const dayKey = s.submissionDate.toISOString().split('T')[0];
      if (dailyBreakdown[dayKey]) {
        dailyBreakdown[dayKey].totalAmount += s.amount;
        dailyBreakdown[dayKey].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        period: {
          startDate: startOfMonth,
          endDate: endOfMonth,
          year: reportYear,
          month: reportMonth + 1,
        },
        totalReceived,
        totalOrders,
        byRegion: Object.values(byRegion),
        byDistrict: Object.values(byDistrict),
        dailyBreakdown: Object.values(dailyBreakdown),
      },
    });
  } catch (error) {
    console.error('Error in getMonthlyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Oylik hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== YILLIK HISOBOT ====================

// Yillik hisobot
const getYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(reportYear, 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const endOfYear = new Date(reportYear, 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      submissionDate: { $gte: startOfYear, $lte: endOfYear },
      status: 'confirmed',
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions');

    const totalReceived = submissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = submissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    // Viloyat bo'yicha
    const byRegion = {};
    submissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    // Oylik taqsimot
    const monthlyBreakdown = {};
    for (let m = 0; m < 12; m++) {
      monthlyBreakdown[m + 1] = {
        month: m + 1,
        totalAmount: 0,
        ordersCount: 0,
      };
    }

    submissions.forEach((s) => {
      const month = s.submissionDate.getMonth() + 1;
      if (monthlyBreakdown[month]) {
        monthlyBreakdown[month].totalAmount += s.amount;
        monthlyBreakdown[month].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        period: {
          startDate: startOfYear,
          endDate: endOfYear,
          year: reportYear,
        },
        totalReceived,
        totalOrders,
        byRegion: Object.values(byRegion),
        monthlyBreakdown: Object.values(monthlyBreakdown),
      },
    });
  } catch (error) {
    console.error('Error in getYearlyReport:', error);
    res.status(500).json({
      success: false,
      message: 'Yillik hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== BELGILANGAN MUDDAT HISOBOTI ====================

// Belgilangan muddat hisoboti
const getCustomReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Boshlanish va tugash sanalari kiritilishi shart',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Boshlanish sanasi tugash sanasidan kichik bo\'lishi kerak',
      });
    }

    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      submissionDate: { $gte: start, $lte: end },
      status: 'confirmed',
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions');

    const totalReceived = submissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = submissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    // Viloyat bo'yicha
    const byRegion = {};
    submissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    // Tuman bo'yicha
    const byDistrict = {};
    submissions.forEach((s) => {
      const districtId = s.fromAgent?.tuman?._id?.toString() || s.fromAgent?.tuman?.toString();
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (districtId) {
        if (!byDistrict[districtId]) {
          byDistrict[districtId] = {
            district: s.fromAgent.tuman,
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byDistrict[districtId].totalAmount += s.amount;
        byDistrict[districtId].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        period: {
          startDate: start,
          endDate: end,
        },
        totalReceived,
        totalOrders,
        byRegion: Object.values(byRegion),
        byDistrict: Object.values(byDistrict),
      },
    });
  } catch (error) {
    console.error('Error in getCustomReport:', error);
    res.status(500).json({
      success: false,
      message: 'Hisobotni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TOPSHIRUVLAR ====================

// Kutilayotgan topshiruvlarni ko'rish
const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      status: 'pending',
    })
      .populate('fromAgent', 'name phone viloyat tuman')
      .populate('transactions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('Error in getPendingSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Kutilayotgan topshiruvlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Topshiruvni tasdiqlash
const confirmSubmission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { submissionId } = req.params;

    const submission = await FinanceSubmission.findById(submissionId).populate('transactions');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Topshiruv topilmadi',
      });
    }

    if (submission.toAgentType !== 'finance') {
      return res.status(400).json({
        success: false,
        message: 'Bu topshiruv moliya bo\'limiga tegishli emas',
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
    submission.confirmedBy = adminId;
    submission.confirmedByModel = 'Admin';
    submission.confirmedAt = new Date();

    await submission.save();

    // Transaksiyalarni yangilash
    for (const transactionId of submission.transactions) {
      const transaction = await PaymentTransaction.findById(transactionId);
      if (transaction) {
        transaction.receivedByFinance = true;
        transaction.receivedByFinanceAt = new Date();
        transaction.confirmedByFinance = adminId;
        transaction.confirmedByFinanceAt = new Date();
        transaction.status = 'confirmed';
        transaction.currentHolder = 'finance';
        transaction.addTransactionPath('finance', adminId, 'confirmed', 'Moliya bo\'limi tomonidan tasdiqlandi');
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
    console.error('Error in confirmSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Topshiruvni rad etish
const rejectSubmission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { submissionId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rad etish sababi kiritilishi shart',
      });
    }

    const submission = await FinanceSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Topshiruv topilmadi',
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu topshiruv allaqachon tasdiqlangan yoki rad etilgan',
      });
    }

    // Topshiruvni rad etish
    submission.status = 'rejected';
    submission.rejectedBy = adminId;
    submission.rejectedByModel = 'Admin';
    submission.rejectedAt = new Date();
    submission.rejectionReason = rejectionReason;

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Topshiruv rad etildi',
      submission: {
        id: submission._id,
        status: submission.status,
        rejectedAt: submission.rejectedAt,
      },
    });
  } catch (error) {
    console.error('Error in rejectSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiruvni rad etishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TRANSAKSIYALAR ====================

// Barcha transaksiyalarni ko'rish
const getAllTransactions = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      currentHolder,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (currentHolder) query.currentHolder = currentHolder;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await PaymentTransaction.find(query)
      .populate('order', 'orderNumber totalPrice')
      .populate('user', 'name phone')
      .populate('collectedBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      transactions,
    });
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    res.status(500).json({
      success: false,
      message: 'Transaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== STATISTIKA ====================

// Umumiy statistika
const getStatistics = async (req, res) => {
  try {
    const totalTransactions = await PaymentTransaction.countDocuments();
    const totalAmount = await PaymentTransaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const byStatus = await PaymentTransaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const byPaymentMethod = await PaymentTransaction.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const confirmedSubmissions = await FinanceSubmission.countDocuments({
      toAgentType: 'finance',
      status: 'confirmed',
    });

    const pendingSubmissions = await FinanceSubmission.countDocuments({
      toAgentType: 'finance',
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      statistics: {
        totalTransactions,
        totalAmount: totalAmount[0]?.total || 0,
        byStatus,
        byPaymentMethod,
        submissions: {
          confirmed: confirmedSubmissions,
          pending: pendingSubmissions,
        },
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

// Viloyat bo'yicha statistika
const getStatisticsByRegion = async (req, res) => {
  try {
    const submissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      status: 'confirmed',
    })
      .populate('fromAgent', 'viloyat')
      .populate('transactions');

    const byRegion = {};

    submissions.forEach((s) => {
      const regionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();
      if (regionId) {
        if (!byRegion[regionId]) {
          byRegion[regionId] = {
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byRegion[regionId].totalAmount += s.amount;
        byRegion[regionId].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      statistics: Object.values(byRegion),
    });
  } catch (error) {
    console.error('Error in getStatisticsByRegion:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat bo\'yicha statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tuman bo'yicha statistika
const getStatisticsByDistrict = async (req, res) => {
  try {
    const { regionId } = req.query;

    const query = {
      toAgentType: 'finance',
      status: 'confirmed',
    };

    const submissions = await FinanceSubmission.find(query)
      .populate('fromAgent', 'viloyat tuman')
      .populate('transactions');

    const byDistrict = {};

    submissions.forEach((s) => {
      const districtId = s.fromAgent?.tuman?._id?.toString() || s.fromAgent?.tuman?.toString();
      const agentRegionId = s.fromAgent?.viloyat?._id?.toString() || s.fromAgent?.viloyat?.toString();

      if (districtId && (!regionId || agentRegionId === regionId)) {
        if (!byDistrict[districtId]) {
          byDistrict[districtId] = {
            district: s.fromAgent.tuman,
            region: s.fromAgent.viloyat,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byDistrict[districtId].totalAmount += s.amount;
        byDistrict[districtId].ordersCount += s.transactionsCount;
      }
    });

    res.status(200).json({
      success: true,
      statistics: Object.values(byDistrict),
    });
  } catch (error) {
    console.error('Error in getStatisticsByDistrict:', error);
    res.status(500).json({
      success: false,
      message: 'Tuman bo\'yicha statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// MFY bo'yicha statistika
const getStatisticsByMfy = async (req, res) => {
  try {
    const { districtId } = req.query;

    const agents = await Agent.find({
      mfy: { $exists: true, $ne: null },
      ...(districtId && { tuman: districtId }),
    }).populate('mfy', 'name');

    const agentIds = agents.map((a) => a._id);

    const transactions = await PaymentTransaction.find({
      collectedBy: { $in: agentIds },
      status: { $in: ['collected', 'submitted', 'received', 'confirmed'] },
    });

    const byMfy = {};

    transactions.forEach((t) => {
      const agent = agents.find((a) => a._id.toString() === t.collectedBy?.toString());
      if (agent && agent.mfy) {
        const mfyId = agent.mfy._id?.toString() || agent.mfy.toString();
        if (!byMfy[mfyId]) {
          byMfy[mfyId] = {
            mfy: agent.mfy,
            totalAmount: 0,
            ordersCount: 0,
          };
        }
        byMfy[mfyId].totalAmount += t.amount;
        byMfy[mfyId].ordersCount += 1;
      }
    });

    res.status(200).json({
      success: true,
      statistics: Object.values(byMfy),
    });
  } catch (error) {
    console.error('Error in getStatisticsByMfy:', error);
    res.status(500).json({
      success: false,
      message: 'MFY bo\'yicha statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Agentlar faolligi
const getAgentPerformance = async (req, res) => {
  try {
    const { agentType, startDate, endDate } = req.query;

    const query = {};
    if (agentType) {
      if (agentType === 'mfy') {
        query.mfy = { $exists: true, $ne: null };
      } else if (agentType === 'tuman') {
        query.tuman = { $exists: true, $ne: null };
        query.mfy = null;
      } else if (agentType === 'viloyat') {
        query.viloyat = { $exists: true, $ne: null };
        query.tuman = null;
        query.mfy = null;
      }
    }

    const agents = await Agent.find(query).populate('viloyat tuman mfy', 'name');

    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const transactionQuery = {
          collectedBy: agent._id,
        };

        if (startDate || endDate) {
          transactionQuery.collectedAt = {};
          if (startDate) transactionQuery.collectedAt.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            transactionQuery.collectedAt.$lte = end;
          }
        }

        const transactions = await PaymentTransaction.find(transactionQuery);
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          agent: {
            id: agent._id,
            name: agent.name,
            phone: agent.phone,
            viloyat: agent.viloyat,
            tuman: agent.tuman,
            mfy: agent.mfy,
            agentType: agent.agentType,
          },
          ordersCount: transactions.length,
          totalAmount,
        };
      })
    );

    // Summa bo'yicha tartiblash
    agentPerformance.sort((a, b) => b.totalAmount - a.totalAmount);

    res.status(200).json({
      success: true,
      performance: agentPerformance,
    });
  } catch (error) {
    console.error('Error in getAgentPerformance:', error);
    res.status(500).json({
      success: false,
      message: 'Agentlar faolligini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MOLIYA BALANSLARI ====================

// Umumiy balans (Umumiy tushgan summa, Tarqatilgan summa, Moliya bo'limiga ajratilgan summa, Contragent to'lovlari)
const getFinanceBalance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Sana filtri (KPI va Contragent to'lovlar uchun)
    const kpiDateFilter = {};
    const contragentDateFilter = {};
    
    if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        kpiDateFilter.createdAt = { $gte: start };
        contragentDateFilter.paidAt = { $gte: start };
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (kpiDateFilter.createdAt) {
          kpiDateFilter.createdAt.$lte = end;
        } else {
          kpiDateFilter.createdAt = { $lte: end };
        }
        if (contragentDateFilter.paidAt) {
          contragentDateFilter.paidAt.$lte = end;
        } else {
          contragentDateFilter.paidAt = { $lte: end };
        }
      }
    }

    // Sana filtri (FinanceSubmission uchun - confirmedAt)
    const submissionDateFilter = {};
    if (startDate || endDate) {
      submissionDateFilter.confirmedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        submissionDateFilter.confirmedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        submissionDateFilter.confirmedAt.$lte = end;
      }
    }

    // 1. Umumiy tushgan summa (Moliya bo'limiga tasdiqlangan to'lovlar)
    const confirmedSubmissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      status: 'confirmed',
      ...(Object.keys(submissionDateFilter).length > 0 ? submissionDateFilter : {}),
    });

    const totalReceived = confirmedSubmissions.reduce((sum, s) => sum + s.amount, 0);

    // 2. Tarqatilgan summa (KPI bonuslar - punkt, agentlar, deliveryService)
    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      ...(Object.keys(kpiDateFilter).length > 0 ? kpiDateFilter : {}),
    });

    const totalDistributed = kpiTransactions.reduce((sum, t) => {
      return (
        sum +
        (t.amounts.punkt || 0) +
        (t.amounts.viloyatAgent || 0) +
        (t.amounts.tumanAgent || 0) +
        (t.amounts.mfyAgent || 0) +
        (t.amounts.punktTransfer || 0) +
        (t.amounts.deliveryService || 0)
      );
    }, 0);

    // 3. Moliya bo'limiga ajratilgan summa (KPI bonuslardan)
    const totalFinanceKpi = kpiTransactions.reduce((sum, t) => sum + (t.amounts.finance || 0), 0);

    // 4. Yetkazib berish xizmati summasi (KPI bonuslardan)
    const totalDeliveryServiceKpi = kpiTransactions.reduce(
      (sum, t) => sum + (t.amounts.deliveryService || 0),
      0
    );

    // 5. Contragent to'lovlari (to'langan)
    const contragentPaymentsFilter = {
      status: 'paid',
      ...(Object.keys(contragentDateFilter).length > 0 ? contragentDateFilter : {}),
    };

    const paidContragentPayments = await ContragentPaymentDistribution.find(contragentPaymentsFilter);
    const totalContragentPayments = paidContragentPayments.reduce((sum, p) => sum + p.amount, 0);

    // 6. Umumiy xarajatlar (KPI bonuslar + Contragent to'lovlari)
    // KPI bonuslar - bu xarajat (ichki taqsimot)
    // totalDistributed - bu KPI bonuslar (punkt, agentlar, deliveryService)
    // totalFinanceKpi - bu ham KPI bonus (moliya bo'limi uchun)
    // Lekin moliya bo'limi uchun KPI = ichki daromad (lekin umumiy tizim uchun xarajat)
    const totalKpiExpenses = totalDistributed + totalFinanceKpi; // Barcha KPI bonuslar (xarajat)
    const totalExpenses = totalKpiExpenses + totalContragentPayments; // Umumiy xarajatlar

    // 7. Umumiy balans (Sof foyda) = Tushgan - Xarajatlar
    const totalBalance = totalReceived - totalExpenses;

    // 8. Moliya bo'limi sof daromadi
    // Moliya bo'limi uchun: KPI bonus = ichki daromad
    // Lekin umumiy tizim uchun: KPI = xarajat
    // Moliya bo'limi sof daromadi = KPI bonus (chunki bu ichki daromad)
    const financeNetIncome = totalFinanceKpi;

    // 9. Moliya bo'limi umumiy balansi
    // Moliya bo'limi: Tushgan summa - Contragent to'lovlari
    // KPI bonus qo'shilmaydi, chunki bu ichki taqsimot (xarajat)
    const financeTotalBalance = totalReceived - totalContragentPayments;

    // 10. Tafsilotlar
    const details = {
      kpiDistribution: {
        punkt: kpiTransactions.reduce((sum, t) => sum + (t.amounts.punkt || 0), 0),
        viloyatAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.viloyatAgent || 0), 0),
        tumanAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.tumanAgent || 0), 0),
        mfyAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.mfyAgent || 0), 0),
        punktTransfer: kpiTransactions.reduce((sum, t) => sum + (t.amounts.punktTransfer || 0), 0),
        deliveryService: totalDeliveryServiceKpi,
        finance: totalFinanceKpi,
        total: totalKpiExpenses, // Barcha KPI bonuslar jami (xarajat)
      },
      contragentPayments: {
        total: totalContragentPayments,
        count: paidContragentPayments.length,
      },
    };

    res.status(200).json({
      success: true,
      balance: {
        period: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        // ========== DAROMADLAR ==========
        totalReceived, // Umumiy tushgan summa (mijozlardan real tushgan pul)
        // Eslatma: KPI bonus daromad emas, xarajat!
        
        // ========== XARAJATLAR ==========
        // KPI Bonuslar (ichki taqsimot - xarajat)
        totalKpiExpenses, // Barcha KPI bonuslar jami (xarajat)
        kpiDistribution: {
          punkt: details.kpiDistribution.punkt,
          viloyatAgent: details.kpiDistribution.viloyatAgent,
          tumanAgent: details.kpiDistribution.tumanAgent,
          mfyAgent: details.kpiDistribution.mfyAgent,
          punktTransfer: details.kpiDistribution.punktTransfer,
          deliveryService: details.kpiDistribution.deliveryService,
          finance: details.kpiDistribution.finance, // Moliya bo'limi uchun KPI (ichki daromad, lekin umumiy tizim uchun xarajat)
        },
        // Contragent to'lovlari (tashqi xarajat)
        totalContragentPayments, // Contragent to'lovlari (to'langan)
        // Umumiy xarajatlar
        totalExpenses, // Umumiy xarajatlar (KPI bonuslar + Contragent to'lovlari)
        
        // ========== BALANSLAR ==========
        // Umumiy sof balans (REAL foyda)
        totalBalance, // Sof foyda = Tushgan - Xarajatlar
        
        // Moliya bo'limi balanslari
        financeTotalBalance, // Moliya bo'limi balansi = Tushgan - Contragent to'lovlari
        financeNetIncome, // Moliya bo'limi sof daromadi = KPI bonus (ichki daromad)
        
        // ========== TAFSILOTLAR ==========
        details,
      },
    });
  } catch (error) {
    console.error('Error in getFinanceBalance:', error);
    res.status(500).json({
      success: false,
      message: 'Moliya balansini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Umumiy tushgan summa
const getTotalReceived = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.confirmedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.confirmedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.confirmedAt.$lte = end;
      }
    }

    const confirmedSubmissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      status: 'confirmed',
      ...dateFilter,
    });

    const totalReceived = confirmedSubmissions.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = confirmedSubmissions.reduce((sum, s) => sum + s.transactionsCount, 0);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.confirmedAt?.$gte || null,
          endDate: dateFilter.confirmedAt?.$lte || null,
        },
        totalReceived,
        totalOrders,
        submissionsCount: confirmedSubmissions.length,
      },
    });
  } catch (error) {
    console.error('Error in getTotalReceived:', error);
    res.status(500).json({
      success: false,
      message: 'Umumiy tushgan summani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Tarqatilgan summa (KPI bonuslar)
const getTotalDistributed = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      ...dateFilter,
    });

    const totalDistributed = kpiTransactions.reduce((sum, t) => {
      return (
        sum +
        (t.amounts.punkt || 0) +
        (t.amounts.viloyatAgent || 0) +
        (t.amounts.tumanAgent || 0) +
        (t.amounts.mfyAgent || 0) +
        (t.amounts.punktTransfer || 0) +
        (t.amounts.deliveryService || 0)
      );
    }, 0);

    const details = {
      punkt: kpiTransactions.reduce((sum, t) => sum + (t.amounts.punkt || 0), 0),
      viloyatAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.viloyatAgent || 0), 0),
      tumanAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.tumanAgent || 0), 0),
      mfyAgent: kpiTransactions.reduce((sum, t) => sum + (t.amounts.mfyAgent || 0), 0),
      punktTransfer: kpiTransactions.reduce((sum, t) => sum + (t.amounts.punktTransfer || 0), 0),
      deliveryService: kpiTransactions.reduce((sum, t) => sum + (t.amounts.deliveryService || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.createdAt?.$gte || null,
          endDate: dateFilter.createdAt?.$lte || null,
        },
        totalDistributed,
        transactionsCount: kpiTransactions.length,
        details,
      },
    });
  } catch (error) {
    console.error('Error in getTotalDistributed:', error);
    res.status(500).json({
      success: false,
      message: 'Tarqatilgan summani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Moliya bo'limiga ajratilgan summa (KPI bonuslardan)
const getFinanceKpiAmount = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      ...dateFilter,
    });

    const totalFinanceKpi = kpiTransactions.reduce((sum, t) => sum + (t.amounts.finance || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.createdAt?.$gte || null,
          endDate: dateFilter.createdAt?.$lte || null,
        },
        totalFinanceKpi,
        transactionsCount: kpiTransactions.length,
      },
    });
  } catch (error) {
    console.error('Error in getFinanceKpiAmount:', error);
    res.status(500).json({
      success: false,
      message: 'Moliya bo\'limiga ajratilgan summani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get delivery service KPI amount (yetkazib berish xizmati summasi)
const getDeliveryServiceKpiAmount = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      ...dateFilter,
    });

    const totalDeliveryServiceKpi = kpiTransactions.reduce(
      (sum, t) => sum + (t.amounts.deliveryService || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.createdAt?.$gte || null,
          endDate: dateFilter.createdAt?.$lte || null,
        },
        totalDeliveryServiceKpi,
        transactionsCount: kpiTransactions.length,
      },
    });
  } catch (error) {
    console.error('Error in getDeliveryServiceKpiAmount:', error);
    res.status(500).json({
      success: false,
      message: 'Yetkazib berish xizmati summasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Umumiy balans (Tushgan - Xarajatlar)
const getTotalBalance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Tushgan summa
    const receivedDateFilter = {};
    if (startDate || endDate) {
      receivedDateFilter.confirmedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        receivedDateFilter.confirmedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        receivedDateFilter.confirmedAt.$lte = end;
      }
    }

    const confirmedSubmissions = await FinanceSubmission.find({
      toAgentType: 'finance',
      status: 'confirmed',
      ...receivedDateFilter,
    });

    const totalReceived = confirmedSubmissions.reduce((sum, s) => sum + s.amount, 0);

    // Tarqatilgan summa (KPI bonuslar)
    const distributedDateFilter = {};
    if (startDate || endDate) {
      distributedDateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        distributedDateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        distributedDateFilter.createdAt.$lte = end;
      }
    }

    const kpiTransactions = await KpiBonusTransaction.find({
      orderStatus: 'confirmed_by_customer',
      ...distributedDateFilter,
    });

    // KPI bonuslar (xarajat)
    const totalDistributed = kpiTransactions.reduce((sum, t) => {
      return (
        sum +
        (t.amounts.punkt || 0) +
        (t.amounts.viloyatAgent || 0) +
        (t.amounts.tumanAgent || 0) +
        (t.amounts.mfyAgent || 0) +
        (t.amounts.punktTransfer || 0) +
        (t.amounts.deliveryService || 0)
      );
    }, 0);

    // Moliya bo'limiga ajratilgan KPI bonus (ham xarajat)
    const totalFinanceKpi = kpiTransactions.reduce((sum, t) => sum + (t.amounts.finance || 0), 0);

    // Barcha KPI bonuslar (xarajat)
    const totalKpiExpenses = totalDistributed + totalFinanceKpi;

    // Contragent to'lovlari (to'langan)
    const contragentDateFilter = {};
    if (startDate || endDate) {
      contragentDateFilter.paidAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        contragentDateFilter.paidAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        contragentDateFilter.paidAt.$lte = end;
      }
    }

    const paidContragentPayments = await ContragentPaymentDistribution.find({
      status: 'paid',
      ...contragentDateFilter,
    });

    const totalContragentPayments = paidContragentPayments.reduce((sum, p) => sum + p.amount, 0);

    // Umumiy xarajatlar (KPI bonuslar + Contragent to'lovlari)
    const totalExpenses = totalKpiExpenses + totalContragentPayments;

    // Umumiy balans (Sof foyda) = Tushgan - Xarajatlar
    const totalBalance = totalReceived - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        // Daromadlar
        totalReceived, // Umumiy tushgan summa (mijozlardan real tushgan pul)
        
        // Xarajatlar
        totalKpiExpenses, // Barcha KPI bonuslar (xarajat)
        totalContragentPayments, // Contragent to'lovlari (tashqi xarajat)
        totalExpenses, // Umumiy xarajatlar (KPI bonuslar + Contragent to'lovlari)
        
        // Balans
        totalBalance, // Sof foyda = Tushgan - Xarajatlar
      },
    });
  } catch (error) {
    console.error('Error in getTotalBalance:', error);
    res.status(500).json({
      success: false,
      message: 'Umumiy balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  // Hisobotlar
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  getCustomReport,
  // Topshiruvlar
  getPendingSubmissions,
  confirmSubmission,
  rejectSubmission,
  // Transaksiyalar
  getAllTransactions,
  // Statistika
  getStatistics,
  getStatisticsByRegion,
  getStatisticsByDistrict,
  getStatisticsByMfy,
  getAgentPerformance,
  // Moliya balanslari
  getFinanceBalance,
  getTotalReceived,
  getTotalDistributed,
  getFinanceKpiAmount,
  getDeliveryServiceKpiAmount,
  getTotalBalance,
};

