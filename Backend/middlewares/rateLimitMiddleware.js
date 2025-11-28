const { getRedisClient, isRedisConnected } = require('../config/redis');

const rateLimitMiddleware = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 100, // limit each IP to 100 requests per windowMs
  maxRequestsPerTenant = 1000, // limit each tenant to 1000 requests per windowMs
  message = 'Too many requests, please try again later.',
  skipFailedRequests = false
} = {}) => {
  return async (req, res, next) => {
    try {
      const redisClient = getRedisClient();
      
      if (!redisClient || !isRedisConnected()) {
        console.log('Redis not connected, skipping rate limit');
        return next();
      }

      const tenantId = req.headers['x-tenant-id'] || 'default';
      const userIp = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      // IP-based rate limiting
      const ipKey = `rate_limit:ip:${userIp}`;
      const tenantKey = `rate_limit:tenant:${tenantId}`;

      // Get current counts using individual gets
      const ipCount = await redisClient.get(ipKey);
      const tenantCount = await redisClient.get(tenantKey);

      const currentIpCount = parseInt(ipCount) || 0;
      const currentTenantCount = parseInt(tenantCount) || 0;

      // Check limits
      if (currentIpCount >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: `IP rate limit exceeded: ${message}`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      if (currentTenantCount >= maxRequestsPerTenant) {
        return res.status(429).json({
          success: false,
          message: `Tenant rate limit exceeded: ${message}`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Increment counters using individual commands
      const expireTime = Math.ceil(windowMs / 1000);
      
      if (currentIpCount === 0) {
        await redisClient.setEx(ipKey, expireTime, '1');
      } else {
        await redisClient.incr(ipKey);
      }

      if (currentTenantCount === 0) {
        await redisClient.setEx(tenantKey, expireTime, '1');
      } else {
        await redisClient.incr(tenantKey);
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit-IP': maxRequests,
        'X-RateLimit-Remaining-IP': maxRequests - currentIpCount - 1,
        'X-RateLimit-Limit-Tenant': maxRequestsPerTenant,
        'X-RateLimit-Remaining-Tenant': maxRequestsPerTenant - currentTenantCount - 1
      });

      next();
    } catch (err) {
      console.error('❌ Rate limit middleware error:', err);
      next(); // Continue without rate limiting if Redis fails
    }
  };
};

// Simple in-memory rate limiting as fallback
const createMemoryRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    message = 'Too many requests, please try again later.'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(ip)) {
      const ipRequests = requests.get(ip).filter(time => time > windowStart);
      if (ipRequests.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, ipRequests);
      }
    }

    // Check rate limit
    if (!requests.has(ip)) {
      requests.set(ip, [now]);
    } else {
      const ipRequests = requests.get(ip);
      if (ipRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      ipRequests.push(now);
    }

    next();
  };
};

// Export rate limiters (use memory-based for now to avoid Redis issues)
const publicApiRateLimit = createMemoryRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Too many API requests'
});

const strictRateLimit = createMemoryRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many requests from this IP'
});

const authRateLimit = createMemoryRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts'
});

module.exports = {
  rateLimitMiddleware,
  publicApiRateLimit,
  strictRateLimit,
  authRateLimit,
  createMemoryRateLimit
};