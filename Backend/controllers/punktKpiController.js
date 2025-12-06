const KpiBonusTransaction = require('../models/KpiBonusTransaction');

const CUSTOMER_CONFIRMED_STATUS = 'confirmed_by_customer';

const buildPunktBaseFilter = (punktId) => ({
  orderStatus: CUSTOMER_CONFIRMED_STATUS,
  $or: [
    { 'recipients.punkt': punktId },
    { 'recipients.fromPunkt': punktId },
    { 'recipients.toPunkt': punktId },
  ],
});

const calculatePunktAmountForTransaction = (transaction, punktId) => {
  const punktIdStr = punktId.toString();
  let amount = 0;

  if (
    transaction.recipients.punkt &&
    transaction.recipients.punkt.toString() === punktIdStr
  ) {
    amount += transaction.amounts.punkt || 0;
  }

  if (
    transaction.recipients.fromPunkt &&
    transaction.recipients.fromPunkt.toString() === punktIdStr
  ) {
    amount += transaction.recipients.fromPunktAmount || 0;
  }

  if (
    transaction.recipients.toPunkt &&
    transaction.recipients.toPunkt.toString() === punktIdStr
  ) {
    amount += transaction.recipients.toPunktAmount || 0;
  }

  return amount;
};

const aggregatePunktTotals = (transactions, punktId) => {
  const totals = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    paidTransactions: 0,
    unpaidTransactions: 0,
  };

  transactions.forEach((transaction) => {
    const punktAmount = calculatePunktAmountForTransaction(
      transaction,
      punktId
    );

    if (punktAmount <= 0) {
      return;
    }

    totals.totalAmount += punktAmount;

    if (transaction.isPaid) {
      totals.paidAmount += punktAmount;
      totals.paidTransactions += 1;
    } else {
      totals.unpaidAmount += punktAmount;
      totals.unpaidTransactions += 1;
    }
  });

  return totals;
};

const getDayRange = (date) => {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const startOfDay = new Date(targetDate);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay, label: startOfDay.toISOString().slice(0, 10) };
};

const getReportRange = (startDate, endDate) => {
  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (start && !Number.isNaN(start.getTime())) {
    start.setHours(0, 0, 0, 0);
  } else {
    start = null;
  }

  if (end && !Number.isNaN(end.getTime())) {
    end.setHours(23, 59, 59, 999);
  } else {
    end = null;
  }

  if (start && !end) {
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  }

  if (!start && end) {
    start = new Date(end);
    start.setHours(0, 0, 0, 0);
  }

  if (!start || !end) {
    const defaultEnd = new Date();
    defaultEnd.setHours(23, 59, 59, 999);
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - 6);
    defaultStart.setHours(0, 0, 0, 0);
    return { start: defaultStart, end: defaultEnd };
  }

  return { start, end };
};

// Get punkt's KPI bonus summary
const getMyKpiSummary = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { startDate, endDate, isPaid } = req.query;

    const filter = buildPunktBaseFilter(punkt._id);

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === 'true';
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Get all transactions for this punkt
    const transactions = await KpiBonusTransaction.find(filter);

    const totals = aggregatePunktTotals(transactions, punkt._id);

    res.status(200).json({
      success: true,
      data: {
        punkt: {
          _id: punkt._id,
          name: punkt.name,
          phone: punkt.phone,
        },
        summary: {
          totalTransactions: totals.totalTransactions,
          totalAmount: totals.totalAmount,
          paidAmount: totals.paidAmount,
          unpaidAmount: totals.unpaidAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching punkt KPI summary:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus ma\'lumotlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkt's KPI transactions
const getMyKpiTransactions = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { startDate, endDate, isPaid, page = 1, limit = 50 } = req.query;

    const filter = buildPunktBaseFilter(punkt._id);

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === 'true';
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KpiBonusTransaction.countDocuments(filter);

    const transactions = await KpiBonusTransaction.find(filter)
      .populate('order', 'orderNumber status totalPrice')
      .populate('orderItem.product', 'name price productCode')
      .populate('distributionConfig', 'name')
      .populate('recipients.fromPunkt', 'name phone')
      .populate('recipients.toPunkt', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Add punkt-specific amount to each transaction
    const transactionsWithAmount = transactions.map((transaction) => {
      const transactionObj = transaction.toObject();
      let punktAmount = 0;
      let bonusType = '';

      // Regular punkt bonus
      if (
        transaction.recipients.punkt &&
        transaction.recipients.punkt.toString() === punkt._id.toString()
      ) {
        punktAmount += transaction.amounts.punkt || 0;
        bonusType = 'regular';
      }

      // From punkt transfer bonus
      if (
        transaction.recipients.fromPunkt &&
        transaction.recipients.fromPunkt.toString() === punkt._id.toString()
      ) {
        punktAmount += transaction.recipients.fromPunktAmount || 0;
        bonusType = 'from_punkt';
      }

      // To punkt transfer bonus
      if (
        transaction.recipients.toPunkt &&
        transaction.recipients.toPunkt.toString() === punkt._id.toString()
      ) {
        punktAmount += transaction.recipients.toPunktAmount || 0;
        bonusType = 'to_punkt';
      }

      transactionObj.punktAmount = punktAmount;
      transactionObj.bonusType = bonusType;
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
    console.error('Error fetching punkt KPI transactions:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus transaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkt's daily balance
const getMyKpiDailyBalance = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { date } = req.query;

    const { startOfDay, endOfDay, label } = getDayRange(date);
    const filter = buildPunktBaseFilter(punkt._id);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };

    const transactions = await KpiBonusTransaction.find(filter).select(
      'amounts recipients isPaid createdAt'
    );

    const totals = aggregatePunktTotals(transactions, punkt._id);

    res.status(200).json({
      success: true,
      data: {
        date: label,
        totals,
      },
    });
  } catch (error) {
    console.error('Error fetching punkt daily KPI balance:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik punkt balansini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get punkt daily report
const getMyKpiDailyReport = async (req, res) => {
  try {
    const { punkt } = req.user;
    const { startDate, endDate } = req.query;

    const { start, end } = getReportRange(startDate, endDate);
    const filter = buildPunktBaseFilter(punkt._id);
    filter.createdAt = { $gte: start, $lte: end };

    const transactions = await KpiBonusTransaction.find(filter).select(
      'amounts recipients isPaid createdAt'
    );

    const reportMap = {};

    transactions.forEach((transaction) => {
      const punktAmount = calculatePunktAmountForTransaction(
        transaction,
        punkt._id
      );

      if (punktAmount <= 0) {
        return;
      }

      const dateKey = transaction.createdAt
        .toISOString()
        .slice(0, 10);

      if (!reportMap[dateKey]) {
        reportMap[dateKey] = {
          date: dateKey,
          totalTransactions: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          paidTransactions: 0,
          unpaidTransactions: 0,
        };
      }

      reportMap[dateKey].totalTransactions += 1;
      reportMap[dateKey].totalAmount += punktAmount;

      if (transaction.isPaid) {
        reportMap[dateKey].paidAmount += punktAmount;
        reportMap[dateKey].paidTransactions += 1;
      } else {
        reportMap[dateKey].unpaidAmount += punktAmount;
        reportMap[dateKey].unpaidTransactions += 1;
      }
    });

    const report = Object.values(reportMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.status(200).json({
      success: true,
      data: {
        range: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        report,
      },
    });
  } catch (error) {
    console.error('Error fetching punkt KPI daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik punkt KPI hisobotini olishda xatolik yuz berdi',
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
