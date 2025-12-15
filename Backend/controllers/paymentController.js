const PaymentTransaction = require('../models/PaymentTransaction');
const Order = require('../models/Order');

// Foydalanuvchi to'lov qilish
const payOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    // Buyurtmani topish
    const order = await Order.findById(orderId).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Foydalanuvchi o'z buyurtmasini to'lashi kerak
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga tegishli emas',
      });
    }

    // Buyurtma mijoz tomonidan tasdiqlangan bo'lishi kerak
    if (order.status !== 'confirmed_by_customer') {
      return res.status(400).json({
        success: false,
        message: 'Buyurtma mijoz tomonidan tasdiqlanmagan',
      });
    }

    // To'lov allaqachon qilingan bo'lishi mumkin
    const existingTransaction = await PaymentTransaction.findOne({ order: orderId });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Bu buyurtma uchun to\'lov allaqachon qilingan',
        transaction: existingTransaction,
      });
    }

    // Yangi to'lov transaksiyasi yaratish
    const transaction = new PaymentTransaction({
      order: orderId,
      user: userId,
      amount: order.totalPrice,
      paymentMethod: order.paymentMethod,
      status: 'pending',
      currentHolder: 'user',
      currentHolderId: userId,
    });

    // Transaction path qo'shish
    transaction.addTransactionPath('user', userId, 'paid', 'Foydalanuvchi tomonidan to\'lov qilindi');

    await transaction.save();

    // Buyurtma to'lov holatini yangilash
    order.paymentStatus = 'paid';
    await order.save();

    res.status(201).json({
      success: true,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi',
      transaction: {
        id: transaction._id,
        orderId: transaction.order,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in payOrder:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lov qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// To'lov holatini ko'rish
const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const transaction = await PaymentTransaction.findOne({ order: orderId })
      .populate('order', 'orderNumber totalPrice status')
      .populate('collectedBy', 'name phone')
      .populate('submittedToDistrict', 'name phone')
      .populate('receivedByDistrict', 'name phone')
      .populate('submittedToProvince', 'name phone')
      .populate('receivedByProvince', 'name phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'To\'lov transaksiyasi topilmadi',
      });
    }

    // Foydalanuvchi o'z to'lovini ko'rishi kerak
    if (transaction.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu to\'lov sizga tegishli emas',
      });
    }

    res.status(200).json({
      success: true,
      transaction: {
        id: transaction._id,
        order: transaction.order,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        currentHolder: transaction.currentHolder,
        transactionPath: transaction.transactionPath,
        collectedBy: transaction.collectedBy,
        collectedAt: transaction.collectedAt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in getPaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'To\'lov holatini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  payOrder,
  getPaymentStatus,
};


