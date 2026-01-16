const express = require('express');
const router = express.Router();
// const { payOrder, getPaymentStatus } = require('../controllers/paymentController');
// const { marketplaceUserAuth } = require('../middleware/auth');

// REMOVED: Payment collection routes have been removed
// Users no longer pay to agents, and agents no longer submit to admin
// Payment is handled directly at order creation

// Foydalanuvchi to'lov qilish - REMOVED
// router.post('/orders/:orderId/pay', marketplaceUserAuth, payOrder);

// To'lov holatini ko'rish - REMOVED
// router.get('/orders/:orderId/payment-status', marketplaceUserAuth, getPaymentStatus);

module.exports = router;


