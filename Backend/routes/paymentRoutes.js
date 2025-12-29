const express = require('express');
const router = express.Router();
const { payOrder, getPaymentStatus } = require('../controllers/paymentController');
const { marketplaceUserAuth } = require('../middleware/auth');

// Foydalanuvchi to'lov qilish
router.post('/orders/:orderId/pay', marketplaceUserAuth, payOrder);

// To'lov holatini ko'rish
router.get('/orders/:orderId/payment-status', marketplaceUserAuth, getPaymentStatus);

module.exports = router;


