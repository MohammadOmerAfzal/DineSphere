// repository/restaurantOwnerRepository.js
const RestaurantOwner = require("../models/restaurantOwnerModel");

const restaurantOwnerRepository = {
  findByEmail: async (email) => RestaurantOwner.findOne({ email }),
  findByGoogleId: async (id) => RestaurantOwner.findOne({ googleId: id }),
  createOwner: async (data) => RestaurantOwner.create(data),
  findById: async (id) => RestaurantOwner.findById(id).select("-password"),
  updateOwner: async (id, data) => RestaurantOwner.findByIdAndUpdate(id, data, { new: true }).select("-password"),
  
  async linkGoogleAccount(ownerId, googleId, photo) {
    return await RestaurantOwner.findByIdAndUpdate(
      ownerId,
      { 
        googleId, 
        photo,
        emailVerified: true 
      },
      { new: true }
    ).select("-password");
  },

  async updateRestaurant(ownerId, restaurantId) {
    return await RestaurantOwner.findByIdAndUpdate(
      ownerId,
      { restaurantId },
      { new: true }
    ).select("-password");
  }
};

module.exports = { restaurantOwnerRepository };