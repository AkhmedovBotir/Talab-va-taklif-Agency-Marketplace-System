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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// All routes require authentication
router.use(vacancyApplicantAuth);

// Get current applicant profile
router.get('/me', redisCache(60), getMe); // 1 daqiqa cache (user-specific, lekin kam o'zgaradi)

// Update profile (firstName, lastName, gender, birthDate)
router.put('/me', invalidateCache(['cache:/api/vacancy-profile/me*']), updateProfile);

// Update password
router.patch('/me/password', invalidateCache(['cache:/api/vacancy-profile/me*']), updatePassword);

// Update avatar
router.patch('/me/avatar', invalidateCache(['cache:/api/vacancy-profile/me*']), updateAvatar);

// Update location (viloyat, tuman, mfy)
router.patch('/me/location', invalidateCache(['cache:/api/vacancy-profile/me*']), updateLocation);

module.exports = router;





