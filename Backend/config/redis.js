const redis = require('redis');

let redisClient = null;

// Redis client yaratish
const createRedisClient = async () => {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts, giving up');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    client.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
};

// Redis client'ni olish
const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
};

// Redis'ga ma'lumot yozish
const setCache = async (key, value, expirationSeconds = 3600) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const serializedValue = JSON.stringify(value);
    await client.setEx(key, expirationSeconds, serializedValue);
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
};

// Redis'dan ma'lumot o'qish
const getCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value);
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

// Redis'dan ma'lumot o'chirish
const deleteCache = async (key) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis deleteCache error:', error);
    return false;
  }
};

// Pattern bo'yicha cache'larni o'chirish
const deleteCacheByPattern = async (pattern) => {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis deleteCacheByPattern error:', error);
    return false;
  }
};

// Redis client'ni yopish
const closeRedisClient = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis Client Closed');
    }
  } catch (error) {
    console.error('Redis close error:', error);
  }
};

module.exports = {
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  closeRedisClient,
};

