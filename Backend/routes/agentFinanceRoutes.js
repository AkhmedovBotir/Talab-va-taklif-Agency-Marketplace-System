const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const {
  // MFY Agent
  getMfyDailyReport,
  getMfyPendingPayments,
  collectPayment,
  submitToDistrict,
  getMfyStatistics,
  // Tuman Agent
  getDistrictReport,
  getDistrictSubmissions,
  confirmDistrictSubmission,
  submitToProvince,
  getDistrictStatistics,
  // Viloyat Agent
  getProvinceReport,
  getProvinceSubmissions,
  confirmProvinceSubmission,
  submitToFinance,
  getProvinceStatistics,
} = require('../controllers/agentFinanceController');
const { agentAuth } = require('../middleware/auth');

// ==================== MFY AGENT ROUTES ====================

// Kunlik hisobot
router.get('/mfy/daily-report', agentAuth, cacheMiddleware(300), getMfyDailyReport); // 5 min cache

// Kutilayotgan to'lovlar
router.get('/mfy/pending-payments', agentAuth, cacheMiddleware(60), getMfyPendingPayments); // 1 min cache

// To'lovni qabul qilish
router.post('/mfy/collect-payment/:transactionId', agentAuth, collectPayment);

// Tuman agentga topshirish
router.post('/mfy/submit-to-district', agentAuth, submitToDistrict);

// Statistika
router.get('/mfy/statistics', agentAuth, cacheMiddleware(300), getMfyStatistics); // 5 min cache

// ==================== TUMAN AGENT ROUTES ====================

// Tuman hisoboti
router.get('/district/report', agentAuth, cacheMiddleware(300), getDistrictReport); // 5 min cache

// MFY agentlardan kelgan topshiruvlar
router.get('/district/submissions', agentAuth, cacheMiddleware(60), getDistrictSubmissions); // 1 min cache

// Topshiruvni tasdiqlash
router.post('/district/confirm-submission/:submissionId', agentAuth, confirmDistrictSubmission);

// Viloyat agentga topshirish
router.post('/district/submit-to-province', agentAuth, submitToProvince);

// Statistika
router.get('/district/statistics', agentAuth, cacheMiddleware(300), getDistrictStatistics); // 5 min cache

// ==================== VILOYAT AGENT ROUTES ====================

// Viloyat hisoboti
router.get('/province/report', agentAuth, cacheMiddleware(300), getProvinceReport); // 5 min cache

// Tuman agentlardan kelgan topshiruvlar
router.get('/province/submissions', agentAuth, cacheMiddleware(60), getProvinceSubmissions); // 1 min cache

// Topshiruvni tasdiqlash
router.post('/province/confirm-submission/:submissionId', agentAuth, confirmProvinceSubmission);

// Moliya bo'limiga topshirish
router.post('/province/submit-to-finance', agentAuth, submitToFinance);

// Statistika
router.get('/province/statistics', agentAuth, cacheMiddleware(300), getProvinceStatistics); // 5 min cache

module.exports = router;


