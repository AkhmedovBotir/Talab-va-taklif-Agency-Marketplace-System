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
} = require('../controllers/adminFinanceController');
const { adminAuth } = require('../middleware/auth');

// ==================== HISOBOTLAR ====================

// Kunlik hisobot
router.get('/reports/daily', adminAuth, getDailyReport);

// Haftalik hisobot
router.get('/reports/weekly', adminAuth, getWeeklyReport);

// Oylik hisobot
router.get('/reports/monthly', adminAuth, getMonthlyReport);

// Yillik hisobot
router.get('/reports/yearly', adminAuth, getYearlyReport);

// Belgilangan muddat hisoboti
router.get('/reports/custom', adminAuth, getCustomReport);

// ==================== TOPSHIRUVLAR ====================

// Kutilayotgan topshiruvlar
router.get('/submissions/pending', adminAuth, getPendingSubmissions);

// Topshiruvni tasdiqlash
router.post('/submissions/:submissionId/confirm', adminAuth, confirmSubmission);

// Topshiruvni rad etish
router.post('/submissions/:submissionId/reject', adminAuth, rejectSubmission);

// ==================== TRANSAKSIYALAR ====================

// Barcha transaksiyalar
router.get('/transactions', adminAuth, getAllTransactions);

// ==================== STATISTIKA ====================

// Umumiy statistika
router.get('/statistics', adminAuth, getStatistics);

// Viloyat bo'yicha statistika
router.get('/statistics/region', adminAuth, getStatisticsByRegion);

// Tuman bo'yicha statistika
router.get('/statistics/district', adminAuth, getStatisticsByDistrict);

// MFY bo'yicha statistika
router.get('/statistics/mfy', adminAuth, getStatisticsByMfy);

// Agentlar faolligi
router.get('/statistics/agent-performance', adminAuth, getAgentPerformance);

module.exports = router;

