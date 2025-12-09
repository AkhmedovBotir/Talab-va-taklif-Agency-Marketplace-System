const express = require('express');
const router = express.Router();
const {
  getMe,
  updateProfile,
  updatePassword,
  updateAvatar,
  updateLocation,
} = require('../controllers/vacancyProfileController');
const { vacancyApplicantAuth } = require('../middleware/auth');

// All routes require authentication
router.use(vacancyApplicantAuth);

// Get current applicant profile
router.get('/me', getMe);

// Update profile (firstName, lastName, gender, birthDate)
router.put('/me', updateProfile);

// Update password
router.patch('/me/password', updatePassword);

// Update avatar
router.patch('/me/avatar', updateAvatar);

// Update location (viloyat, tuman, mfy)
router.patch('/me/location', updateLocation);

module.exports = router;



