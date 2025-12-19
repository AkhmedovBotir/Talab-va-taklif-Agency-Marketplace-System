const Order = require('../models/Order');
const ContragentPaymentDistribution = require('../models/ContragentPaymentDistribution');
const Contragent = require('../models/Contragent');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// ==================== TO'LANMAGAN TO'LOVLAR RO'YXATI ====================

// Barcha to'lanmagan Contragent to'lovlarini olish
const getUnpaidPayments = async (req, res) => {
  try {
    const { contragentId, viloyatId, tumanId, mfyId, isOverdue, page = 1, limit = 50 } = req.query;

    const filter = {
      status: 'pending',
    };

    if (contragentId) {
      filter.contragent = contragentId;
    }

    if (isOverdue === 'true') {
      filter.isOverdue = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get unpaid payments
    let payments = await ContragentPaymentDistribution.find(filter)
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
          {
            path: 'mfy',
            select: 'name type code',
          },
        ],
      })
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by region if needed
    if (viloyatId || tumanId || mfyId) {
      payments = payments.filter((payment) => {
        const contragent = payment.contragent;
        if (!contragent) return false;

        if (mfyId && contragent.mfy) {
          return contragent.mfy._id.toString() === mfyId.toString();
        }
        if (tumanId && contragent.tuman) {
          return contragent.tuman._id.toString() === tumanId.toString();
        }
        if (viloyatId && contragent.viloyat) {
          return contragent.viloyat._id.toString() === viloyatId.toString();
        }
        return false;
      });
    }

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
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Calculate overdue totals
    const overdueStats = await ContragentPaymentDistribution.aggregate([
      { $match: { status: 'pending', isOverdue: true } },
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
    console.error('Error in getUnpaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// To'lanmagan to'lovlarni guruhlab olish (contragent bo'yicha)
const getUnpaidPaymentsGrouped = async (req, res) => {
  try {
    const { isOverdue } = req.query;

    const matchFilter = {
      status: 'pending',
    };

    if (isOverdue === 'true') {
      matchFilter.isOverdue = true;
    }

    // Group by contragent
    const grouped = await ContragentPaymentDistribution.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$contragent',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          earliestDueDate: { $min: '$dueDate' },
          latestDueDate: { $max: '$dueDate' },
          hasOverdue: { $max: { $cond: ['$isOverdue', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'contragents',
          localField: '_id',
          foreignField: '_id',
          as: 'contragent',
        },
      },
      { $unwind: '$contragent' },
      {
        $lookup: {
          from: 'regions',
          localField: 'contragent.viloyat',
          foreignField: '_id',
          as: 'viloyat',
        },
      },
      { $unwind: { path: '$viloyat', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'regions',
          localField: 'contragent.tuman',
          foreignField: '_id',
          as: 'tuman',
        },
      },
      { $unwind: { path: '$tuman', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'regions',
          localField: 'contragent.mfy',
          foreignField: '_id',
          as: 'mfy',
        },
      },
      { $unwind: { path: '$mfy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          contragent: {
            _id: '$contragent._id',
            name: '$contragent.name',
            inn: '$contragent.inn',
            phone: '$contragent.phone',
            viloyat: {
              _id: '$viloyat._id',
              name: '$viloyat.name',
              type: '$viloyat.type',
              code: '$viloyat.code',
            },
            tuman: {
              _id: '$tuman._id',
              name: '$tuman.name',
              type: '$tuman.type',
              code: '$tuman.code',
            },
            mfy: {
              _id: '$mfy._id',
              name: '$mfy.name',
              type: '$mfy.type',
              code: '$mfy.code',
            },
          },
          totalAmount: 1,
          count: 1,
          earliestDueDate: 1,
          latestDueDate: 1,
          hasOverdue: { $eq: ['$hasOverdue', 1] },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: grouped.length,
      data: grouped,
    });
  } catch (error) {
    console.error('Error in getUnpaidPaymentsGrouped:', error);
    res.status(500).json({
      success: false,
      message: 'Guruhlangan to\'lanmagan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LOVNI TASDIQLASH ====================

// Bir yoki bir nechta to'lovlarni "to'landi" deb belgilash
const markPaymentsAsPaid = async (req, res) => {
  try {
    const { paymentIds, notes } = req.body;
    const admin = req.user.admin;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'To\'lov ID lari kiritilishi shart',
      });
    }

    // Check if all payments exist and are pending
    const payments = await ContragentPaymentDistribution.find({
      _id: { $in: paymentIds },
      status: 'pending',
    });

    if (payments.length !== paymentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Ba\'zi to\'lovlar topilmadi yoki allaqachon to\'langan',
      });
    }

    // Update payments
    const now = new Date();
    await ContragentPaymentDistribution.updateMany(
      { _id: { $in: paymentIds } },
      {
        $set: {
          status: 'paid',
          paidAt: now,
          paidBy: admin._id,
          notes: notes || null,
          isOverdue: false,
        },
      }
    );

    // Get updated payments with full details
    const updatedPayments = await ContragentPaymentDistribution.find({
      _id: { $in: paymentIds },
    })
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
          {
            path: 'mfy',
            select: 'name type code',
          },
        ],
      })
      .populate('paidBy', 'name phone')
      .populate('orders', 'orderNumber totalPrice totalKpiPrice createdAt');

    // Send notifications to contragents
    let io = null;
    try {
      io = getIO();
    } catch (error) {
      console.warn('Socket.io not initialized, notifications will be saved but not sent via socket');
    }

    const notifications = [];

    for (const payment of updatedPayments) {
      if (!payment.contragent) continue;

      // Format amount
      const formattedAmount = payment.amount.toLocaleString('uz-UZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      // Get contragent name
      const contragentName = payment.contragent.name || 'Noma\'lum';

      // Format date
      const formattedDate = now.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Create notification
      try {
        const notification = new Notification({
          targetType: 'contragents',
          targetId: payment.contragent._id,
          type: 'payment_received',
          title: 'To\'lov qabul qilindi',
          message: `Sizga ${formattedAmount} so'm to'lov ${formattedDate} sanasida to'landi.`,
          data: {
            paymentId: payment._id,
            amount: payment.amount,
            paidAt: now,
          },
        });

        await notification.save();
        notifications.push(notification);

        // Send via socket if available
        if (io) {
          io.to(`contragent_${payment.contragent._id}`).emit('notification', notification);
        }
      } catch (error) {
        console.error('Error creating notification for payment:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: `${payments.length} ta to'lov muvaffaqiyatli to'landi deb belgilandi`,
      count: updatedPayments.length,
      data: updatedPayments,
      notifications: notifications.length,
    });
  } catch (error) {
    console.error('Error in markPaymentsAsPaid:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovlarni tasdiqlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LOVLAR STATISTIKASI ====================

// To'lovlar statistikasini olish
const getPaymentStatistics = async (req, res) => {
  try {
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
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total paid
    const paidFilter = { status: 'paid', ...dateFilter };
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
      { $match: { status: 'pending', isOverdue: true } },
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
    console.error('Error in getPaymentStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lovlar statistikasini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== TO'LANGAN TO'LOVLAR ====================

// To'langan to'lovlarni olish
const getPaidPayments = async (req, res) => {
  try {
    const { contragentId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {
      status: 'paid',
    };

    if (contragentId) {
      filter.contragent = contragentId;
    }

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
      .populate({
        path: 'contragent',
        select: 'name inn phone viloyat tuman mfy',
        populate: [
          {
            path: 'viloyat',
            select: 'name type code',
          },
          {
            path: 'tuman',
            select: 'name type code',
          },
          {
            path: 'mfy',
            select: 'name type code',
          },
        ],
      })
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
    console.error('Error in getPaidPayments:', error);
    res.status(500).json({
      success: false,
      message: 'To\'langan to\'lovlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== CONTRAGENT TO'LOVLARINI YARATISH (SYNC) ====================

// Buyurtmalardan contragent to'lovlarini yaratish/yangilash
const syncContragentPayments = async (req, res) => {
  try {
    const { dueDateDays = 7 } = req.body; // Default 7 kun

    if (!dueDateDays || dueDateDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'To\'lov muddati (kunlar) kiritilishi shart va 1 dan katta bo\'lishi kerak',
      });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDateDays));

    // Get all orders that are confirmed by customer
    // We need to find orders where contragent has delivered items
    // First, get all confirmed orders
    const allConfirmedOrders = await Order.find({
      status: 'confirmed_by_customer',
    })
      .populate('items.product', 'contragent')
      .populate('contragentRequests.contragentId');

    // Filter orders that have at least one delivered contragent request
    const orders = allConfirmedOrders.filter((order) => {
      if (!order.contragentRequests || order.contragentRequests.length === 0) {
        return false;
      }
      return order.contragentRequests.some((req) => req.status === 'delivered_to_punkt');
    });

    const createdPayments = [];
    const updatedPayments = [];
    const processedOrderIds = new Set();
    const debugInfo = {
      ordersWithNoItems: 0,
      ordersWithNoContragent: 0,
      ordersWithNoDeliveredRequest: 0,
      itemsProcessed: 0,
      itemsSkipped: 0,
      paymentsSkippedZeroAmount: 0,
      contragentPayments: [],
    };

    // Process each order
    for (const order of orders) {
      // Group items by contragent
      const contragentItems = new Map();

      if (!order.items || order.items.length === 0) {
        debugInfo.ordersWithNoItems++;
        continue;
      }

      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        if (!item.product) {
          debugInfo.itemsSkipped++;
          continue;
        }

        // Check if product is populated with contragent
        let productContragent = null;
        if (typeof item.product === 'object' && item.product.contragent) {
          productContragent = item.product.contragent;
        } else if (typeof item.product === 'object' && item.product._id) {
          // Product is populated but contragent is not, need to populate
          const Product = require('../models/Product');
          const productDoc = await Product.findById(item.product._id).select('contragent');
          if (productDoc && productDoc.contragent) {
            productContragent = productDoc.contragent;
          }
        }
        
        if (!productContragent) {
          debugInfo.itemsSkipped++;
          continue;
        }

        const contragentId = productContragent.toString();

        // Check if this item is in a delivered contragent request
        const deliveredRequest = order.contragentRequests.find(
          (req) => {
            const reqContragentId = req.contragentId?._id?.toString() || req.contragentId?.toString() || req.contragentId;
            return reqContragentId === contragentId && req.status === 'delivered_to_punkt';
          }
        );

        if (!deliveredRequest) {
          debugInfo.itemsSkipped++;
          continue;
        }

        // Check if item index is in the request (if itemIds specified)
        if (deliveredRequest.itemIds && Array.isArray(deliveredRequest.itemIds) && deliveredRequest.itemIds.length > 0) {
          if (!deliveredRequest.itemIds.includes(i)) {
            debugInfo.itemsSkipped++;
            continue;
          }
        }
        // If no itemIds specified (old data), include all items from this contragent (backward compatibility)

        if (!contragentItems.has(contragentId)) {
          contragentItems.set(contragentId, {
            contragentId,
            items: [],
            totalPrice: 0,
            totalKpiPrice: 0,
          });
        }

        const contragentData = contragentItems.get(contragentId);
        // Item total price (mijozdan olingan summa)
        const itemTotalPrice = item.price * item.quantity;
        // Item KPI price (to'g'ri formula: (price - originalPrice) * quantity * kpiBonusPercent / 100)
        const profitPerUnit = item.price - item.originalPrice;
        const itemKpiPrice = (profitPerUnit * item.quantity * item.kpiBonusPercent) / 100;

        contragentData.items.push(i);
        contragentData.totalPrice += itemTotalPrice;
        contragentData.totalKpiPrice += itemKpiPrice;
        debugInfo.itemsProcessed++;
      }

      if (contragentItems.size === 0) {
        debugInfo.ordersWithNoContragent++;
        continue;
      }

      // Create or update payment for each contragent
      for (const [contragentId, data] of contragentItems) {
        // Calculate payment amount (totalPrice - totalKpiPrice)
        const paymentAmount = data.totalPrice - data.totalKpiPrice;

        if (paymentAmount <= 0) {
          debugInfo.paymentsSkippedZeroAmount++;
          debugInfo.contragentPayments.push({
            contragentId,
            totalPrice: data.totalPrice,
            totalKpiPrice: data.totalKpiPrice,
            paymentAmount,
            reason: 'paymentAmount <= 0',
          });
          continue;
        }

        // Check if payment already exists for this contragent (pending status)
        // Compare dueDate by date only (ignore time)
        const dueDateStart = new Date(dueDate);
        dueDateStart.setHours(0, 0, 0, 0);
        const dueDateEnd = new Date(dueDate);
        dueDateEnd.setHours(23, 59, 59, 999);
        
        const existingPayment = await ContragentPaymentDistribution.findOne({
          contragent: contragentId,
          status: 'pending',
          dueDate: {
            $gte: dueDateStart,
            $lte: dueDateEnd,
          },
        });

        if (existingPayment) {
          // Add order if not already in the array
          if (!existingPayment.orders.includes(order._id)) {
            existingPayment.orders.push(order._id);
          }
          // Update amount (add to existing)
          existingPayment.amount += paymentAmount;
          await existingPayment.save();
          if (!updatedPayments.includes(existingPayment._id.toString())) {
            updatedPayments.push(existingPayment._id);
          }
        } else {
          // Create new payment
          const newPayment = new ContragentPaymentDistribution({
            contragent: contragentId,
            amount: paymentAmount,
            status: 'pending',
            orders: [order._id],
            dueDate: dueDate,
          });

          await newPayment.save();
          createdPayments.push(newPayment._id);
        }

        processedOrderIds.add(order._id.toString());
      }
    }

    res.status(200).json({
      success: true,
      message: `Contragent to'lovlari muvaffaqiyatli yaratildi/yangilandi`,
      data: {
        dueDate: dueDate,
        dueDateDays: parseInt(dueDateDays),
        foundOrders: allConfirmedOrders.length,
        filteredOrders: orders.length,
        createdPayments: createdPayments.length,
        updatedPayments: updatedPayments.length,
        processedOrders: processedOrderIds.size,
        createdPaymentIds: createdPayments,
        updatedPaymentIds: updatedPayments,
        debug: debugInfo,
      },
    });
  } catch (error) {
    console.error('Error in syncContragentPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Contragent to\'lovlarini sinxronlashtirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getUnpaidPayments,
  getUnpaidPaymentsGrouped,
  markPaymentsAsPaid,
  getPaymentStatistics,
  getPaidPayments,
  syncContragentPayments,
};

