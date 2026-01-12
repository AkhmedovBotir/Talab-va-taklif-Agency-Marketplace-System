const express = require('express');
const router = express.Router();
const {
  loginDeliveryProvider,
} = require('../controllers/deliveryProviderAuthController');
const {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyOrders,
  getOrderById,
  markOrderAsDelivered,
} = require('../controllers/deliveryProviderController');
const { validate, contragentValidationSchemas } = require('../middleware/validation');
const { deliveryProviderAuth } = require('../middleware/auth');

// Login route
router.post('/login', validate(contragentValidationSchemas.login), loginDeliveryProvider);

// Profile management routes (require authentication)
router.get('/me', deliveryProviderAuth, getMyProfile);
router.put('/me', deliveryProviderAuth, validate(contragentValidationSchemas.updateDeliveryProvider), updateMyProfile);
router.post('/change-password', deliveryProviderAuth, validate(contragentValidationSchemas.changePassword), changePassword);

// Orders routes (require authentication)
router.get('/orders', deliveryProviderAuth, getMyOrders);
router.get('/orders/:id', deliveryProviderAuth, getOrderById);
router.post('/orders/:orderId/mark-delivered', deliveryProviderAuth, markOrderAsDelivered);

module.exports = router;
