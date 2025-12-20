const express = require('express');
const router = express.Router();
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
router.get('/unpaid', getUnpaidPayments);
router.get('/unpaid/grouped', getUnpaidPaymentsGrouped);

// To'lovni tasdiqlash
router.post('/mark-as-paid', markPaymentsAsPaid);

// To'lovlar statistikasi
router.get('/statistics', getPaymentStatistics);

// To'langan to'lovlar
router.get('/paid', getPaidPayments);

// Sinxronlashtirish (buyurtmalardan to'lovlarni yaratish)
router.post('/sync', syncContragentPayments);

module.exports = router;

