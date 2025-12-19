const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
  getTotalBalance,
} = require('../controllers/adminFinanceController');
const { adminAuth } = require('../middleware/auth');

// ==================== HISOBOTLAR ====================

// Kunlik hisobot
router.get('/reports/daily', adminAuth, cacheMiddleware(300), getDailyReport); // 5 min cache

// Haftalik hisobot
router.get('/reports/weekly', adminAuth, cacheMiddleware(600), getWeeklyReport); // 10 min cache

// Oylik hisobot
router.get('/reports/monthly', adminAuth, cacheMiddleware(1800), getMonthlyReport); // 30 min cache

// Yillik hisobot
router.get('/reports/yearly', adminAuth, cacheMiddleware(3600), getYearlyReport); // 1 hour cache

// Belgilangan muddat hisoboti
router.get('/reports/custom', adminAuth, cacheMiddleware(300), getCustomReport); // 5 min cache

// ==================== TOPSHIRUVLAR ====================

// Kutilayotgan topshiruvlar
router.get('/submissions/pending', adminAuth, cacheMiddleware(60), getPendingSubmissions); // 1 min cache

// Topshiruvni tasdiqlash
router.post('/submissions/:submissionId/confirm', adminAuth, confirmSubmission);

// Topshiruvni rad etish
router.post('/submissions/:submissionId/reject', adminAuth, rejectSubmission);

// ==================== TRANSAKSIYALAR ====================

// Barcha transaksiyalar
router.get('/transactions', adminAuth, cacheMiddleware(300), getAllTransactions); // 5 min cache

// ==================== STATISTIKA ====================

// Umumiy statistika
router.get('/statistics', adminAuth, cacheMiddleware(300), getStatistics); // 5 min cache

// Viloyat bo'yicha statistika
router.get('/statistics/region', adminAuth, cacheMiddleware(300), getStatisticsByRegion); // 5 min cache

// Tuman bo'yicha statistika
router.get('/statistics/district', adminAuth, cacheMiddleware(300), getStatisticsByDistrict); // 5 min cache

// MFY bo'yicha statistika
router.get('/statistics/mfy', adminAuth, cacheMiddleware(300), getStatisticsByMfy); // 5 min cache

// Agentlar faolligi
router.get('/statistics/agent-performance', adminAuth, cacheMiddleware(300), getAgentPerformance); // 5 min cache

// ==================== MOLIYA BALANSLARI ====================

// Umumiy balans (Umumiy tushgan summa, Tarqatilgan summa, Moliya bo'limiga ajratilgan summa)
router.get('/balance', adminAuth, cacheMiddleware(300), getFinanceBalance); // 5 min cache

// Umumiy tushgan summa
router.get('/balance/total-received', adminAuth, cacheMiddleware(300), getTotalReceived); // 5 min cache

// Tarqatilgan summa (KPI bonuslar)
router.get('/balance/total-distributed', adminAuth, cacheMiddleware(300), getTotalDistributed); // 5 min cache

// Moliya bo'limiga ajratilgan summa (KPI bonuslardan)
router.get('/balance/finance-kpi', adminAuth, cacheMiddleware(300), getFinanceKpiAmount); // 5 min cache

// Umumiy balans (Tushgan - Tarqatilgan)
router.get('/balance/total-balance', adminAuth, cacheMiddleware(300), getTotalBalance); // 5 min cache

module.exports = router;

