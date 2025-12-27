const express = require('express');
const router = express.Router();
const { payOrder, getPaymentStatus } = require('../controllers/paymentController');
const { marketplaceUserAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Foydalanuvchi to'lov qilish
router.post('/orders/:orderId/pay', marketplaceUserAuth, invalidateCache(['cache:/api/payment/orders/*']), payOrder);

// To'lov holatini ko'rish
router.get('/orders/:orderId/payment-status', marketplaceUserAuth, redisCache(30), getPaymentStatus); // 30 sekund cache

module.exports = router;


