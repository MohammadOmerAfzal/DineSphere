import React, { useState } from 'react';
import { Save, Upload, MapPin, Clock, Phone, Mail } from 'lucide-react';
import '../../Styles/RestaurantSettingsPage.css';

const RestaurantSettingsPage = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: 'Burger Hub',
    email: 'contact@burgerhub.com',
    phone: '+92 300 1234567',
    address: 'House #123, Street 5, Satellite Town, Rawalpindi',
    cuisine: 'Fast Food',
    description: 'Best burgers in town with fresh ingredients and fast delivery.',
    openingTime: '11:00',
    closingTime: '23:00',
    deliveryFee: 50,
    minOrder: 300
  });

  const [logo, setLogo] = useState('🍔');
  const [bannerImage, setBannerImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRestaurantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (emoji) => {
    setLogo(emoji);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Saving restaurant data:', { ...restaurantData, logo, bannerImage });
    setIsLoading(false);
    
    // Show success message
    alert('Restaurant settings saved successfully!');
  };

  const foodEmojis = ['🍔', '🍕', '🌭', '🥗', '🍛', '🍗', '🥘', '🍣', '🌮', '🥪'];

  return (
    <div className="restaurant-settings-container">
      <nav className="settings-nav">
        <div className="nav-content">
          <h1 className="nav-title">Restaurant Settings</h1>
        </div>
      </nav>

      <div className="settings-content">
        <form onSubmit={handleSave} className="settings-form">
          {/* Logo Upload Section */}
          <div className="settings-card">
            <h3 className="section-title">Restaurant Logo</h3>
            <div className="logo-section">
              <div className="logo-preview-container">
                <div className="logo-display">
                  {logo}
                </div>
                <p className="logo-label">Current Logo</p>
              </div>
              
              <div className="logo-options">
                <p className="options-label">Choose a logo emoji:</p>
                <div className="emoji-grid">
                  {foodEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleLogoChange(emoji)}
                      className={`emoji-button ${logo === emoji ? 'emoji-active' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Banner Upload Section */}
          <div className="settings-card">
            <h3 className="section-title">Banner Image</h3>
            <div className="banner-upload-area">
              {bannerImage ? (
                <div className="banner-preview">
                  <img 
                    src={bannerImage} 
                    alt="Restaurant banner" 
                    className="banner-image"
                  />
                  <button
                    type="button"
                    onClick={() => setBannerImage(null)}
                    className="remove-banner-button"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="banner-upload-placeholder">
                  <Upload className="upload-icon" />
                  <div className="upload-content">
                    <p className="upload-text">Upload a banner image for your restaurant</p>
                    <label className="upload-button">
                      <Upload className="button-icon" />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="file-input"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="settings-card">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Restaurant Name</label>
                <input
                  type="text"
                  name="name"
                  value={restaurantData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cuisine Type</label>
                <select
                  name="cuisine"
                  value={restaurantData.cuisine}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option>Fast Food</option>
                  <option>Pakistani</option>
                  <option>Chinese</option>
                  <option>Italian</option>
                  <option>Desserts</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={restaurantData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="settings-card">
            <h3 className="section-title">Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label with-icon">
                  <Mail className="label-icon" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={restaurantData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label with-icon">
                  <Phone className="label-icon" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={restaurantData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label with-icon">
                  <MapPin className="label-icon" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={restaurantData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="form-textarea"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Hours & Delivery */}
          <div className="settings-card">
            <h3 className="section-title">Business Settings</h3>
            <div className="business-grid">
              <div className="form-group">
                <label className="form-label with-icon">
                  <Clock className="label-icon" />
                  Opening Time
                </label>
                <input
                  type="time"
                  name="openingTime"
                  value={restaurantData.openingTime}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label with-icon">
                  <Clock className="label-icon" />
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closingTime"
                  value={restaurantData.closingTime}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Fee (PKR)</label>
                <input
                  type="number"
                  name="deliveryFee"
                  value={restaurantData.deliveryFee}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Minimum Order (PKR)</label>
                <input
                  type="number"
                  name="minOrder"
                  value={restaurantData.minOrder}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="save-button-container">
            <button
              type="submit"
              disabled={isLoading}
              className="save-button"
            >
              <Save className="button-icon" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSettingsPage;