const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
router.get('/orders', cacheMiddleware(60), getMyOrders); // 1 min cache

// Get today's orders (bugungi buyurtmalar)
router.get('/orders/today', cacheMiddleware(60), getTodayOrders); // 1 min cache

// Get order history (tarix - o'tgan kunlar)
router.get('/orders/history', cacheMiddleware(300), getOrderHistory); // 5 min cache

// Get order by ID
router.get('/orders/:id', cacheMiddleware(60), getOrderById); // 1 min cache

// Confirm order by agent (MFY agentlari mijozga borib tasdiqlash)
router.post('/orders/:id/confirm', confirmOrderByAgent);

// Mark order as delivered (MFY agentlari mijozga yetkazib berganini belgilash)
router.post('/orders/:id/delivered', markOrderAsDelivered);

// KPI Bonus endpoints
router.get('/kpi/summary', cacheMiddleware(300), getMyKpiSummary); // 5 min cache
router.get('/kpi/transactions', cacheMiddleware(300), getMyKpiTransactions); // 5 min cache
router.get('/kpi/balance', cacheMiddleware(300), getMyKpiDailyBalance); // 5 min cache
router.get('/kpi/reports/daily', cacheMiddleware(300), getMyKpiDailyReport); // 5 min cache

module.exports = router;


