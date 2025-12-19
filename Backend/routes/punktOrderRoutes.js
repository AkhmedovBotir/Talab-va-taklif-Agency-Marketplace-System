const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { punktAuth } = require('../middleware/auth');
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
router.get('/orders', cacheMiddleware(60), getMyOrders); // 1 min cache

// Get today's orders (bugungi buyurtmalar)
router.get('/orders/today', cacheMiddleware(60), getTodayOrders); // 1 min cache

// Get order history (tarix - o'tgan kunlar)
router.get('/orders/history', cacheMiddleware(300), getOrderHistory); // 5 min cache

// Get order by ID
router.get('/orders/:id', cacheMiddleware(60), getOrderById); // 1 min cache

// Get contragent IDs from order products (buyurtmadagi maxsulotlarning contragent ID'larini olish)
router.get('/orders/:id/contragents', cacheMiddleware(300), getOrderContragentIds); // 5 min cache

// Confirm order (buyurtmani tasdiqlash)
router.post('/orders/:id/confirm', confirmOrder);

// Assign order to agent (buyurtmani agentga yuborish)
router.post('/orders/:id/assign-to-agent', assignOrderToAgent);

// Request to contragent (contragentga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-contragent', requestToContragent);

// Request to another punkt (boshqa punktga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-punkt', requestToPunkt);

// Request to other punkts (boshqa punktlarga so'rov yuborish) - MUST be before /:id route
router.post('/orders/:id/request-to-punkts', requestToPunkts);

// Send to punkt (punktga buyurtma yuborish) - B punktdan A punktga yuborish uchun
router.post('/orders/:id/send-to-punkt', sendToPunkt);

// Receive from punkt (punktdan qabul qilish) - MUST be before /:id route
router.post('/orders/:id/receive-from-punkt', receiveFromPunkt);

// Receive from contragent (contragentdan qabul qilish) - MUST be before /:id route
router.post('/orders/:id/receive-from-contragent', receiveFromContragent);

// Get punkt to punkt requests (punktdan punktga so'rovlar)
router.get('/punkt-to-punkt-requests', cacheMiddleware(60), getPunktToPunktRequests); // 1 min cache

// Respond to punkt to punkt request (punktdan punktga so'rovga javob berish)
router.post('/punkt-to-punkt-requests/:orderId/respond', respondToPunktToPunktRequest);

// Get requests to my punkt (o'z punktiga kelgan so'rovlar)
router.get('/requests', cacheMiddleware(60), getPunktRequests); // 1 min cache

// Respond to request (so'rovga javob berish)
router.post('/requests/:orderId/respond', respondToRequest);

// KPI Bonus endpoints
router.get('/kpi/summary', getMyKpiSummary);
router.get('/kpi/transactions', getMyKpiTransactions);
router.get('/kpi/balance', getMyKpiDailyBalance);
router.get('/kpi/reports/daily', getMyKpiDailyReport);

module.exports = router;

