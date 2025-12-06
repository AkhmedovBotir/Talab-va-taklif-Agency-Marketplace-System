const KpiBonusTransaction = require('../models/KpiBonusTransaction');

const CUSTOMER_CONFIRMED_STATUS = 'confirmed_by_customer';

const getAgentAmountField = (role) => {
  if (role === 'mfy') return '$amounts.mfyAgent';
  if (role === 'tuman') return '$amounts.tumanAgent';
  return '$amounts.viloyatAgent';
};

const getAgentAmountExpression = (role) => ({
  $ifNull: [getAgentAmountField(role), 0],
});

const buildAgentBaseFilter = (agentId, role) => {
  const filter = { orderStatus: CUSTOMER_CONFIRMED_STATUS };

  if (role === 'mfy') {
    filter['recipients.mfyAgent'] = agentId;
  } else if (role === 'tuman') {
    filter['recipients.tumanAgent'] = agentId;
  } else {
    filter['recipients.viloyatAgent'] = agentId;
  }

  return filter;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const parseDateRange = (startDate, endDate) => {
  let start = null;
  let end = null;

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (isValidDate(parsedStart)) {
      parsedStart.setHours(0, 0, 0, 0);
      start = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (isValidDate(parsedEnd)) {
      parsedEnd.setHours(23, 59, 59, 999);
      end = parsedEnd;
    }
  }

  if (start && !end) {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  if (!start && end) {
    const derivedStart = new Date(end);
    derivedStart.setDate(derivedStart.getDate() - 6);
    derivedStart.setHours(0, 0, 0, 0);
    start = derivedStart;
  }

  if (!start || !end) {
    return null;
  }

  return { $gte: start, $lte: end };
};

const getDayRange = (date) => {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const startOfDay = new Date(targetDate);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay, label: startOfDay.toISOString().slice(0, 10) };
};

const getDefaultReportRange = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

// Get agent's KPI bonus summary
const getMyKpiSummary = async (req, res) => {
  try {
    const { agent, role } = req.user;
    const { startDate, endDate, isPaid } = req.query;

    const filter = buildAgentBaseFilter(agent._id, role);

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === 'true';
    }

    const rangeFilter = parseDateRange(startDate, endDate);
    if (rangeFilter) {
      filter.createdAt = rangeFilter;
    }

    const amountExpr = getAgentAmountExpression(role);

    // Get total amounts
    const summary = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: amountExpr },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
          unpaidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', false] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = summary[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        agent: {
          _id: agent._id,
          name: agent.name,
          phone: agent.phone,
          role,
        },
        summary: result,
      },
    });
  } catch (error) {
    console.error('Error fetching agent KPI summary:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus ma\'lumotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agent's KPI transactions
const getMyKpiTransactions = async (req, res) => {
  try {
    const { agent, role } = req.user;
    const { startDate, endDate, isPaid, page = 1, limit = 50 } = req.query;

    const filter = buildAgentBaseFilter(agent._id, role);

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === 'true';
    }

    const rangeFilter = parseDateRange(startDate, endDate);
    if (rangeFilter) {
      filter.createdAt = rangeFilter;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KpiBonusTransaction.countDocuments(filter);

    const transactions = await KpiBonusTransaction.find(filter)
      .populate('order', 'orderNumber status totalPrice')
      .populate('orderItem.product', 'name price productCode')
      .populate('distributionConfig', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Add agent-specific amount to each transaction
    const transactionsWithAmount = transactions.map((transaction) => {
      const transactionObj = transaction.toObject();
      let agentAmount = 0;

      if (role === 'mfy') {
        agentAmount = transaction.amounts.mfyAgent || 0;
      } else if (role === 'tuman') {
        agentAmount = transaction.amounts.tumanAgent || 0;
      } else if (role === 'viloyat') {
        agentAmount = transaction.amounts.viloyatAgent || 0;
      }

      transactionObj.agentAmount = agentAmount;
      return transactionObj;
    });

    res.status(200).json({
      success: true,
      count: transactionsWithAmount.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: transactionsWithAmount,
    });
  } catch (error) {
    console.error('Error fetching agent KPI transactions:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus transaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agent's daily KPI balance (00:00 - 23:59)
const getMyKpiDailyBalance = async (req, res) => {
  try {
    const { agent, role } = req.user;
    const { date } = req.query;

    const { startOfDay, endOfDay, label } = getDayRange(date);
    const filter = buildAgentBaseFilter(agent._id, role);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };

    const summary = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: getAgentAmountExpression(role) },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
          unpaidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', false] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
          paidTransactions: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', true] }, 1, 0],
            },
          },
          unpaidTransactions: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', false] }, 1, 0],
            },
          },
        },
      },
    ]);

    const totals = summary[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidTransactions: 0,
      unpaidTransactions: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        date: label,
        totals,
      },
    });
  } catch (error) {
    console.error('Error fetching agent daily KPI balance:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik balansni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agent's daily KPI report (aggregated by day)
const getMyKpiDailyReport = async (req, res) => {
  try {
    const { agent, role } = req.user;
    const { startDate, endDate } = req.query;

    const filter = buildAgentBaseFilter(agent._id, role);

    let rangeFilter = parseDateRange(startDate, endDate);
    if (!rangeFilter) {
      const defaultRange = getDefaultReportRange();
      rangeFilter = { $gte: defaultRange.start, $lte: defaultRange.end };
    }
    filter.createdAt = rangeFilter;

    const report = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: getAgentAmountExpression(role) },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
          unpaidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', false] },
                getAgentAmountExpression(role),
                0,
              ],
            },
          },
          paidTransactions: {
            $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] },
          },
          unpaidTransactions: {
            $sum: { $cond: [{ $eq: ['$isPaid', false] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        range: {
          startDate: rangeFilter.$gte.toISOString(),
          endDate: rangeFilter.$lte.toISOString(),
        },
        report: report.map((item) => ({
          date: item._id,
          totalTransactions: item.totalTransactions,
          totalAmount: item.totalAmount,
          paidAmount: item.paidAmount,
          unpaidAmount: item.unpaidAmount,
          paidTransactions: item.paidTransactions,
          unpaidTransactions: item.unpaidTransactions,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching agent KPI daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik KPI hisobotini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMyKpiSummary,
  getMyKpiTransactions,
  getMyKpiDailyBalance,
  getMyKpiDailyReport,
};

