const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');

// ==================== TO'LANGAN TO'LOVLAR ====================

// Contragent o'ziga qilingan to'langan to'lovlarni ko'rish
const getMyPaidPayments = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const filter = {
      contragent: contragentId,
      status: 'paid',
    };

    // Date filter for paidAt
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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get paid payments
    const payments = await ContragentPaymentDistribution.find(filter)
      .populate('paidBy', 'name phone')
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ContragentPaymentDistribution.countDocuments(filter);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAmount = await ContragentPaymentDistribution.aggregate([
      { $match: filter },
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
      totalPaidAmount: totalPaidAmount[0]?.total || 0,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getMyPaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'langan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LANMAGAN TO'LOVLAR ====================

// Contragent o'ziga qilingan to'lanmagan to'lovlarni ko'rish
const getMyUnpaidPayments = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { page = 1, limit = 50, isOverdue } = req.query;

    const filter = {
      contragent: contragentId,
      status: 'pending',
    };

    if (isOverdue === 'true') {
      filter.isOverdue = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get unpaid payments
    let payments = await ContragentPaymentDistribution.find(filter)
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Update isOverdue for all payments
    const now = new Date();
    for (const payment of payments) {
      if (payment.status === 'pending' && payment.dueDate && now > payment.dueDate) {
        payment.isOverdue = true;
        await payment.save();
      }
    }

    // Get total count
    const total = await ContragentPaymentDistribution.countDocuments(filter);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalUnpaidAmount = await ContragentPaymentDistribution.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Calculate overdue totals
    const overdueStats = await ContragentPaymentDistribution.aggregate([
      { $match: { ...filter, isOverdue: true } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
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
      overdue: {
        totalAmount: overdueStats[0]?.total || 0,
        count: overdueStats[0]?.count || 0,
      },
      data: payments,
    });
  } catch (error) {
    console.error('Error in getMyUnpaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LOVLAR STATISTIKASI ====================

// Contragent o'ziga qilingan to'lovlar statistikasini ko'rish
const getMyPaymentStatistics = async (req, res) => {
  try {
    const contragentId = req.user.userId;
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
    const unpaidStats = await ContragentPaymentDistribution.aggregate([
      { $match: { contragent: contragentId, status: 'pending' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total paid
    const paidFilter = { contragent: contragentId, status: 'paid', ...dateFilter };
    const paidStats = await ContragentPaymentDistribution.aggregate([
      { $match: paidFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Overdue stats
    const overdueStats = await ContragentPaymentDistribution.aggregate([
      { $match: { contragent: contragentId, status: 'pending', isOverdue: true } },
      {
        $group: {
          _id: null,
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
        overdue: {
          totalAmount: overdueStats[0]?.totalAmount || 0,
          count: overdueStats[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error in getMyPaymentStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovlar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== BITTA TO'LOVNI KO'RISH ====================

// Contragent bitta to'lovni ID bo'yicha ko'rish
const getMyPaymentById = async (req, res) => {
  try {
    const contragentId = req.user.userId;
    const { id } = req.params;

    const payment = await ContragentPaymentDistribution.findOne({
      _id: id,
      contragent: contragentId,
    })
      .populate('paidBy', 'name phone')
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt');

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
    console.error('Error in getMyPaymentById:', error);
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
};

