const Redis = require('ioredis');

let redisClient = null;

// Redis client yaratish
const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  let redisConfig;

  // REDIS_URL mavjud bo'lsa, uni ishlatish
  if (process.env.REDIS_URL) {
    // Redis URL format: redis://:password@host:port/db
    redisConfig = process.env.REDIS_URL;
  } else {
    // Individual o'zgaruvchilar bo'yicha konfiguratsiya
    redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
    };

    // Password bo'lsa qo'shish
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
  }

  redisClient = new Redis(redisConfig);

  // Event handlers
  redisClient.on('connect', () => {
    console.log('Redis: Connecting...');
  });

  redisClient.on('ready', () => {
    console.log('Redis: Connected and ready');
  });

  redisClient.on('error', (error) => {
    console.error('Redis Error:', error.message);
  });

  redisClient.on('close', () => {
    console.log('Redis: Connection closed');
  });

  redisClient.on('reconnecting', (delay) => {
    console.log(`Redis: Reconnecting in ${delay}ms...`);
  });

  return redisClient;
};

// Redis'ga ulanish
const connectRedis = async () => {
  try {
    if (!redisClient) {
      createRedisClient();
    }

    // Test connection
    await redisClient.ping();
    console.log('Redis: Successfully connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error.message);
    // Redis bo'lmasa ham, ilova ishlashini davom ettiradi
    console.warn('Redis connection failed. Application will continue without Redis.');
    return null;
  }
};

// Redis client olish
const getRedisClient = () => {
  if (!redisClient) {
    createRedisClient();
  }
  return redisClient;
};

// Redis'ni yopish
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis: Connection closed');
  }
};

// Cache helper funksiyalar
const cache = {
  // Ma'lumotni cache'ga saqlash
  set: async (key, value, expirationSeconds = null) => {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (expirationSeconds) {
        await client.setex(key, expirationSeconds, stringValue);
      } else {
        await client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  },

  // Ma'lumotni cache'dan olish
  get: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return null;

      const value = await client.get(key);
      if (!value) return null;

      // JSON parse qilishga harakat qilish
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  },

  // Ma'lumotni cache'dan o'chirish
  delete: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error.message);
      return false;
    }
  },

  // Pattern bo'yicha key'larni o'chirish
  deletePattern: async (pattern) => {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error.message);
      return false;
    }
  },

  // Cache'ni tozalash
  clear: async () => {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.flushdb();
      return true;
    } catch (error) {
      console.error('Redis CLEAR error:', error.message);
      return false;
    }
  },

  // Key mavjudligini tekshirish
  exists: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error.message);
      return false;
    }
  },

  // TTL olish (qancha vaqt qolgan)
  ttl: async (key) => {
    try {
      const client = getRedisClient();
      if (!client) return -1;

      return await client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error.message);
      return -1;
    }
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  cache,
};

