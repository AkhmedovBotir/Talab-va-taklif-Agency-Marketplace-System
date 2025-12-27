const express = require('express');
const router = express.Router();
const { punktAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');
const {
  getMyOrders,
  getOrderById,
  confirmOrder,
  requestToPunkts,
  getPunktRequests,
  respondToRequest,
  assignOrderToAgent,
  requestToContragent,
  requestToPunkt,
  sendToPunkt,
  receiveFromPunkt,
  receiveFromContragent,
  getPunktToPunktRequests,
  respondToPunktToPunktRequest,
  getOrderContragentIds,
  getTodayOrders,
  getOrderHistory,
} = require('../controllers/punktOrderController');
const {
  getMyKpiSummary,
  getMyKpiTransactions,
  getMyKpiDailyBalance,
  getMyKpiDailyReport,
} = require('../controllers/punktKpiController');

// All routes require punkt authentication
router.use(punktAuth);

// Get orders for punkt (o'z hududidagi buyurtmalar)
router.get('/orders', redisCache(30), getMyOrders); // 30 sekund cache

// Get today's orders (bugungi buyurtmalar)
router.get('/orders/today', redisCache(30), getTodayOrders); // 30 sekund cache

// Get order history (tarix - o'tgan kunlar)
router.get('/orders/history', redisCache(60), getOrderHistory); // 1 daqiqa cache

// Get order by ID
router.get('/orders/:id', redisCache(30), getOrderById); // 30 sekund cache

// Get contragent IDs from order products (buyurtmadagi maxsulotlarning contragent ID'larini olish)
router.get('/orders/:id/contragents', redisCache(60), getOrderContragentIds); // 1 daqiqa cache

// Confirm order (buyurtmani tasdiqlash)
router.post('/orders/:id/confirm', invalidateCache(['cache:/api/punkt/orders*']), confirmOrder);

// Assign order to agent (buyurtmani agentga yuborish)
router.post('/orders/:id/assign-to-agent', invalidateCache(['cache:/api/punkt/orders*', 'cache:/api/agent/orders*']), assignOrderToAgent);

// Request to contragent (contragentga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-contragent', invalidateCache(['cache:/api/punkt/orders*', 'cache:/api/contragent/orders*']), requestToContragent);

// Request to another punkt (boshqa punktga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-punkt', invalidateCache(['cache:/api/punkt/orders*']), requestToPunkt);

// Request to other punkts (boshqa punktlarga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-punkts', invalidateCache(['cache:/api/punkt/orders*']), requestToPunkts);

// Send to punkt (punktga buyurtma yuborish) - B punktdan A punktga yuborish uchun
router.post('/orders/:id/send-to-punkt', invalidateCache(['cache:/api/punkt/orders*']), sendToPunkt);

// Receive from punkt (punktdan qabul qilish) - MUST be before /:id route
router.post('/orders/:id/receive-from-punkt', invalidateCache(['cache:/api/punkt/orders*']), receiveFromPunkt);

// Receive from contragent (contragentdan qabul qilish) - MUST be before /:id route
router.post('/orders/:id/receive-from-contragent', invalidateCache(['cache:/api/punkt/orders*', 'cache:/api/contragent/orders*']), receiveFromContragent);

// Get punkt to punkt requests (punktdan punktga so'rovlar)
router.get('/punkt-to-punkt-requests', redisCache(30), getPunktToPunktRequests); // 30 sekund cache

// Respond to punkt to punkt request (punktdan punktga so'rovga javob berish)
router.post('/punkt-to-punkt-requests/:orderId/respond', invalidateCache(['cache:/api/punkt/orders*']), respondToPunktToPunktRequest);

// Get requests to my punkt (o'z punktiga kelgan so'rovlar)
router.get('/requests', redisCache(30), getPunktRequests); // 30 sekund cache

// Respond to request (so'rovga javob berish)
router.post('/requests/:orderId/respond', invalidateCache(['cache:/api/punkt/orders*']), respondToRequest);

// KPI Bonus endpoints
router.get('/kpi/summary', redisCache(120), getMyKpiSummary); // 2 daqiqa cache
router.get('/kpi/transactions', redisCache(120), getMyKpiTransactions); // 2 daqiqa cache
router.get('/kpi/balance', redisCache(60), getMyKpiDailyBalance); // 1 daqiqa cache
router.get('/kpi/reports/daily', redisCache(60), getMyKpiDailyReport); // 1 daqiqa cache

module.exports = router;

