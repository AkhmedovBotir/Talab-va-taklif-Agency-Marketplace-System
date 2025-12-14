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

// ==================== MFY AGENT ROUTES ====================

// Kunlik hisobot
router.get('/mfy/daily-report', agentAuth, getMfyDailyReport);

// Kutilayotgan to'lovlar
router.get('/mfy/pending-payments', agentAuth, getMfyPendingPayments);

// To'lovni qabul qilish
router.post('/mfy/collect-payment/:transactionId', agentAuth, collectPayment);

// Tuman agentga topshirish
router.post('/mfy/submit-to-district', agentAuth, submitToDistrict);

// Statistika
router.get('/mfy/statistics', agentAuth, getMfyStatistics);

// ==================== TUMAN AGENT ROUTES ====================

// Tuman hisoboti
router.get('/district/report', agentAuth, getDistrictReport);

// MFY agentlardan kelgan topshiruvlar
router.get('/district/submissions', agentAuth, getDistrictSubmissions);

// Topshiruvni tasdiqlash
router.post('/district/confirm-submission/:submissionId', agentAuth, confirmDistrictSubmission);

// Viloyat agentga topshirish
router.post('/district/submit-to-province', agentAuth, submitToProvince);

// Statistika
router.get('/district/statistics', agentAuth, getDistrictStatistics);

// ==================== VILOYAT AGENT ROUTES ====================

// Viloyat hisoboti
router.get('/province/report', agentAuth, getProvinceReport);

// Tuman agentlardan kelgan topshiruvlar
router.get('/province/submissions', agentAuth, getProvinceSubmissions);

// Topshiruvni tasdiqlash
router.post('/province/confirm-submission/:submissionId', agentAuth, confirmProvinceSubmission);

// Moliya bo'limiga topshirish
router.post('/province/submit-to-finance', agentAuth, submitToFinance);

// Statistika
router.get('/province/statistics', agentAuth, getProvinceStatistics);

module.exports = router;

