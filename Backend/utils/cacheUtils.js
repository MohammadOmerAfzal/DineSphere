// utils/cacheUtils.js
const { getRedisClient, isRedisConnected, get, set, delByPattern } = require('../config/redis');

async function clearRestaurantCaches() {
  try {
    await delByPattern('*restaurants*');
    await delByPattern('*categories*');
    console.log('✅ All restaurant and category caches cleared');
  } catch (error) {
    console.error('❌ Error clearing restaurant cache:', error);
  }
}

async function clearSpecificRestaurantCache(restaurantId) {
  try {
    await delByPattern(`*restaurant:${restaurantId}*`);
    console.log(`✅ Cache cleared for restaurant: ${restaurantId}`);
  } catch (error) {
    console.error('❌ Error clearing specific restaurant cache:', error);
  }
}

// Cache middleware for restaurant routes
const cacheMiddleware = (duration = 1800) => { // 30 minutes default
  return async (req, res, next) => {
    // Skip cache for certain conditions
    if (req.query.nocache || req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const cacheKey = `restaurants:${req.originalUrl || req.url}`;
    
    try {
      // Try to get data from Redis
      const cachedData = await get(cacheKey);
      
      if (cachedData) {
        console.log('✅ [Cache] HIT for:', cacheKey);
        
        const data = JSON.parse(cachedData);
        
        // Add cache header for frontend
        res.set('X-Cache', 'HIT');
        
        return res.status(200).json({
          success: true,
          message: 'Restaurants retrieved successfully (from cache)',
          data: data,
          fromCache: true
        });
      }
      
      console.log('❌ [Cache] MISS for:', cacheKey);
      
      // Add cache header for frontend
      res.set('X-Cache', 'MISS');
      
      // Store the original res.json method
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (data.success && data.data) {
          set(cacheKey, JSON.stringify(data.data), duration)
            .then(success => {
              if (success) {
                console.log('✅ [Cache] Data cached successfully:', cacheKey);
              }
            })
            .catch(err => {
              console.error('❌ [Cache] Failed to cache data:', err);
            });
        }
        
        // Call the original res.json
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('❌ [Cache] Middleware error:', error);
      // If Redis fails, proceed without caching
      next();
    }
  };
};

module.exports = {
  clearRestaurantCaches,
  clearSpecificRestaurantCache,
  cacheMiddleware
};