const express = require('express');
const router = express.Router();
const {
  getCandidateByCertificateId,
  getCandidateByCertificateNumber,
} = require('../controllers/companyIntegrationController');

// Public endpoints - no authentication required
router.get('/certificate/:certificateId', getCandidateByCertificateId);
router.get('/certificate-number/:certificateNumber', getCandidateByCertificateNumber);

module.exports = router;

