// controllers/restaurantController.js
const { restaurantService } = require("../services/restaurantService.js");
const { responseSuccess, responseFailure, responseBadRequest } = require("../common/responses.js");
const { clearRestaurantCaches, } = require("../utils/cacheUtils.js");


console.log('🎮 [Controller] Restaurant controller loaded');

const restaurantController = {
  // Your existing methods
  async registerRestaurant(req, res) {
    try {
      const ownerId = req.user.id; 
      const data = { ...req.body, ownerId };

      const restaurant = await restaurantService.createRestaurant(data);
      
      // Clear all restaurant caches after creating new restaurant
      await clearRestaurantCaches();
      // await clearTenantCache('default', '*api/restaurants*');
      
      return responseSuccess(res, { restaurant }, "Restaurant registered successfully");
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  async getRestaurant(req, res) {
    try {
      console.log("🔹 Logged-in user:", req.user);
      const ownerId = req.user.id;
      const restaurant = await restaurantService.getRestaurantsByOwner(ownerId);
      console.log("🔹 Restaurant fetched:", restaurant);
      return responseSuccess(res, { restaurant });
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  // Fixed: Get all active restaurants (public route) WITH CACHING
// Get all restaurants (no pagination)
    async getAllRestaurants(req, res) {
      try {
        console.log('🔄 [Controller] GET /api/restaurants called');

        const result = await restaurantService.getAllRestaurants();

        console.log('✅ [Controller] Service result:', result);

        if (!result.success) {
          return responseFailure(res, result.message, result.statusCode);
        }

        // Return all restaurants with menus (no pagination)
        return res.status(200).json({
          success: true,
          data: {
            restaurants: result.data.restaurants || result.data,
          },
          message: result.message || 'Restaurants fetched successfully',
          fromCache: false,
        });
      } catch (error) {
        console.error('❌ [Controller] Error:', error);
        return responseFailure(res, error.message);
      }
    },


  // Search restaurants (public route) WITH CACHING
  async searchRestaurants(req, res) {
    try {
      const { q, category, limit } = req.query;
      
      const options = {
        limit: parseInt(limit) || 20
      };

      const result = await restaurantService.searchRestaurants(q, category, options);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return res.status(200).json({
        success: true,
        data: {
          restaurants: result.data.restaurants || result.data
        },
        message: result.message || 'Search completed successfully',
        fromCache: false
      });
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get categories (public route) WITH CACHING
  async getCategories(req, res) {
    try {
      const result = await restaurantService.getCategories();
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return res.status(200).json({
        success: true,
        data: {
          categories: result.data.categories || result.data
        },
        message: result.message || 'Categories fetched successfully',
        fromCache: false
      });
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get restaurant by ID (public route) WITH CACHING
  async getRestaurantById(req, res) {
    try {
      const { id } = req.params;

      const result = await restaurantService.getRestaurantById(id);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return res.status(200).json({
        success: true,
        data: {
          restaurant: result.data.restaurant || result.data
        },
        message: result.message || 'Restaurant fetched successfully',
        fromCache: false
      });
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get featured restaurants (public route) WITH CACHING
  async getFeaturedRestaurants(req, res) {
    try {
      const { limit } = req.query;

      const result = await restaurantService.getFeaturedRestaurants(parseInt(limit) || 10);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return res.status(200).json({
        success: true,
        data: {
          restaurants: result.data.restaurants || result.data
        },
        message: result.message || 'Featured restaurants fetched successfully',
        fromCache: false
      });
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get restaurants by cuisine type (public route) WITH CACHING
  async getRestaurantsByCuisine(req, res) {
    try {
      const { cuisineType } = req.params;
      const { limit } = req.query;

      const result = await restaurantService.getRestaurantsByCuisine(cuisineType, parseInt(limit) || 20);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return res.status(200).json({
        success: true,
        data: {
          restaurants: result.data.restaurants || result.data
        },
        message: result.message || 'Restaurants fetched successfully',
        fromCache: false
      });
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Update restaurant (owner only)
  async updateMyRestaurant(req, res) {
    try {
      const ownerId = req.user.id;
      const updateData = req.body;

      console.log('🔄 Updating restaurant for owner:', ownerId);
      console.log('📦 Update data:', updateData);

      const result = await restaurantService.updateRestaurantByOwner(ownerId, updateData);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      // Clear all restaurant caches after update
      await clearRestaurantCaches();
      // await clearTenantCache('default', '*api/restaurants*');
      
      return responseSuccess(res, result.data, result.message);
    } catch (err) {
      console.error('❌ Update restaurant error:', err);
      return responseFailure(res, err.message);
    }
  },

  // Enhanced get restaurants by owner (multiple restaurants)
  async getMyRestaurants(req, res) {
    try {
      const ownerId = req.user.id;

      const result = await restaurantService.getRestaurantsByOwner(ownerId);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Backward compatibility - alias for your existing getRestaurant method
async getMyRestaurant(req, res) {
  try {
    console.log("🧩 req.user:", req.user);

    const ownerId = req.user.id;
    console.log("🧩 Searching restaurants for ownerId:", ownerId);

    const result = await restaurantService.getRestaurantsByOwner(ownerId);
    console.log("🧩 Query result:", result);

    if (!result.success) {
      return responseFailure(res, result.message);
    }

    return responseSuccess(res, result.data, "Restaurants fetched successfully");
  } catch (err) {
    console.error("❌ getMyRestaurant error:", err);
    return responseFailure(res, err.message);
  }
},


  // Cache management endpoints
  async clearRestaurantCache(req, res) {
    try {
      await clearRestaurantCaches();
      return responseSuccess(res, null, 'Restaurant cache cleared successfully');
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  async getCacheStatus(req, res) {
    try {
      const redisClient = getRedisClient();
      const status = {
        connected: redisClient.connected,
        ready: redisClient.ready,
        cacheEnabled: process.env.REDIS_CACHE_ENABLED !== 'false'
      };
      
      return responseSuccess(res, { status }, 'Cache status retrieved');
    } catch (error) {
      return responseFailure(res, error.message);
    }
  }
};

module.exports = restaurantController;