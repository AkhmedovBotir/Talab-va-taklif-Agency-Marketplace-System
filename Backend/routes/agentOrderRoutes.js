const express = require('express');
const router = express.Router();
const { agentAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');
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
router.get('/orders', redisCache(30), getMyOrders); // 30 sekund cache

// Get today's orders (bugungi buyurtmalar)
router.get('/orders/today', redisCache(30), getTodayOrders); // 30 sekund cache

// Get order history (tarix - o'tgan kunlar)
router.get('/orders/history', redisCache(60), getOrderHistory); // 1 daqiqa cache

// Get order by ID
router.get('/orders/:id', redisCache(30), getOrderById); // 30 sekund cache

// Confirm order by agent (MFY agentlari mijozga borib tasdiqlash)
router.post('/orders/:id/confirm', invalidateCache(['cache:/api/agent/orders*', 'cache:/api/punkt/orders*']), confirmOrderByAgent);

// Mark order as delivered (MFY agentlari mijozga yetkazib berganini belgilash)
router.post('/orders/:id/delivered', invalidateCache(['cache:/api/agent/orders*', 'cache:/api/punkt/orders*']), markOrderAsDelivered);

// KPI Bonus endpoints
router.get('/kpi/summary', redisCache(120), getMyKpiSummary); // 2 daqiqa cache
router.get('/kpi/transactions', redisCache(120), getMyKpiTransactions); // 2 daqiqa cache
router.get('/kpi/balance', redisCache(60), getMyKpiDailyBalance); // 1 daqiqa cache
router.get('/kpi/reports/daily', redisCache(60), getMyKpiDailyReport); // 1 daqiqa cache

module.exports = router;


