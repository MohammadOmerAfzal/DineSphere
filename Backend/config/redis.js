const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("connect", () => console.log("✅ Redis connected"));
redisClient.on("ready", () => console.log("✅ Redis ready"));
redisClient.on("error", err => console.error("❌ Redis error:", err));


const redisHelpers = {
  async get(key) {
    return new Promise((resolve, reject) => {
      if (!redisClient.connected) {
        resolve(null);
        return;
      }
      
      redisClient.get(key, (err, result) => {
        if (err) {
          console.error('❌ Redis GET error:', err);
          resolve(null);
        } else {
          resolve(result);
        }
      });
    });
  },

  async set(key, value, expiration = 1800) {
    return new Promise((resolve, reject) => {
      if (!redisClient.connected) {
        resolve(false);
        return;
      }
      
      redisClient.set(key, value, 'EX', expiration, (err, result) => {
        if (err) {
          console.error('❌ Redis SET error:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  async delByPattern(pattern) {
    return new Promise((resolve, reject) => {
      if (!redisClient.connected) {
        resolve(false);
        return;
      }
      
      redisClient.keys(pattern, (err, keys) => {
        if (err) {
          console.error('❌ Redis KEYS error:', err);
          resolve(false);
          return;
        }
        
        if (keys.length === 0) {
          resolve(true);
          return;
        }
        
        redisClient.del(keys, (delErr) => {
          if (delErr) {
            console.error('❌ Redis DEL error:', delErr);
            resolve(false);
          } else {
            console.log(`✅ Cleared ${keys.length} cache keys with pattern: ${pattern}`);
            resolve(true);
          }
        });
      });
    });
  }
};

const getRedisClient = () => {
  return redisClient;
};

const isRedisConnected = () => {
  return redisClient.connected;
};

module.exports = {
  getRedisClient,
  isRedisConnected,
  redisClient,
  ...redisHelpers
};