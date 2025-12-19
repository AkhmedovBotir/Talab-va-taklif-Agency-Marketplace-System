const express = require('express');
const router = express.Router();
const {
  checkPhone,
  getRegions,
  sendRegisterCode,
  registerApplicant,
  verifyRegisterCode,
  loginSendCode,
  loginVerifyCode,
  forgotPasswordSendCode,
  forgotPasswordConfirm,
  resendCode,
} = require('../controllers/vacancyAuthController');
const { cacheMiddleware } = require('../middleware/cache');
// Phone check
router.get('/register/check', cacheMiddleware(60), checkPhone); // 1 min cache

// Regions
router.get('/regions', cacheMiddleware(3600), getRegions); // 1 hour cache

// Register
router.post('/register/send-code', sendRegisterCode);
router.post('/register/verify-code', verifyRegisterCode);
router.post('/register/confirm', registerApplicant);

// Login
router.post('/login/send-code', loginSendCode);
router.post('/login/confirm', loginVerifyCode);

// Forgot password
router.post('/password/forgot/send-code', forgotPasswordSendCode);
router.post('/password/forgot/confirm', forgotPasswordConfirm);

// Resend code (generic)
router.post('/resend-code', resendCode);

module.exports = router;


