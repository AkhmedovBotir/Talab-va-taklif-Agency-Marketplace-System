const express = require('express');
const router = express.Router();
const {
  // Hisobotlar
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  getCustomReport,
  // Topshiruvlar
  getPendingSubmissions,
  confirmSubmission,
  rejectSubmission,
  // Transaksiyalar
  getAllTransactions,
  // Statistika
  getStatistics,
  getStatisticsByRegion,
  getStatisticsByDistrict,
  getStatisticsByMfy,
  getAgentPerformance,
  getFinanceBalance,
  getTotalReceived,
  getTotalDistributed,
  getFinanceKpiAmount,
  getDeliveryServiceKpiAmount,
  getTotalBalance,
} = require('../controllers/adminFinanceController');
const { adminAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// ==================== HISOBOTLAR ====================

// Kunlik hisobot
router.get('/reports/daily', adminAuth, redisCache(60), getDailyReport); // 1 daqiqa cache

// Haftalik hisobot
router.get('/reports/weekly', adminAuth, redisCache(120), getWeeklyReport); // 2 daqiqa cache

// Oylik hisobot
router.get('/reports/monthly', adminAuth, redisCache(300), getMonthlyReport); // 5 daqiqa cache

// Yillik hisobot
router.get('/reports/yearly', adminAuth, redisCache(600), getYearlyReport); // 10 daqiqa cache

// Belgilangan muddat hisoboti
router.get('/reports/custom', adminAuth, redisCache(60), getCustomReport); // 1 daqiqa cache

// ==================== TOPSHIRUVLAR ====================

// Kutilayotgan topshiruvlar
router.get('/submissions/pending', adminAuth, redisCache(30), getPendingSubmissions); // 30 sekund cache

// Topshiruvni tasdiqlash
router.post('/submissions/:submissionId/confirm', adminAuth, invalidateCache(['cache:/api/admin-finance*']), confirmSubmission);

// Topshiruvni rad etish
router.post('/submissions/:submissionId/reject', adminAuth, invalidateCache(['cache:/api/admin-finance*']), rejectSubmission);

// ==================== TRANSAKSIYALAR ====================

// Barcha transaksiyalar
router.get('/transactions', adminAuth, redisCache(60), getAllTransactions); // 1 daqiqa cache

// ==================== STATISTIKA ====================

// Umumiy statistika
router.get('/statistics', adminAuth, redisCache(120), getStatistics); // 2 daqiqa cache

// Viloyat bo'yicha statistika
router.get('/statistics/region', adminAuth, redisCache(120), getStatisticsByRegion); // 2 daqiqa cache

// Tuman bo'yicha statistika
router.get('/statistics/district', adminAuth, redisCache(120), getStatisticsByDistrict); // 2 daqiqa cache

// MFY bo'yicha statistika
router.get('/statistics/mfy', adminAuth, redisCache(120), getStatisticsByMfy); // 2 daqiqa cache

// Agentlar faolligi
router.get('/statistics/agent-performance', adminAuth, redisCache(120), getAgentPerformance); // 2 daqiqa cache

// ==================== MOLIYA BALANSLARI ====================

// Umumiy balans (Umumiy tushgan summa, Tarqatilgan summa, Moliya bo'limiga ajratilgan summa)
router.get('/balance', adminAuth, redisCache(60), getFinanceBalance); // 1 daqiqa cache

// Umumiy tushgan summa
router.get('/balance/total-received', adminAuth, redisCache(60), getTotalReceived); // 1 daqiqa cache

// Tarqatilgan summa (KPI bonuslar)
router.get('/balance/total-distributed', adminAuth, redisCache(120), getTotalDistributed); // 2 daqiqa cache

// Moliya bo'limiga ajratilgan summa (KPI bonuslardan)
router.get('/balance/finance-kpi', adminAuth, redisCache(120), getFinanceKpiAmount); // 2 daqiqa cache

// Yetkazib berish xizmati summasi (KPI bonuslardan)
router.get('/balance/delivery-service-kpi', adminAuth, redisCache(120), getDeliveryServiceKpiAmount); // 2 daqiqa cache

// Umumiy balans (Tushgan - Tarqatilgan)
router.get('/balance/total-balance', adminAuth, redisCache(60), getTotalBalance); // 1 daqiqa cache

module.exports = router;

