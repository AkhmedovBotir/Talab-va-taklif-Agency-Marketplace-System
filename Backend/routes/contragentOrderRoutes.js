const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const { contragentAuth } = require('../middleware/auth');
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
router.get('/orders', cacheMiddleware(60), getOrdersForContragent); // 1 min cache

// Get order by ID
router.get('/orders/:id', cacheMiddleware(60), getOrderById); // 1 min cache

// Respond to order request (buyurtma so'roviga javob berish)
router.post('/orders/:orderId/respond', respondToOrderRequest);

// Deliver order to punkt (punktga topshirish)
router.post('/orders/:orderId/deliver-to-punkt', deliverToPunkt);

// Get contragent statistics
router.get('/statistics', cacheMiddleware(300), getContragentStatistics); // 5 min cache

// Get today's orders (bugungi buyurtmalar)
router.get('/today', cacheMiddleware(60), getTodayOrders); // 1 min cache

// Get order history (tarix - o'tgan kunlar)
router.get('/history', cacheMiddleware(300), getOrderHistory); // 5 min cache

module.exports = router;



