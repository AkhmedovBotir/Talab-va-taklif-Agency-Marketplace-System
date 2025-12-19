const { getCache, setCache, deleteCache, deleteCacheByPattern } = require('../config/redis');
const crypto = require('crypto');

// Cache key yaratish
const generateCacheKey = (req) => {
  const path = req.originalUrl || req.url;
  const queryString = JSON.stringify(req.query);
  const user = req.user ? req.user.userId : 'public';
  const hash = crypto.createHash('md5').update(`${path}${queryString}${user}`).digest('hex');
  return `cache:${hash}`;
};

// Cache middleware - GET requestlar uchun
const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    // Faqat GET requestlar uchun cache
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req);
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Cache'dan ma'lumot topildi
        return res.status(200).json(cachedData);
      }

      // Cache'dan topilmadi, original response'ni intercept qilish
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Faqat success response'larni cache qilish
        if (data && (data.success === true || Array.isArray(data))) {
          setCache(cacheKey, data, duration).catch((err) => {
            console.error('Cache set error:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidate middleware - POST/PUT/DELETE uchun
const invalidateCache = async (patterns) => {
  try {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }

    for (const pattern of patterns) {
      await deleteCacheByPattern(pattern);
    }
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
};

// Cache invalidate helper funksiyalar
const cacheInvalidators = {
  // Product cache invalidate
  invalidateProductCache: async () => {
    await invalidateCache(['cache:*product*', 'cache:*marketplace*']);
  },

  // Category cache invalidate
  invalidateCategoryCache: async () => {
    await invalidateCache(['cache:*category*', 'cache:*marketplace*']);
  },

  // Order cache invalidate
  invalidateOrderCache: async () => {
    await invalidateCache([
      'cache:*order*',
      'cache:*admin*order*',
      'cache:*agent*order*',
      'cache:*punkt*order*',
      'cache:*contragent*order*',
    ]);
  },

  // User cache invalidate
  invalidateUserCache: async () => {
    await invalidateCache(['cache:*user*', 'cache:*admin*user*', 'cache:*marketplace*user*']);
  },

  // Contragent cache invalidate
  invalidateContragentCache: async () => {
    await invalidateCache(['cache:*contragent*', 'cache:*marketplace*']);
  },

  // Agent cache invalidate
  invalidateAgentCache: async () => {
    await invalidateCache(['cache:*agent*']);
  },

  // Punkt cache invalidate
  invalidatePunktCache: async () => {
    await invalidateCache(['cache:*punkt*']);
  },

  // Region cache invalidate
  invalidateRegionCache: async () => {
    await invalidateCache(['cache:*region*']);
  },

  // KPI cache invalidate
  invalidateKpiCache: async () => {
    await invalidateCache(['cache:*kpi*', 'cache:*payment*']);
  },

  // Notification cache invalidate
  invalidateNotificationCache: async () => {
    await invalidateCache(['cache:*notification*']);
  },

  // Review cache invalidate
  invalidateReviewCache: async () => {
    await invalidateCache(['cache:*review*', 'cache:*marketplace*']);
  },

  // Cart cache invalidate
  invalidateCartCache: async (userId) => {
    if (userId) {
      // Specific user cart cache
      await deleteCacheByPattern(`cache:*cart*${userId}*`);
    } else {
      // All cart cache
      await invalidateCache(['cache:*cart*']);
    }
  },

  // All cache invalidate
  invalidateAllCache: async () => {
    await invalidateCache(['cache:*']);
  },
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  cacheInvalidators,
  generateCacheKey,
};

