import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, Clock, Star, ChevronRight, Loader } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useCart } from '../Context/CartContext';
import axios from 'axios';
import '../Styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null); // Track cache hits/misses

  // Create axios instance with base config
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
  });

  // Add request interceptor for auth tokens
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to track cache status
  api.interceptors.response.use(
    (response) => {
      // Check for cache headers
      const cacheHeader = response.headers['x-cache'];
      if (cacheHeader) {
        setCacheStatus(cacheHeader);
        console.log(`🔍 Cache Status: ${cacheHeader}`);
      }
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Fetch restaurants and categories from backend
  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [Frontend] Fetching restaurants');
      
      const response = await api.get('/api/restaurants');
      console.log(response.data.data.restaurants);
      
      // console.log('✅ [Frontend] Response received:', {
      //   success: response.data.success,
      //   count: response.data.data?.restaurants?.length,
      //   cacheStatus: response.headers['x-cache']
      // });
      
      if (response.data.success) {
        const restaurantList = response.data.data.restaurants || [];
        setRestaurants(restaurantList);
        console.log(`🎉 [Frontend] Loaded ${restaurantList.length} restaurants`);
      } else {
        throw new Error(response.data.message || 'Failed to fetch restaurants');
      }
    } catch (err) {
      console.error('💥 [Frontend] Error fetching restaurants:', err);
      
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setError('Network error: Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // try {
    //   console.log('🔄 [Frontend] Fetching categories');
      
    //   const response = await api.get('/api/restaurants/categories');
      
    //   if (response.data.success) {
    //     const categoryList = response.data.data.categories || [];
    //     setCategories(['All', ...categoryList]);
    //     console.log(`✅ [Frontend] Loaded ${categoryList.length} categories`);
    //   } else {
    //     // Fallback to default categories
    //     setCategories(['All', 'Fast Food', 'Pakistani', 'Chinese', 'Italian', 'Desserts', 'BBQ', 'Seafood', 'Healthy']);
    //   }
    // } catch (err) {
    //   console.error('❌ [Frontend] Error fetching categories:', err);
    //   // Fallback to default categories
      setCategories(['All', 'Fast Food', 'Pakistani', 'Chinese', 'Italian', 'Desserts', 'BBQ', 'Seafood', 'Healthy']);
    // }
  };

  const searchRestaurants = async (query) => {
    // try {
    //   console.log(`🔍 [Frontend] Searching: "${query}"`);
      
    //   const response = await api.get('/api/restaurants/search', {
    //     params: { q: query }
    //   });
      
    //   if (response.data.success) {
    //     const results = response.data.data.restaurants || [];
    //     setRestaurants(results);
    //     console.log(`✅ [Frontend] Found ${results.length} results`);
    //   }
    // } catch (err) {
    //   console.error('❌ [Frontend] Search error:', err);
    //   // Don't show error for search, just return empty results
    //   setRestaurants([]);
    // }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchRestaurants(searchQuery);
      } else {
        fetchRestaurants(); // Reset to all restaurants
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter restaurants by category (client-side)
  const filteredRestaurants = restaurants.filter(r => 
    selectedCategory === 'All' || r.basicInfo?.cuisineType?.includes(selectedCategory)
  );

  const featuredRestaurants = filteredRestaurants.filter(r => r.featured);
  const allRestaurants = filteredRestaurants.filter(r => !r.featured);

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  const getRestaurantImage = (restaurant) => {
    if (restaurant.basicInfo?.logo) return restaurant.basicInfo.logo;
    
    // Fallback emojis based on cuisine type
    const cuisine = restaurant.basicInfo?.cuisineType?.[0] || '';
    const emojiMap = {
      'Fast Food': '🍔',
      'Pakistani': '🍛',
      'Chinese': '🥡',
      'Italian': '🍕',
      'Desserts': '🍰',
      'BBQ': '🍖',
      'Seafood': '🐟',
      'Healthy': '🥗'
    };
    return emojiMap[cuisine] || '🏪';
  };

  const getPriceRange = (restaurant) => {
    const avgPrice = restaurant.settings?.averagePrice;
    if (!avgPrice) return '$$';
    if (avgPrice < 500) return '$';
    if (avgPrice < 1000) return '$$';
    if (avgPrice < 2000) return '$$$';
    return '$$$$';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="loading-spinner" size={48} />
        <p>Loading restaurants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading restaurants</h2>
        <p>{error}</p>
        <button onClick={fetchRestaurants} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-left">
            <h1 className="logo" onClick={() => navigate('/')}>
              DineSphere
            </h1>
            <div className="location">
              <MapPin size={20} className="text-orange-500" />
              <span>Rawalpindi, Pakistan</span>
            </div>
          </div>
          <div className="nav-right">
            {user ? (
              <>
                <button 
                  onClick={() => navigate('/cart')} 
                  className="cart-btn"
                >
                  <ShoppingCart size={24} className="text-gray-700" />
                  {cartCount > 0 && (
                    <span className="cart-badge">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => navigate('/profile')} 
                  className="profile-btn"
                >
                  <User size={24} className="text-gray-700" />
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <button 
                  onClick={() => navigate('/restaurant-register')}
                  className="add-restaurant-btn"
                >
                  Add Restaurant
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="sign-in-btn"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          What would you like to eat today?
        </h1>
        <div className="search-container">
          <Search className="search-icon" size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            placeholder="Search for restaurants, cuisines, or dishes..."
          />
        </div>
        
        {/* Cache status indicator (for development) */}
        {process.env.NODE_ENV === 'development' && cacheStatus && (
          <div style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: cacheStatus === 'HIT' ? '#dcfce7' : '#fef3c7',
            color: cacheStatus === 'HIT' ? '#166534' : '#92400e',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            🔍 Cache: {cacheStatus}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h3 className="categories-title">Popular Categories</h3>
        <div className="categories-container">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      {featuredRestaurants.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Featured Restaurants</h2>
            <button className="view-all-btn" onClick={() => setSelectedCategory('All')}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="restaurants-grid">
            {featuredRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="restaurant-card"
                onClick={() => handleRestaurantClick(restaurant._id)}
              >
                <div className="restaurant-image">
                  {getRestaurantImage(restaurant)}
                </div>
                <div className="restaurant-info">
                  <div className="restaurant-header">
                    <h3 className="restaurant-name">{restaurant.basicInfo?.name}</h3>
                    <div className="rating">
                      <Star size={16} className="fill-white" />
                      {restaurant.rating || '4.0'}
                    </div>
                  </div>
                  <p className="restaurant-cuisine">
                    {restaurant.basicInfo?.description || 'Delicious food awaits'}
                  </p>
                  <div className="restaurant-meta">
                    <div className="delivery-time">
                      <Clock size={18} />
                      {restaurant.settings?.preparationTime || '30-40'} min
                    </div>
                    <div className="price-range">
                      {getPriceRange(restaurant)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Restaurants */}
      <section className="all-restaurants-section">
        <div className="section-header">
          <h2 className="section-title">
            {selectedCategory === 'All' ? 'All Restaurants' : selectedCategory + ' Restaurants'}
          </h2>
          <span className="text-gray-600">
            {allRestaurants.length} restaurants found
          </span>
        </div>
        <div className="restaurants-grid">
          {allRestaurants.length > 0 ? (
            allRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="restaurant-card"
                onClick={() => handleRestaurantClick(restaurant._id)}
              >
                <div className="restaurant-image">
                  {getRestaurantImage(restaurant)}
                </div>
                <div className="restaurant-info">
                  <div className="restaurant-header">
                    <h3 className="restaurant-name">{restaurant.basicInfo?.name}</h3>
                    <div className="rating">
                      <Star size={16} className="fill-white" />
                      {restaurant.rating || '4.0'}
                    </div>
                  </div>
                  <p className="restaurant-cuisine">
                    {restaurant.basicInfo?.description || 'Delicious food awaits'}
                  </p>
                  <div className="restaurant-meta">
                    <div className="delivery-time">
                      <Clock size={18} />
                      {restaurant.settings?.preparationTime || '30-40'} min
                    </div>
                    <div className="price-range">
                      {getPriceRange(restaurant)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No restaurants found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;