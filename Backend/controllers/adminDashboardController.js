const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Contragent = require('../models/Contragent');
const MarketplaceUser = require('../models/MarketplaceUser');
const Punkt = require('../models/Punkt');
const Agent = require('../models/Agent');
const Admin = require('../models/Admin');
const PaymentTransaction = require('../models/PaymentTransaction');
const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');
const FinanceSubmission = require('../models/FinanceSubmission');
const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const Review = require('../models/Review');
const Vacancy = require('../models/Vacancy');
const VacancyApplication = require('../models/VacancyApplication');

// ==================== UMUMIY STATISTIKALAR ====================

// Dashboard uchun to'liq statistikalar
const getDashboardStatistics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Parallel queries for better performance
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      yearOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      totalProducts,
      activeProducts,
      totalCategories,
      totalContragents,
      activeContragents,
      totalMarketplaceUsers,
      activeMarketplaceUsers,
      totalPunkts,
      activePunkts,
      totalAgents,
      activeAgents,
      totalAdmins,
      totalReviews,
      avgRating,
      totalVacancies,
      totalApplications,
      pendingPayments,
      paidPayments,
      totalKpiTransactions,
      paidKpiTransactions,
    ] = await Promise.all([
      // Orders
      Order.countDocuments({ status: 'confirmed_by_customer' }),
      Order.countDocuments({ status: 'confirmed_by_customer', createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ status: 'confirmed_by_customer', createdAt: { $gte: weekStart } }),
      Order.countDocuments({ status: 'confirmed_by_customer', createdAt: { $gte: monthStart } }),
      Order.countDocuments({ status: 'confirmed_by_customer', createdAt: { $gte: yearStart } }),

      // Revenue
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Products
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),

      // Categories
      Category.countDocuments(),

      // Contragents
      Contragent.countDocuments(),
      Contragent.countDocuments({ status: 'active' }),

      // Marketplace Users
      MarketplaceUser.countDocuments(),
      MarketplaceUser.countDocuments({ status: 'active' }),

      // Punkts
      Punkt.countDocuments(),
      Punkt.countDocuments({ status: 'active' }),

      // Agents
      Agent.countDocuments(),
      Agent.countDocuments({ status: 'active' }),

      // Admins
      Admin.countDocuments(),

      // Reviews
      Review.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),

      // Vacancies
      Vacancy.countDocuments(),
      VacancyApplication.countDocuments(),

      // Payments
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // KPI Transactions
      KpiBonusTransaction.countDocuments(),
      KpiBonusTransaction.countDocuments({ status: 'paid' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          year: yearOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0,
          week: weekRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0,
          year: yearRevenue[0]?.total || 0,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        categories: {
          total: totalCategories,
        },
        contragents: {
          total: totalContragents,
          active: activeContragents,
          inactive: totalContragents - activeContragents,
        },
        marketplaceUsers: {
          total: totalMarketplaceUsers,
          active: activeMarketplaceUsers,
          inactive: totalMarketplaceUsers - activeMarketplaceUsers,
        },
        punkts: {
          total: totalPunkts,
          active: activePunkts,
          inactive: totalPunkts - activePunkts,
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
          inactive: totalAgents - activeAgents,
        },
        admins: {
          total: totalAdmins,
        },
        reviews: {
          total: totalReviews,
          averageRating: Math.round((avgRating[0]?.avg || 0) * 10) / 10,
        },
        vacancies: {
          total: totalVacancies,
          applications: totalApplications,
        },
        payments: {
          pending: {
            amount: pendingPayments[0]?.total || 0,
            count: pendingPayments[0]?.count || 0,
          },
          paid: {
            amount: paidPayments[0]?.total || 0,
            count: paidPayments[0]?.count || 0,
          },
        },
        kpi: {
          totalTransactions: totalKpiTransactions,
          paidTransactions: paidKpiTransactions,
          unpaidTransactions: totalKpiTransactions - paidKpiTransactions,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== VAQT BO'YICHA STATISTIKALAR (CHARTLAR UCHUN) ====================

// Kunlik statistikalar (oxirgi 30 kun)
const getDailyStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysCount = parseInt(days);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysCount);

    // Generate date range
    const dateRange = [];
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      dateRange.push({
        date: date.toISOString().split('T')[0],
        start: date,
        end: nextDate,
      });
    }

    // Get orders and revenue by date
    const ordersByDate = await Order.aggregate([
      {
        $match: {
          status: 'confirmed_by_customer',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create map for quick lookup
    const ordersMap = {};
    ordersByDate.forEach((item) => {
      ordersMap[item._id] = {
        orders: item.orders,
        revenue: item.revenue,
      };
    });

    // Build response with all dates
    const data = dateRange.map(({ date }) => ({
      date,
      orders: ordersMap[date]?.orders || 0,
      revenue: ordersMap[date]?.revenue || 0,
    }));

    res.status(200).json({
      success: true,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        days: daysCount,
      },
      data,
    });
  } catch (error) {
    console.error('Error fetching daily statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Haftalik statistikalar (oxirgi 12 hafta)
const getWeeklyStatistics = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const weeksCount = parseInt(weeks);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - weeksCount * 7);

    // Get orders and revenue by week
    const ordersByWeek = await Order.aggregate([
      {
        $match: {
          status: 'confirmed_by_customer',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          startDate: { $min: '$createdAt' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const data = ordersByWeek.map((item) => ({
      year: item._id.year,
      week: item._id.week,
      weekLabel: `Hafta ${item._id.week}, ${item._id.year}`,
      orders: item.orders,
      revenue: item.revenue,
      startDate: item.startDate,
    }));

    res.status(200).json({
      success: true,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        weeks: weeksCount,
      },
      data,
    });
  } catch (error) {
    console.error('Error fetching weekly statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Haftalik statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Oylik statistikalar (oxirgi 12 oy)
const getMonthlyStatistics = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const monthsCount = parseInt(months);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - monthsCount);

    // Get orders and revenue by month
    const ordersByMonth = await Order.aggregate([
      {
        $match: {
          status: 'confirmed_by_customer',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
    ];

    const data = ordersByMonth.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      monthLabel: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      orders: item.orders,
      revenue: item.revenue,
    }));

    res.status(200).json({
      success: true,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        months: monthsCount,
      },
      data,
    });
  } catch (error) {
    console.error('Error fetching monthly statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Oylik statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== BUYURTMALAR STATISTIKASI ====================

// Buyurtmalar statistikasi
const getOrdersStatistics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      statusStats,
      todayStats,
      weekStats,
      monthStats,
      avgOrderValue,
      topProducts,
    ] = await Promise.all([
      // Status statistics
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
      ]),

      // Today statistics
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            avgValue: { $avg: '$totalPrice' },
          },
        },
      ]),

      // Week statistics
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: weekStart },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            avgValue: { $avg: '$totalPrice' },
          },
        },
      ]),

      // Month statistics
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            avgValue: { $avg: '$totalPrice' },
          },
        },
      ]),

      // Average order value
      Order.aggregate([
        {
          $match: { status: 'confirmed_by_customer' },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$totalPrice' },
          },
        },
      ]),

      // Top products by order count
      Order.aggregate([
        {
          $match: { status: 'confirmed_by_customer' },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            count: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            productName: '$product.name',
            count: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: statusStats.map((item) => ({
          status: item._id,
          count: item.count,
          revenue: item.totalRevenue,
        })),
        today: todayStats[0] || { count: 0, totalRevenue: 0, avgValue: 0 },
        week: weekStats[0] || { count: 0, totalRevenue: 0, avgValue: 0 },
        month: monthStats[0] || { count: 0, totalRevenue: 0, avgValue: 0 },
        averageOrderValue: Math.round(avgOrderValue[0]?.avg || 0),
        topProducts: topProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching orders statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Buyurtmalar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MOLIYAVIY STATISTIKALAR ====================

// Moliyaviy statistikalar
const getFinanceStatistics = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalReceived,
      monthReceived,
      yearReceived,
      totalKpiExpenses,
      monthKpiExpenses,
      yearKpiExpenses,
      totalContragentPayments,
      monthContragentPayments,
      yearContragentPayments,
      pendingContragentPayments,
      financeSubmissions,
    ] = await Promise.all([
      // Total received (from confirmed orders)
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Month received
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Year received
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer', createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Total KPI expenses
      KpiBonusTransaction.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Month KPI expenses
      KpiBonusTransaction.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Year KPI expenses
      KpiBonusTransaction.aggregate([
        { $match: { createdAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total contragent payments
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Month contragent payments
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Year contragent payments
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Pending contragent payments
      ContragentPaymentDistribution.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Finance submissions
      FinanceSubmission.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalReceivedAmount = totalReceived[0]?.total || 0;
    const totalKpiAmount = totalKpiExpenses[0]?.total || 0;
    const totalContragentAmount = totalContragentPayments[0]?.total || 0;
    const totalExpenses = totalKpiAmount + totalContragentAmount;
    const netProfit = totalReceivedAmount - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        income: {
          total: totalReceivedAmount,
          month: monthReceived[0]?.total || 0,
          year: yearReceived[0]?.total || 0,
        },
        expenses: {
          total: totalExpenses,
          kpi: {
            total: totalKpiAmount,
            month: monthKpiExpenses[0]?.total || 0,
            year: yearKpiExpenses[0]?.total || 0,
          },
          contragent: {
            total: totalContragentAmount,
            month: monthContragentPayments[0]?.total || 0,
            year: yearContragentPayments[0]?.total || 0,
            count: totalContragentPayments[0]?.count || 0,
          },
        },
        pending: {
          contragentPayments: {
            amount: pendingContragentPayments[0]?.total || 0,
            count: pendingContragentPayments[0]?.count || 0,
          },
        },
        netProfit: {
          total: netProfit,
          month: (monthReceived[0]?.total || 0) - (monthKpiExpenses[0]?.total || 0) - (monthContragentPayments[0]?.total || 0),
          year: (yearReceived[0]?.total || 0) - (yearKpiExpenses[0]?.total || 0) - (yearContragentPayments[0]?.total || 0),
        },
        financeSubmissions: {
          totalAmount: financeSubmissions[0]?.totalAmount || 0,
          count: financeSubmissions[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching finance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Moliyaviy statistikani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== FOYDALANUVCHILAR STATISTIKASI ====================

// Foydalanuvchilar statistikasi
const getUsersStatistics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      marketplaceUsersByStatus,
      marketplaceUsersByPeriod,
      contragentsByStatus,
      contragentsByPeriod,
      punktsByStatus,
      punktsByPeriod,
      agentsByStatus,
      agentsByPeriod,
      agentsByType,
    ] = await Promise.all([
      // Marketplace users by status
      MarketplaceUser.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Marketplace users by period
      MarketplaceUser.aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: todayStart } } },
              { $count: 'count' },
            ],
            week: [
              { $match: { createdAt: { $gte: weekStart } } },
              { $count: 'count' },
            ],
            month: [
              { $match: { createdAt: { $gte: monthStart } } },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // Contragents by status
      Contragent.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Contragents by period
      Contragent.aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: todayStart } } },
              { $count: 'count' },
            ],
            week: [
              { $match: { createdAt: { $gte: weekStart } } },
              { $count: 'count' },
            ],
            month: [
              { $match: { createdAt: { $gte: monthStart } } },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // Punkts by status
      Punkt.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Punkts by period
      Punkt.aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: todayStart } } },
              { $count: 'count' },
            ],
            week: [
              { $match: { createdAt: { $gte: weekStart } } },
              { $count: 'count' },
            ],
            month: [
              { $match: { createdAt: { $gte: monthStart } } },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // Agents by status
      Agent.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Agents by period
      Agent.aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: todayStart } } },
              { $count: 'count' },
            ],
            week: [
              { $match: { createdAt: { $gte: weekStart } } },
              { $count: 'count' },
            ],
            month: [
              { $match: { createdAt: { $gte: monthStart } } },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // Agents by type
      Agent.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $ifNull: ['$mfy', false] },
                'mfy',
                { $cond: [{ $ifNull: ['$tuman', false] }, 'tuman', 'viloyat'] },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        marketplaceUsers: {
          byStatus: marketplaceUsersByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
          byPeriod: {
            today: marketplaceUsersByPeriod[0]?.today[0]?.count || 0,
            week: marketplaceUsersByPeriod[0]?.week[0]?.count || 0,
            month: marketplaceUsersByPeriod[0]?.month[0]?.count || 0,
          },
        },
        contragents: {
          byStatus: contragentsByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
          byPeriod: {
            today: contragentsByPeriod[0]?.today[0]?.count || 0,
            week: contragentsByPeriod[0]?.week[0]?.count || 0,
            month: contragentsByPeriod[0]?.month[0]?.count || 0,
          },
        },
        punkts: {
          byStatus: punktsByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
          byPeriod: {
            today: punktsByPeriod[0]?.today[0]?.count || 0,
            week: punktsByPeriod[0]?.week[0]?.count || 0,
            month: punktsByPeriod[0]?.month[0]?.count || 0,
          },
        },
        agents: {
          byStatus: agentsByStatus.map((item) => ({
            status: item._id,
            count: item.count,
          })),
          byPeriod: {
            today: agentsByPeriod[0]?.today[0]?.count || 0,
            week: agentsByPeriod[0]?.week[0]?.count || 0,
            month: agentsByPeriod[0]?.month[0]?.count || 0,
          },
          byType: agentsByType.map((item) => ({
            type: item._id,
            count: item.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchilar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAHSULOTLAR STATISTIKASI ====================

// Mahsulotlar statistikasi
const getProductsStatistics = async (req, res) => {
  try {
    const [
      productsByStatus,
      productsByCategory,
      topProducts,
      recentProducts,
    ] = await Promise.all([
      // Products by status
      Product.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Products by category
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            categoryId: '$_id',
            categoryName: '$category.name',
            count: 1,
          },
        },
      ]),

      // Top products by order count
      Order.aggregate([
        { $match: { status: 'confirmed_by_customer' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            orderCount: { $sum: 1 },
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: '$_id',
            productName: '$product.name',
            orderCount: 1,
            quantitySold: 1,
            revenue: 1,
          },
        },
      ]),

      // Recent products
      Product.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name status price createdAt')
        .populate('category', 'name'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: productsByStatus.map((item) => ({
          status: item._id,
          count: item.count,
        })),
        byCategory: productsByCategory,
        topProducts: topProducts,
        recentProducts: recentProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching products statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Mahsulotlar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStatistics,
  getDailyStatistics,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getOrdersStatistics,
  getFinanceStatistics,
  getUsersStatistics,
  getProductsStatistics,
};




