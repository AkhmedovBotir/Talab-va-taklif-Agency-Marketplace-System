const express = require('express');
const router = express.Router();
const {
  // Agent functions (formerly MFY Agent)
  getDailyReport,
  // getPendingPayments, - REMOVED: Payment collection removed
  // collectPayment, - REMOVED: Payment collection removed
  // submitToFinance, - REMOVED: Payment collection removed
  getStatistics,
} = require('../controllers/agentFinanceController');
const { agentAuth } = require('../middleware/auth');

// ==================== AGENT ROUTES ====================

// Kunlik hisobot
router.get('/daily-report', agentAuth, getDailyReport);

// Kutilayotgan to'lovlar - REMOVED (payment collection removed)
// router.get('/pending-payments', agentAuth, getPendingPayments);

// To'lovni qabul qilish - REMOVED: Payment collection removed
// router.post('/collect-payment/:transactionId', agentAuth, collectPayment);

// Moliya bo'limiga topshirish - REMOVED: Payment collection removed
// router.post('/submit-to-finance', agentAuth, submitToFinance);

// Statistika
router.get('/statistics', agentAuth, getStatistics);

module.exports = router;


