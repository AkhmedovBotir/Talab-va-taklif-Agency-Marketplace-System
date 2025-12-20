const express = require('express');
const router = express.Router();
const {
  getUnpaidPayments,
  getUnpaidPaymentsGrouped,
  markPaymentsAsPaid,
  getPaymentStatistics,
  getPaidPayments,
  syncKpiPayments,
} = require('../controllers/adminKpiPaymentController');
const { adminAuth } = require('../middleware/auth');

// ==================== TO'LANMAGAN TO'LOVLAR ====================

// Barcha to'lanmagan to'lovlar ro'yxati
router.get('/unpaid', adminAuth, getUnpaidPayments);

// To'lanmagan to'lovlar (guruhlangan)
router.get('/unpaid/grouped', adminAuth, getUnpaidPaymentsGrouped);

// ==================== TO'LOVNI TASDIQLASH ====================

// To'lovlarni "to'landi" deb belgilash
router.post('/mark-as-paid', adminAuth, markPaymentsAsPaid);

// ==================== TO'LOVLAR STATISTIKASI ====================

// To'lovlar statistikasi
router.get('/statistics', adminAuth, getPaymentStatistics);

// ==================== TO'LANGAN TO'LOVLAR ====================

// To'langan to'lovlar ro'yxati
router.get('/paid', adminAuth, getPaidPayments);

// ==================== SINXRONLASHTIRISH ====================

// KPI transaksiyalardan to'lovlarni yaratish/yangilash
router.post('/sync', adminAuth, syncKpiPayments);

module.exports = router;


