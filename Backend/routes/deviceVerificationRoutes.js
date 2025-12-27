const express = require('express');
const router = express.Router();
const {
  requestDeviceVerificationCode,
  verifyDevice,
  resendDeviceVerificationCode,
} = require('../controllers/deviceVerificationController');

// Device verification routes
// POST /api/device-verification/:userModel/request-code
router.post('/:userModel/request-code', requestDeviceVerificationCode);

// POST /api/device-verification/:userModel/verify
router.post('/:userModel/verify', verifyDevice);

// POST /api/device-verification/:userModel/resend-code
router.post('/:userModel/resend-code', resendDeviceVerificationCode);

module.exports = router;


