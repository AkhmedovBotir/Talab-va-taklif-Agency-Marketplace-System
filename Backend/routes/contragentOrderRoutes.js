const express = require('express');
const router = express.Router();
const { contragentAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');
const {
  getOrdersForContragent,
  getOrderById,
  respondToOrderRequest,
  deliverToPunkt,
  getContragentStatistics,
  getTodayOrders,
  getOrderHistory,
} = require('../controllers/contragentOrderController');

// All routes require contragent authentication
router.use(contragentAuth);

// Get orders for contragent (contragentga kelgan so'rovlar)
router.get('/orders', redisCache(30), getOrdersForContragent); // 30 sekund cache

// Get order by ID
router.get('/orders/:id', redisCache(30), getOrderById); // 30 sekund cache

// Respond to order request (buyurtma so'roviga javob berish)
router.post('/orders/:orderId/respond', invalidateCache(['cache:/api/contragent/orders*', 'cache:/api/punkt/orders*']), respondToOrderRequest);

// Deliver order to punkt (punktga topshirish)
router.post('/orders/:orderId/deliver-to-punkt', invalidateCache(['cache:/api/contragent/orders*', 'cache:/api/punkt/orders*']), deliverToPunkt);

// Get contragent statistics
router.get('/statistics', redisCache(120), getContragentStatistics); // 2 daqiqa cache

// Get today's orders (bugungi buyurtmalar)
router.get('/today', redisCache(30), getTodayOrders); // 30 sekund cache

// Get order history (tarix - o'tgan kunlar)
router.get('/history', redisCache(60), getOrderHistory); // 1 daqiqa cache

module.exports = router;



