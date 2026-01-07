const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  assignCertificateToPosition,
} = require('../controllers/certificateAssignmentController');

// Admin endpoints - require authentication
router.post('/assign', adminAuth, assignCertificateToPosition);

module.exports = router;

