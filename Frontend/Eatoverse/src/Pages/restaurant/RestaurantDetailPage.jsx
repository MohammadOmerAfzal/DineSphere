import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, ChevronRight, Star, Plus, MapPin, Clock, DollarSign, Minus } from 'lucide-react';
import { useCart } from '../../Context/CartContext';
import axios from 'axios';
import '../../Styles/RestaurantDetail.css';

const RestaurantDetailPage = () => {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant details on mount
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/restaurants/${id}`);
        
        if (response.data.success) {
          console.log('Restaurant data:', response.data.data.restaurant);
          setRestaurant(response.data.data.restaurant);
        } else {
          setError(response.data.message || 'Failed to fetch restaurant');
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(err.response?.data?.message || err.message || 'Error fetching restaurant');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  const handleAddToCart = (item) => {
    addToCart({
      ...item,
      restaurantId: restaurant._id,
      restaurantName: restaurant.basicInfo.name
    });
    console.log('Added to cart:', item.name);
  };

  // Format business hours
  const formatBusinessHours = () => {
    if (!restaurant?.businessHours) return 'Closed';
    
    // const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const todayHours = restaurant.businessHours.find(hour => hour.day === today);
    
    if (todayHours && todayHours.isOpen) {
      return `Open Today ${todayHours.openingTime} - ${todayHours.closingTime}`;
    } else {
      return 'Closed Today';
    }
  };

  // Get all unique categories from menu items
  const getCategories = () => {
    if (!restaurant?.menuItems) return ['All'];
    const categories = [...new Set(restaurant.menuItems.map(item => item.category).filter(Boolean))];
    return ['All', ...categories];
  };

  const [selectedCat, setSelectedCat] = useState('All');

  const filteredItems = selectedCat === 'All' 
    ? (restaurant?.menuItems || [])
    : (restaurant?.menuItems || []).filter(item => item.category === selectedCat);

  if (loading) return (
    <div className="restaurant-detail-container">
      <div className="loading-container">Loading restaurant details...</div>
    </div>
  );

  if (error) return (
    <div className="restaurant-detail-container">
      <div className="error-container">Error: {error}</div>
    </div>
  );

  if (!restaurant) return (
    <div className="restaurant-detail-container">
      <div className="error-container">Restaurant not found</div>
    </div>
  );

  return (
    <div className="restaurant-detail-container">
      {/* Navigation */}
      <nav className="restaurant-nav">
        <div className="nav-container">
          <div className="nav-content">
            <button onClick={() => navigate('/')} className="back-button">
              <ChevronRight className="back-icon" />
              <span className="back-text">Back</span>
            </button>
            <button onClick={() => navigate('/cart')} className="cart-button">
              <ShoppingCart className="cart-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className="restaurant-content">
        {/* Restaurant Header */}
        <div className="restaurant-header-card">
          <div className="restaurant-header-content">
            <div className="restaurant-logo">
              {restaurant.basicInfo?.logo || '🍽️'}
            </div>
            <div className="restaurant-info">
              <h1 className="restaurant-title">{restaurant.basicInfo?.name}</h1>
              <p className="restaurant-subtitle">
                {restaurant.basicInfo?.cuisineType?.join(', ') || 'Multiple cuisines'}
              </p>
              <p className="restaurant-description">
                {restaurant.basicInfo?.description}
              </p>
              
              <div className="restaurant-meta">
                <div className="meta-item">
                  <Star className="meta-icon" />
                  <span className="meta-rating">{restaurant.statistics?.averageRating || 0}</span>
                  <span className="meta-reviews">({restaurant.statistics?.totalReviews || 0} reviews)</span>
                </div>
                <div className="meta-item">
                  <Clock className="meta-icon" />
                  <span className="meta-text">{formatBusinessHours()}</span>
                </div>
                <div className="meta-item">
                  <MapPin className="meta-icon" />
                  <span className="meta-text">{restaurant.address?.city || 'Location not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Details Card */}
        <div className="details-card">
          <h3 className="details-title">Restaurant Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <DollarSign className="detail-icon" size={18} />
              <div className="detail-content">
                <span className="detail-label">Minimum Order</span>
                <span className="detail-value">PKR {restaurant.settings?.minimumOrder || 0}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <Clock className="detail-icon" size={18} />
              <div className="detail-content">
                <span className="detail-label">Preparation Time</span>
                <span className="detail-value">{restaurant.settings?.preparationTime || 0} min</span>
              </div>
            </div>
            
            <div className="detail-item">
              <DollarSign className="detail-icon" size={18} />
              <div className="detail-content">
                <span className="detail-label">Delivery Fee</span>
                <span className="detail-value">PKR {restaurant.settings?.deliveryFee || 0}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <MapPin className="detail-icon" size={18} />
              <div className="detail-content">
                <span className="detail-label">Delivery Radius</span>
                <span className="detail-value">{restaurant.settings?.deliveryRadius || 0} km</span>
              </div>
            </div>
          </div>
          
          <div className="contact-info">
            <h4 className="contact-title">Contact Information</h4>
            <p className="contact-item">
              <strong>Phone:</strong> {restaurant.contact?.phone || 'Not provided'}
            </p>
            <p className="contact-item">
              <strong>Email:</strong> {restaurant.contact?.email || 'Not provided'}
            </p>
            <p className="contact-item">
              <strong>Address:</strong> {restaurant.address?.addressLine1 || 'Address not provided'}
            </p>
          </div>
        </div>

        {/* Menu Section */}
        <div className="menu-section">
          <div className="menu-header">
            <h2 className="menu-title">Menu</h2>
            <div className="menu-stats">
              {restaurant.menuItems?.length || 0} items available
            </div>
          </div>

          {/* Category Filters - Only show if there are categories */}
          {getCategories().length > 1 && (
            <div className="category-filters">
              {getCategories().map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`category-filter ${selectedCat === cat ? 'category-filter-active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu Items */}
          <div className="menu-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items-message">
                {restaurant.menuItems?.length === 0 
                  ? 'No menu items available yet' 
                  : 'No items found in this category'
                }
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div key={item._id || index} className="menu-item-card">
                  <div className="menu-item-content">
                    <div className="menu-item-info">
                      <h3 className="menu-item-name">{item.name}</h3>
                      {item.description && (
                        <p className="menu-item-description">{item.description}</p>
                      )}
                      {item.category && (
                        <span className="menu-item-category">{item.category}</span>
                      )}
                      <div className="menu-item-footer">
                        <span className="menu-item-price">PKR {item.price}</span>
                        <button 
                          onClick={() => handleAddToCart(item)} 
                          className="add-to-cart-button"
                        >
                          <Plus className="add-icon" /> Add
                        </button>
                      </div>
                    </div>
                    {item.image && (
                      <div className="menu-item-image">
                        <img src={item.image} alt={item.name} className="item-image" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;