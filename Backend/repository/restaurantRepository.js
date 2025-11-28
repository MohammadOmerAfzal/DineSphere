// repository/restaurantRepository.js
const Restaurant = require("../models/restaurantModel");

const restaurantRepository = {
  // Your existing methods
  async create(data) {
    const restaurant = new Restaurant(data);
    return restaurant.save();
  },


    async findAll() {
    try {
      console.log("🔍 [Repository] Fetching all restaurants (no filters)...");
      const restaurants = await Restaurant.find();
      console.log(`✅ [Repository] Found ${restaurants.length} restaurants`);
      return restaurants;
    } catch (error) {
      console.error("❌ [Repository] Error in findAll:", error);
      throw error;
    }
  },

  async findByOwner(ownerId) {
    console.log("first one entered")
    console.log(Restaurant.find({ ownerId: ownerId }));
    return Restaurant.find({ ownerId: ownerId }); // Fixed: changed ownerId to owner
  },

  async findById(id) {
    return Restaurant.findById(id);
  },


async findAllActive(filters = {}, options = {}) {
  try {
    console.log('🔍 [Repository] findAllActive called with filters:', filters, 'options:', options);
    
    const {
      page = 1,
      limit = 50,
      sort = { rating: -1, createdAt: -1 },
      select = 'basicInfo settings rating featured status'
    } = options;

    const query = { ...filters }; // No status filter
    console.log('📝 [Repository] MongoDB query:', query);

    const restaurants = await Restaurant.find(query)
      .select(select)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    console.log('✅ [Repository] Found restaurants:', restaurants.length);
    console.log('📋 [Repository] Sample restaurant:', restaurants[0]);

    const total = await Restaurant.countDocuments(query);
    console.log('📊 [Repository] Total restaurants in DB:', total);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ [Repository] Error in findAllActive:', error);
    throw error;
  }
},

  // Search restaurants with text and category filters
  async searchRestaurants(searchQuery, category, options = {}) {
    const {
      limit = 20,
      sort = { rating: -1 },
      select = 'basicInfo settings rating featured'
    } = options;

    let query = { status: 'active' };

    if (searchQuery) {
      query.$or = [
        { 'basicInfo.name': { $regex: searchQuery, $options: 'i' } },
        { 'basicInfo.description': { $regex: searchQuery, $options: 'i' } },
        { 'basicInfo.cuisineType': { $in: [new RegExp(searchQuery, 'i')] } },
        { 'basicInfo.tags': { $in: [new RegExp(searchQuery, 'i')] } }
      ];
    }

    if (category && category !== 'All') {
      query['basicInfo.cuisineType'] = category;
    }

    return await Restaurant.find(query)
      .select(select)
      .sort(sort)
      .limit(limit)
      .lean();
  },

  // Get distinct cuisine categories
  async getDistinctCategories(filters = {}) {
    return await Restaurant.distinct('basicInfo.cuisineType', { 
      status: 'active', 
      ...filters 
    });
  },

  // Find restaurant by ID with population
  async findById(id, populateFields = []) {
    let query = Restaurant.findById(id);
    
    if (populateFields.includes('owner')) {
      query = query.populate('owner', 'email profile.firstName profile.lastName');
    }

    if (populateFields.includes('menu')) {
      query = query.populate('settings.menuItems');
    }

    return await query;
  },

  // Find restaurant by owner with options
  // async findByOwner(ownerId, options = {}) {
  //   console.log("entered second");
  //   const {
  //     select = 'basicInfo settings status',
  //     sort = { createdAt: -1 }
  //   } = options;

  //   return await Restaurant.find({ ownerId: ownerId })
  //     .select(select)
  //     .sort(sort)
  //     .lean();
  // },

  // Find single restaurant by owner
  async findOneByOwner(ownerId) {
    return await Restaurant.findOne({ ownerId: ownerId });
  },

  // Update restaurant
  async update(id, updateData, options = {}) {
    const { runValidators = true, new: returnNew = true } = options;
    
    return await Restaurant.findByIdAndUpdate(
      id,
      updateData,
      { 
        runValidators,
        new: returnNew
      }
    );
  },

  // Find restaurant by ID and owner (for ownership verification)
  async findByIdAndOwner(id, ownerId) {
    return await Restaurant.findOne({ _id: id, ownerId: ownerId });
  },

  // Update restaurant status
  async updateStatus(id, status) {
    return await Restaurant.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  },

  // Get featured restaurants
  async getFeaturedRestaurants(limit = 10) {
    return await Restaurant.find({ 
      status: 'active', 
      featured: true 
    })
    .select('basicInfo settings rating featured')
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  },

  // Get restaurants by cuisine type
  async getByCuisineType(cuisineType, limit = 20) {
    return await Restaurant.find({
      status: 'active',
      'basicInfo.cuisineType': cuisineType
    })
    .select('basicInfo settings rating')
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  },

  // Check if restaurant name exists (for validation)
  async existsByName(name, excludeId = null) {
    const query = { 'basicInfo.name': new RegExp(`^${name}$`, 'i') };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Restaurant.exists(query);
  },

  // Get restaurants with statistics
  async getRestaurantsWithStats(filters = {}) {
    return await Restaurant.aggregate([
      { $match: { status: 'active', ...filters } },
      {
        $group: {
          _id: null,
          totalRestaurants: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalFeatured: {
            $sum: { $cond: ['$featured', 1, 0] }
          }
        }
      }
    ]);
  },

  // Get popular restaurants (by rating and order count)
  async getPopularRestaurants(limit = 10) {
    return await Restaurant.find({ status: 'active' })
      .select('basicInfo settings rating featured')
      .sort({ rating: -1, 'settings.orderCount': -1 })
      .limit(limit)
      .lean();
  },

  // Get restaurants near location (basic implementation)
  async getRestaurantsNearLocation(city, limit = 20) {
    return await Restaurant.find({
      status: 'active',
      'address.city': new RegExp(city, 'i')
    })
    .select('basicInfo settings rating address')
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  },

  // Increment order count
  async incrementOrderCount(restaurantId) {
    return await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $inc: { 'settings.orderCount': 1 } },
      { new: true }
    );
  },

  // Update restaurant rating
  async updateRating(restaurantId, newRating) {
    return await Restaurant.findByIdAndUpdate(
      restaurantId,
      { 
        $set: { rating: newRating },
        $inc: { 'settings.reviewCount': 1 }
      },
      { new: true }
    );
  },

  // Delete restaurant (soft delete)
  async softDelete(id) {
    return await Restaurant.findByIdAndUpdate(
      id,
      { status: 'deleted' },
      { new: true }
    );
  },

  // Get restaurants by multiple IDs
  async findByIds(ids, options = {}) {
    const {
      select = 'basicInfo settings rating'
    } = options;

    return await Restaurant.find({
      _id: { $in: ids },
      status: 'active'
    })
    .select(select)
    .lean();
  },

  // Check if user owns any restaurant
  async userOwnsRestaurant(ownerId) {
    return await Restaurant.exists({ ownerId: ownerId, status: { $ne: 'deleted' } });
  }
};

module.exports = { restaurantRepository };