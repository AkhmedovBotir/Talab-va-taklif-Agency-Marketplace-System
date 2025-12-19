const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { adminAuth } = require('../middleware/auth');
const {
  getUnpaidPayments,
  getUnpaidPaymentsGrouped,
  markPaymentsAsPaid,
  getPaymentStatistics,
  getPaidPayments,
  syncContragentPayments,
} = require('../controllers/adminContragentPaymentController');

// All routes require admin authentication
router.use(adminAuth);

// To'lanmagan to'lovlar
router.get('/unpaid', cacheMiddleware(300), getUnpaidPayments); // 5 min cache
router.get('/unpaid/grouped', cacheMiddleware(300), getUnpaidPaymentsGrouped); // 5 min cache

// To'lovni tasdiqlash
router.post('/mark-as-paid', markPaymentsAsPaid);

// To'lovlar statistikasi
router.get('/statistics', cacheMiddleware(300), getPaymentStatistics); // 5 min cache

// To'langan to'lovlar
router.get('/paid', cacheMiddleware(300), getPaidPayments); // 5 min cache

// Sinxronlashtirish (buyurtmalardan to'lovlarni yaratish)
router.post('/sync', syncContragentPayments);

module.exports = router;

