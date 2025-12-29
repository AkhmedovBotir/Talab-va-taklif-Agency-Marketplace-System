const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
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
}, payContragentPayment);

// Belgilangan muddat orasida filterlangan to'lanmagan to'lovlarni to'lash
router.post('/pay-by-date-range', payContragentPaymentsByDateRange);

// To'lanmagan to'lovlar
router.get('/unpaid', getUnpaidPayments);
router.get('/unpaid/grouped', getUnpaidPaymentsGrouped);

// To'lovni tasdiqlash (bir nechta to'lovlarni)
router.post('/mark-as-paid', markPaymentsAsPaid);

// To'lovlar statistikasi
router.get('/statistics', getPaymentStatistics);

// To'langan to'lovlar
router.get('/paid', getPaidPayments);

// Sinxronlashtirish (buyurtmalardan to'lovlarni yaratish)
router.post('/sync', syncContragentPayments);

module.exports = router;

