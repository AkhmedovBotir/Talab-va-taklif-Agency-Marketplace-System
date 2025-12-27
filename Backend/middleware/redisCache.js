const { cache } = require('../config/redis');

// Cache middleware - GET so'rovlar uchun
const redisCache = (duration = 300) => {
  // duration - cache vaqti (sekundlarda, default: 5 daqiqa)
  return async (req, res, next) => {
    // Faqat GET so'rovlar uchun cache
    if (req.method !== 'GET') {
      return next();
    }

    // Cache key yaratish - user-specific bo'lsa user ID qo'shamiz
    let cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    // Agar authenticated user bo'lsa, user ID'ni cache key'ga qo'shamiz
    if (req.user && req.user.userId) {
      cacheKey += `:user:${req.user.userId}`;
    }

    try {
      // Cache'dan ma'lumot olish
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        // Cache log'larni o'chirish (faqat xatoliklarni ko'rsatish)
        return res.status(200).json({
          success: true,
          cached: true,
          ...cachedData,
        });
      }

      // Cache miss - original response'ni saqlash
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Faqat success response'larni cache'ga saqlash
        if (data && data.success !== false) {
          cache.set(cacheKey, data, duration).catch((err) => {
            console.error('Cache SET error:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Redis Cache Middleware error:', error.message);
      // Xatolik bo'lsa ham, so'rov davom etadi
      next();
    }
  };
};

// Cache'ni invalidate qilish middleware
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Response'dan keyin cache'ni tozalash
    const originalJson = res.json.bind(res);
    res.json = async function (data) {
      try {
        // Patterns bo'yicha cache'ni tozalash
        for (const pattern of patterns) {
          // Asosiy pattern'ni tozalash (barcha cache'lar, shu jumladan user-specific)
          await cache.deletePattern(pattern);
          
          // Agar authenticated user bo'lsa, user-specific cache'larni ham tozalash
          if (req.user && req.user.userId) {
            // User-specific pattern yaratish
            // Masalan: cache:/api/contragents/notifications/* -> cache:/api/contragents/notifications/*:user:userId*
            const basePattern = pattern.replace('cache:', '').replace(/\*$/, '');
            const userPattern = `cache:${basePattern}*:user:${req.user.userId}*`;
            await cache.deletePattern(userPattern);
          }
        }
        // Faqat development mode'da log ko'rsatish
        if (process.env.NODE_ENV !== 'production') {
          // Cache invalidation log'larni o'chirish (faqat xatoliklarni ko'rsatish)
        }
      } catch (error) {
        console.error('Cache invalidation error:', error.message);
      }
      return originalJson(data);
    };
    next();
  };
};

// Rate limiting middleware (Redis bilan)
const rateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 daqiqa
    max = 100, // maksimal so'rovlar soni
    keyGenerator = (req) => {
      // Default: IP + path
      return `ratelimit:${req.ip}:${req.path}`;
    },
    message = 'Juda ko\'p so\'rovlar yuborildi. Iltimos, biroz kuting.',
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const current = await cache.get(key);

      if (current === null) {
        // Birinchi so'rov
        await cache.set(key, 1, Math.ceil(windowMs / 1000));
        return next();
      }

      if (current >= max) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Counter'ni oshirish
      const client = require('../config/redis').getRedisClient();
      if (client) {
        await client.incr(key);
        const ttl = await cache.ttl(key);
        if (ttl === -1) {
          await client.expire(key, Math.ceil(windowMs / 1000));
        }
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error.message);
      // Xatolik bo'lsa ham, so'rov davom etadi
      next();
    }
  };
};

module.exports = {
  redisCache,
  invalidateCache,
  rateLimit,
};

