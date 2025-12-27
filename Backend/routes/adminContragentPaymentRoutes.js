const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');
const {
  getUnpaidPayments,
  getUnpaidPaymentsGrouped,
  payContragentPayment,
  payContragentPaymentsByDateRange,
  markPaymentsAsPaid,
  getPaymentStatistics,
  getPaidPayments,
  syncContragentPayments,
} = require('../controllers/adminContragentPaymentController');

// All routes require admin authentication
router.use(adminAuth);

// To'lovni to'lash (bitta to'lov) - MUST be before /unpaid to avoid route conflict
router.post('/:id/pay', (req, res, next) => {
  console.log('=== ROUTE: POST /api/admin-contragent-payments/:id/pay ===');
  console.log('Route params:', req.params);
  console.log('Route body:', req.body);
  console.log('Route query:', req.query);
  console.log('User:', req.user ? { userId: req.user.userId, userType: req.user.userType } : 'User topilmadi');
  next();
}, invalidateCache(['cache:/api/admin-contragent-payments*']), payContragentPayment);

// Belgilangan muddat orasida filterlangan to'lanmagan to'lovlarni to'lash
router.post('/pay-by-date-range', invalidateCache(['cache:/api/admin-contragent-payments*']), payContragentPaymentsByDateRange);

// To'lanmagan to'lovlar
router.get('/unpaid', redisCache(30), getUnpaidPayments); // 30 sekund cache
router.get('/unpaid/grouped', redisCache(30), getUnpaidPaymentsGrouped); // 30 sekund cache

// To'lovni tasdiqlash (bir nechta to'lovlarni)
router.post('/mark-as-paid', invalidateCache(['cache:/api/admin-contragent-payments*']), markPaymentsAsPaid);

// To'lovlar statistikasi
router.get('/statistics', redisCache(120), getPaymentStatistics); // 2 daqiqa cache

// To'langan to'lovlar
router.get('/paid', redisCache(60), getPaidPayments); // 1 daqiqa cache

// Sinxronlashtirish (buyurtmalardan to'lovlarni yaratish)
router.post('/sync', invalidateCache(['cache:/api/admin-contragent-payments*']), syncContragentPayments);

module.exports = router;

