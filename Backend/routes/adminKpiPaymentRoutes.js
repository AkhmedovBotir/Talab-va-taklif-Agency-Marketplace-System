const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
router.get('/unpaid', adminAuth, cacheMiddleware(300), getUnpaidPayments); // 5 min cache

// To'lanmagan to'lovlar (guruhlangan)
router.get('/unpaid/grouped', adminAuth, cacheMiddleware(300), getUnpaidPaymentsGrouped); // 5 min cache

// ==================== TO'LOVNI TASDIQLASH ====================

// To'lovlarni "to'landi" deb belgilash
router.post('/mark-as-paid', adminAuth, markPaymentsAsPaid);

// ==================== TO'LOVLAR STATISTIKASI ====================

// To'lovlar statistikasi
router.get('/statistics', adminAuth, cacheMiddleware(300), getPaymentStatistics); // 5 min cache

// ==================== TO'LANGAN TO'LOVLAR ====================

// To'langan to'lovlar ro'yxati
router.get('/paid', adminAuth, cacheMiddleware(300), getPaidPayments); // 5 min cache

// ==================== SINXRONLASHTIRISH ====================

// KPI transaksiyalardan to'lovlarni yaratish/yangilash
router.post('/sync', adminAuth, syncKpiPayments);

module.exports = router;


