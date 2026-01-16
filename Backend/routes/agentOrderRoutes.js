const express = require('express');
const router = express.Router();
const { agentAuth } = require('../middleware/auth');
const {
  getMyOrders,
  getOrderById,
  confirmOrderByAgent,
  markOrderAsDelivered,
  getTodayOrders,
  getOrderHistory,
} = require('../controllers/agentOrderController');
const {
  getMyKpiSummary,
  getMyKpiTransactions,
  getMyKpiDailyBalance,
  getMyKpiDailyReport,
} = require('../controllers/agentKpiController');

// All routes require agent authentication
router.use(agentAuth);

// Get orders for agent (agent type'ga qarab buyurtmalarni ko'rish)
router.get('/orders', getMyOrders);

// Get today's orders (bugungi buyurtmalar)
router.get('/orders/today', getTodayOrders);

// Get order history (tarix - o'tgan kunlar)
router.get('/orders/history', getOrderHistory);

// Get order by ID
router.get('/orders/:id', getOrderById);

// Confirm order by agent (Agent mijozga borib tasdiqlash)
router.post('/orders/:id/confirm', confirmOrderByAgent);

// Mark order as delivered (Agent mijozga yetkazib berganini belgilash)
router.post('/orders/:id/delivered', markOrderAsDelivered);

// KPI Bonus endpoints
router.get('/kpi/summary', getMyKpiSummary);
router.get('/kpi/transactions', getMyKpiTransactions);
router.get('/kpi/balance', getMyKpiDailyBalance);
router.get('/kpi/reports/daily', getMyKpiDailyReport);

module.exports = router;


