const express = require('express');
const router = express.Router();
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
router.get('/orders', getOrdersForContragent);

// Get order by ID
router.get('/orders/:id', getOrderById);

// Respond to order request (buyurtma so'roviga javob berish)
router.post('/orders/:orderId/respond', respondToOrderRequest);

// Deliver order to punkt (punktga topshirish)
router.post('/orders/:orderId/deliver-to-punkt', deliverToPunkt);

// Get contragent statistics
router.get('/statistics', getContragentStatistics);

// Get today's orders (bugungi buyurtmalar)
router.get('/today', getTodayOrders);

// Get order history (tarix - o'tgan kunlar)
router.get('/history', getOrderHistory);

module.exports = router;



