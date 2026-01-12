const express = require('express');
const router = express.Router();
const {
  passwordSetupStep1,
  passwordSetupStep2,
  passwordSetupStep3,
  loginMaxallaContragent,
} = require('../controllers/maxallaContragentAuthController');
const {
  requestDeviceVerificationCode,
  verifyDevice,
  resendDeviceVerificationCode,
} = require('../controllers/maxallaContragentDeviceVerificationController');
const {
  getMyProfile,
  updateMyProfile,
  updateWorkingHours,
  updateServiceAreas,
  logoutMaxallaContragent,
  createDeliveryProvider,
  getAllDeliveryProviders,
  getDeliveryProviderById,
  updateDeliveryProvider,
  deleteDeliveryProvider,
  getMyOrders,
  getOrderById,
  respondToOrderRequest,
  sendOrderToDeliveryProvider,
} = require('../controllers/maxallaContragentController');
const {
  createMaxallaProduct,
  getAllMaxallaProducts,
  getMaxallaProductById,
  updateMaxallaProduct,
  deleteMaxallaProduct,
  getAvailableBaseProducts,
} = require('../controllers/maxallaProductController');
const { validate, contragentValidationSchemas, adminValidationSchemas } = require('../middleware/validation');
const { maxallaContragentAuth } = require('../middleware/auth');

// Password setup routes for Maxalla Contragents
router.post('/password-setup/step1', validate(contragentValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(contragentValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(contragentValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login route for Maxalla Contragents
router.post('/login', validate(contragentValidationSchemas.login), loginMaxallaContragent);

// Device verification routes for Maxalla Contragents
router.post('/device-verification/request-code', requestDeviceVerificationCode);
router.post('/device-verification/verify', verifyDevice);
router.post('/device-verification/resend-code', resendDeviceVerificationCode);

// Profile management routes for Maxalla Contragents (require authentication)
router.get('/me', maxallaContragentAuth, getMyProfile);
router.put('/me', maxallaContragentAuth, validate(contragentValidationSchemas.updateProfile), updateMyProfile);
router.patch('/me/working-hours', maxallaContragentAuth, validate(contragentValidationSchemas.updateWorkingHours), updateWorkingHours);
router.patch('/me/service-areas', maxallaContragentAuth, validate(contragentValidationSchemas.updateServiceAreas), updateServiceAreas);

// Logout route for Maxalla Contragents
router.post('/logout', maxallaContragentAuth, logoutMaxallaContragent);

// Delivery Providers CRUD routes (require authentication)
router.post('/delivery-providers', maxallaContragentAuth, validate(contragentValidationSchemas.createDeliveryProvider), createDeliveryProvider);
router.get('/delivery-providers', maxallaContragentAuth, getAllDeliveryProviders);
router.get('/delivery-providers/:id', maxallaContragentAuth, getDeliveryProviderById);
router.put('/delivery-providers/:id', maxallaContragentAuth, validate(contragentValidationSchemas.updateDeliveryProvider), updateDeliveryProvider);
router.delete('/delivery-providers/:id', maxallaContragentAuth, deleteDeliveryProvider);

// Maxalla Products CRUD routes (require authentication)
router.get('/products/available', maxallaContragentAuth, getAvailableBaseProducts);
router.post('/products', maxallaContragentAuth, validate(adminValidationSchemas.createMaxallaProduct), createMaxallaProduct);
router.get('/products', maxallaContragentAuth, getAllMaxallaProducts);
router.get('/products/:id', maxallaContragentAuth, getMaxallaProductById);
router.put('/products/:id', maxallaContragentAuth, validate(adminValidationSchemas.updateMaxallaProduct), updateMaxallaProduct);
router.delete('/products/:id', maxallaContragentAuth, deleteMaxallaProduct);

// Maxalla Contragent Orders routes (require authentication)
router.get('/orders', maxallaContragentAuth, getMyOrders);
router.get('/orders/:id', maxallaContragentAuth, getOrderById);
router.post('/orders/:orderId/respond', maxallaContragentAuth, validate(contragentValidationSchemas.respondToOrderRequest), respondToOrderRequest);
router.post('/orders/:orderId/send-to-delivery-provider', maxallaContragentAuth, validate(contragentValidationSchemas.sendOrderToDeliveryProvider), sendOrderToDeliveryProvider);

module.exports = router;
