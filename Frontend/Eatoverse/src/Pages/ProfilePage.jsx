import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  User, 
  Package, 
  TrendingUp,
  MapPin,
  Bell,
  Save,
  Plus,
  Edit,
  Trash2,
  LogOut
} from 'lucide-react';
// import { colors } from '../constant/colors';
import { useAuth } from '../Context/AuthContext';
import '../Styles/ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+92 300 1234567'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotionalEmails: false,
    newRestaurantAlerts: true,
    specialOffers: true
  });

  const [savedAddresses] = useState([
    {
      id: 1,
      type: 'Home',
      address: 'House #123, Street 5, Satellite Town, Rawalpindi',
      isDefault: true
    },
    {
      id: 2,
      type: 'Office',
      address: 'Plaza 45, Blue Area, Islamabad',
      isDefault: false
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    console.log('Saving changes:', formData);
    alert('Profile updated successfully!');
  };

  const handleAddAddress = () => {
    console.log('Adding new address');
    // navigate('/add-address');
  };

  const handleEditAddress = (addressId) => {
    console.log('Editing address:', addressId);
    // navigate(`/edit-address/${addressId}`);
  };

  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      console.log('Deleting address:', addressId);
      alert('Address deleted successfully!');
    }
  };

  const handleSetDefaultAddress = (addressId) => {
    console.log('Setting default address:', addressId);
    alert('Default address updated!');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="profile-container">
      <nav className="profile-nav">
        <div className="nav-container">
          <button 
            onClick={() => navigate('/')}
            className="back-button"
          >
            <ChevronRight className="back-icon" />
            <span className="back-text">Back</span>
          </button>
        </div>
      </nav>

      <div className="profile-content">
        <div className="profile-layout">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="sidebar-card">
              <div className="user-avatar">
                <User className="avatar-icon" />
              </div>
              <h2 className="user-name">{user?.name}</h2>
              <p className="user-email">{user?.email}</p>
              
              <div className="sidebar-actions">
                <button
                  onClick={() => navigate('/orders')}
                  className="sidebar-button primary"
                >
                  <Package className="button-icon" />
                  My Orders
                </button>
                <button
                  onClick={() => navigate('/metrics')}
                  className="sidebar-button secondary"
                >
                  <TrendingUp className="button-icon" />
                  Live Metrics
                </button>
                <button
                  onClick={handleLogout}
                  className="sidebar-button logout"
                >
                  <LogOut className="button-icon" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {/* Personal Information */}
            <div className="profile-section">
              <h3 className="section-title">Personal Information</h3>
              <form onSubmit={handleSaveChanges} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="save-button"
                >
                  <Save className="button-icon" />
                  Save Changes
                </button>
              </form>
            </div>

            {/* Saved Addresses */}
            <div className="profile-section">
              <div className="section-header">
                <h3 className="section-title">Saved Addresses</h3>
                <button
                  onClick={handleAddAddress}
                  className="add-button"
                >
                  <Plus className="button-icon" />
                  Add New
                </button>
              </div>
              
              <div className="addresses-list">
                {savedAddresses.map(address => (
                  <div key={address.id} className={`address-card ${address.isDefault ? 'address-default' : ''}`}>
                    <div className="address-content">
                      <div className="address-header">
                        <div className="address-type">
                          <MapPin className="address-icon" />
                          <span className="address-type-text">{address.type}</span>
                          {address.isDefault && (
                            <span className="default-badge">Default</span>
                          )}
                        </div>
                        <div className="address-actions">
                          <button 
                            onClick={() => handleEditAddress(address.id)}
                            className="action-button edit"
                          >
                            <Edit className="action-icon" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="action-button delete"
                          >
                            <Trash2 className="action-icon" />
                          </button>
                        </div>
                      </div>
                      <p className="address-text">{address.address}</p>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="set-default-button"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="profile-section">
              <div className="section-header">
                <h3 className="section-title">Notifications</h3>
                <Bell className="section-icon" />
              </div>
              
              <div className="notifications-list">
                <label className="notification-item">
                  <div className="notification-content">
                    <span className="notification-label">Order Updates</span>
                    <span className="notification-description">Get notified about your order status</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.orderUpdates}
                    onChange={() => handleNotificationChange('orderUpdates')}
                    className="notification-toggle"
                  />
                </label>
                
                <label className="notification-item">
                  <div className="notification-content">
                    <span className="notification-label">Promotional Emails</span>
                    <span className="notification-description">Receive offers and promotions</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.promotionalEmails}
                    onChange={() => handleNotificationChange('promotionalEmails')}
                    className="notification-toggle"
                  />
                </label>
                
                <label className="notification-item">
                  <div className="notification-content">
                    <span className="notification-label">New Restaurant Alerts</span>
                    <span className="notification-description">Get notified when new restaurants open</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.newRestaurantAlerts}
                    onChange={() => handleNotificationChange('newRestaurantAlerts')}
                    className="notification-toggle"
                  />
                </label>
                
                <label className="notification-item">
                  <div className="notification-content">
                    <span className="notification-label">Special Offers</span>
                    <span className="notification-description">Exclusive deals and discounts</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.specialOffers}
                    onChange={() => handleNotificationChange('specialOffers')}
                    className="notification-toggle"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;