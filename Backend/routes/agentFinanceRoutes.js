const express = require('express');
const router = express.Router();
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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// ==================== MFY AGENT ROUTES ====================

// Kunlik hisobot
router.get('/mfy/daily-report', agentAuth, redisCache(60), getMfyDailyReport); // 1 daqiqa cache

// Kutilayotgan to'lovlar
router.get('/mfy/pending-payments', agentAuth, redisCache(30), getMfyPendingPayments); // 30 sekund cache

// To'lovni qabul qilish
router.post('/mfy/collect-payment/:transactionId', agentAuth, invalidateCache(['cache:/api/agent-finance*']), collectPayment);

// Tuman agentga topshirish
router.post('/mfy/submit-to-district', agentAuth, invalidateCache(['cache:/api/agent-finance*']), submitToDistrict);

// Statistika
router.get('/mfy/statistics', agentAuth, redisCache(120), getMfyStatistics); // 2 daqiqa cache

// ==================== TUMAN AGENT ROUTES ====================

// Tuman hisoboti
router.get('/district/report', agentAuth, redisCache(60), getDistrictReport); // 1 daqiqa cache

// MFY agentlardan kelgan topshiruvlar
router.get('/district/submissions', agentAuth, redisCache(30), getDistrictSubmissions); // 30 sekund cache

// Topshiruvni tasdiqlash
router.post('/district/confirm-submission/:submissionId', agentAuth, invalidateCache(['cache:/api/agent-finance*']), confirmDistrictSubmission);

// Viloyat agentga topshirish
router.post('/district/submit-to-province', agentAuth, invalidateCache(['cache:/api/agent-finance*']), submitToProvince);

// Statistika
router.get('/district/statistics', agentAuth, redisCache(120), getDistrictStatistics); // 2 daqiqa cache

// ==================== VILOYAT AGENT ROUTES ====================

// Viloyat hisoboti
router.get('/province/report', agentAuth, redisCache(60), getProvinceReport); // 1 daqiqa cache

// Tuman agentlardan kelgan topshiruvlar
router.get('/province/submissions', agentAuth, redisCache(30), getProvinceSubmissions); // 30 sekund cache

// Topshiruvni tasdiqlash
router.post('/province/confirm-submission/:submissionId', agentAuth, invalidateCache(['cache:/api/agent-finance*']), confirmProvinceSubmission);

// Moliya bo'limiga topshirish
router.post('/province/submit-to-finance', agentAuth, invalidateCache(['cache:/api/agent-finance*', 'cache:/api/admin-finance*']), submitToFinance);

// Statistika
router.get('/province/statistics', agentAuth, redisCache(120), getProvinceStatistics); // 2 daqiqa cache

module.exports = router;


