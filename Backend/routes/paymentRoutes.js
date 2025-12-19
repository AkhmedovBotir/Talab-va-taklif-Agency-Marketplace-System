const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { payOrder, getPaymentStatus } = require('../controllers/paymentController');
const { marketplaceUserAuth } = require('../middleware/auth');

// Foydalanuvchi to'lov qilish
router.post('/orders/:orderId/pay', marketplaceUserAuth, payOrder);

// To'lov holatini ko'rish
router.get('/orders/:orderId/payment-status', marketplaceUserAuth, cacheMiddleware(60), getPaymentStatus); // 1 min cache

module.exports = router;


