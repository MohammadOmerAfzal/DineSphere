// services/restaurantService.js
const Restaurant = require("../models/restaurantModel.js");
const { restaurantRepository } = require("../repository/restaurantRepository.js");
const { clearRestaurantCaches } = require("../utils/cacheUtils.js");

const restaurantService = {
  // ✅ Create new restaurant (for admin/system)
  async createRestaurant(data) {
    try {
      const restaurant = new Restaurant(data);
      await restaurant.save();

      // Clear cache after new restaurant is added
      await clearRestaurantCaches();

      return {
        success: true,
        data: { restaurant },
        message: "Restaurant created successfully"
      };
    } catch (error) {
      console.error("❌ [Service] Create restaurant error:", error);
      throw new Error(`Create restaurant failed: ${error.message}`);
    }
  },

  // ✅ Update restaurant by ID
  async updateRestaurant(id, data) {
    try {
      const updated = await Restaurant.findByIdAndUpdate(id, data, { new: true });

      if (!updated) {
        return { success: false, message: "Restaurant not found", statusCode: 404 };
      }

      await clearRestaurantCaches();

      return {
        success: true,
        data: { restaurant: updated },
        message: "Restaurant updated successfully"
      };
    } catch (error) {
      console.error("❌ [Service] Update restaurant error:", error);
      throw new Error(`Update restaurant failed: ${error.message}`);
    }
  },

  // ✅ Get all active restaurants (cached)
// services/restaurantService.js
async getAllRestaurants() {
    try {
      console.log("🔄 [Service] Fetching all restaurants (no filter, no pagination)...");

      const restaurants = await restaurantRepository.findAll(); // Fetch everything

      console.log(`✅ [Service] Found ${restaurants.length} restaurants`);

      return {
        success: true,
        data: { restaurants },
        message: "All restaurants fetched successfully",
      };
    } catch (error) {
      console.error("❌ [Service] Error fetching restaurants:", error);
      return {
        success: false,
        message: "Failed to fetch restaurants",
        error: error.message,
        statusCode: 500,
      };
    }
  },
  


  // ✅ Search restaurants (uses repository for advanced search)
  async searchRestaurants(searchQuery, category, options = {}) {
    try {
      const restaurants = await restaurantRepository.searchRestaurants(searchQuery, category, options);

      return {
        success: true,
        data: { restaurants },
        message: "Search results fetched successfully"
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  },

  // ✅ Register restaurant (owner flow)
  async registerRestaurant(restaurantData, ownerId) {
    try {
      // Check if restaurant name already exists
      const nameExists = await restaurantRepository.existsByName(restaurantData.basicInfo.name);
      if (nameExists) {
        return {
          success: false,
          message: "Restaurant name already exists",
          statusCode: 400
        };
      }

      const dataWithOwner = { ...restaurantData, ownerId: ownerId };
      const restaurant = await restaurantRepository.create(dataWithOwner);

      // Clear cache after registration
      await clearRestaurantCaches();

      return {
        success: true,
        data: { restaurant },
        message: "Restaurant registered successfully"
      };
    } catch (error) {
      console.error("❌ [Service] Register restaurant error:", error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  // ✅ Get restaurants by owner
  async getRestaurantsByOwner(ownerId, options = {}) {
    try {
      const restaurants = await restaurantRepository.findByOwner(ownerId, options);
      console.log("Checking Output");
      console.log(restaurants);
      return {
        success: true,
        data: { restaurants },
        message: "Restaurants fetched successfully"
      };
    } catch (error) {
      throw new Error(`Failed to fetch owner restaurants: ${error.message}`);
    }
  },

  // ✅ Get restaurant by ID (with optional populate)
  async getRestaurantById(restaurantId, populateFields = []) {
    try {
      const restaurant = await restaurantRepository.findById(restaurantId, populateFields);
      if (!restaurant) {
        return { success: false, message: "Restaurant not found", statusCode: 404 };
      }

      return {
        success: true,
        data: { restaurant },
        message: "Restaurant fetched successfully"
      };
    } catch (error) {
      throw new Error(`Failed to fetch restaurant: ${error.message}`);
    }
  },

  // ✅ Update restaurant by owner (secured)
  async updateRestaurantByOwner(ownerId, updateData) {
    try {
      console.log("🎯 [Service] Updating restaurant for owner:", ownerId);

      const restaurant = await restaurantRepository.findOneByOwner(ownerId);
      if (!restaurant) {
        return { success: false, message: "Restaurant not found", statusCode: 404 };
      }

      // Validate unique name if updating name
      if (updateData.basicInfo?.name) {
        const nameExists = await restaurantRepository.existsByName(updateData.basicInfo.name, restaurant._id);
        if (nameExists) {
          return { success: false, message: "Restaurant name already exists", statusCode: 400 };
        }
      }

      const updatedRestaurant = await restaurantRepository.update(restaurant._id, updateData);
      // await clearRestaurantCaches();

      return {
        success: true,
        data: { restaurant: updatedRestaurant },
        message: "Restaurant updated successfully"
      };
    } catch (error) {
      console.error("❌ [Service] Update restaurant by owner error:", error);
      throw new Error(`Update failed: ${error.message}`);
    }
  },

  // ✅ Get featured restaurants
  async getFeaturedRestaurants(limit = 10) {
    try {
      const restaurants = await restaurantRepository.getFeaturedRestaurants(limit);
      return {
        success: true,
        data: { restaurants },
        message: "Featured restaurants fetched successfully"
      };
    } catch (error) {
      throw new Error(`Failed to fetch featured restaurants: ${error.message}`);
    }
  },

  // ✅ Get restaurants by cuisine
  async getRestaurantsByCuisine(cuisineType, limit = 20) {
    try {
      const restaurants = await restaurantRepository.getByCuisineType(cuisineType, limit);
      return {
        success: true,
        data: { restaurants },
        message: `${cuisineType} restaurants fetched successfully`
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${cuisineType} restaurants: ${error.message}`);
    }
  },

  // ✅ Update restaurant status
  async updateRestaurantStatus(restaurantId, status) {
    try {
      const updatedRestaurant = await restaurantRepository.updateStatus(restaurantId, status);
      if (!updatedRestaurant) {
        return { success: false, message: "Restaurant not found", statusCode: 404 };
      }

      await clearRestaurantCaches();

      return {
        success: true,
        data: { restaurant: updatedRestaurant },
        message: `Restaurant status updated to ${status}`
      };
    } catch (error) {
      throw new Error(`Status update failed: ${error.message}`);
    }
  }
};

module.exports = { restaurantService };
