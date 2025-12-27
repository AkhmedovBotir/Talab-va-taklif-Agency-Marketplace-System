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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// ==================== TO'LANMAGAN TO'LOVLAR ====================

// Barcha to'lanmagan to'lovlar ro'yxati
router.get('/unpaid', adminAuth, redisCache(30), getUnpaidPayments); // 30 sekund cache

// To'lanmagan to'lovlar (guruhlangan)
router.get('/unpaid/grouped', adminAuth, redisCache(30), getUnpaidPaymentsGrouped); // 30 sekund cache

// ==================== TO'LOVNI TASDIQLASH ====================

// To'lovlarni "to'landi" deb belgilash
router.post('/mark-as-paid', adminAuth, invalidateCache(['cache:/api/admin-kpi-payments*']), markPaymentsAsPaid);

// ==================== TO'LOVLAR STATISTIKASI ====================

// To'lovlar statistikasi
router.get('/statistics', adminAuth, redisCache(120), getPaymentStatistics); // 2 daqiqa cache

// ==================== TO'LANGAN TO'LOVLAR ====================

// To'langan to'lovlar ro'yxati
router.get('/paid', adminAuth, redisCache(60), getPaidPayments); // 1 daqiqa cache

// ==================== SINXRONLASHTIRISH ====================

// KPI transaksiyalardan to'lovlarni yaratish/yangilash
router.post('/sync', adminAuth, invalidateCache(['cache:/api/admin-kpi-payments*']), syncKpiPayments);

module.exports = router;


