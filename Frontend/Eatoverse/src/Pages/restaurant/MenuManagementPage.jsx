import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X, Save, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { colors } from '../../constant/colors';
import '../../Styles/MenuManagement.css';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fixed categories array - no duplicates
  const categories = ['All', 'Burgers', 'Sides', 'Starters', 'Beverages', 'Main Course', 'Appetizers', 'Salads', 'Desserts'];

  // Fetch restaurant and menu items
  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("ownerToken");
      
      // Fetch restaurant data
      const restaurantResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(restaurantResponse);

      const restaurantResult = await restaurantResponse.json();

      console.log(restaurantResult.data.restaurant.data.restaurants[0].menuItems)

      if (!restaurantResponse.ok || !restaurantResult.success) {
        throw new Error(restaurantResult.message || 'Failed to fetch restaurant data');
      }

      if (!restaurantResult.data.restaurant) {
        throw new Error('No restaurant found. Please register a restaurant first.');
      }

      setRestaurant(restaurantResult.data.restaurant);
      
      // Menu items are stored in the restaurant object
      const restaurantMenuItems = restaurantResult.data.restaurant.data.restaurants[0].menuItems|| [];
      setMenuItems(restaurantMenuItems);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add or update menu item - FIXED ENDPOINT
  const handleAddItem = async (itemData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("ownerToken");
      
      if (!restaurant) {
        throw new Error('No restaurant found');
      }

      let updatedMenuItems;
      
      if (editingItem) {
        // Update existing item
        updatedMenuItems = menuItems.map(item => 
          item._id === editingItem._id ? { ...item, ...itemData } : item
        );
      } else {
        // Add new item
        const newItem = {
          ...itemData,
        };
        updatedMenuItems = [...menuItems, newItem];
      }

      // Optimistic update
      setMenuItems(updatedMenuItems);

      console.log('🔄 Updating restaurant menu via API...');
      console.log('📦 Menu items to save:', updatedMenuItems);
      
      // FIXED: Use the correct endpoint WITHOUT restaurant ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`, // NO ID HERE
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            menuItems: updatedMenuItems
          })
        }
      );

      console.log('📡 Response status:', response.status);
      console.log('📡 Response URL:', response.url);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Non-JSON response received. First 500 chars:');
        console.error(textResponse.substring(0, 500));
        
        if (response.status === 404) {
          throw new Error('Update endpoint not found (404). Check if PUT /api/restaurants/my/restaurant exists in backend.');
        } else {
          throw new Error(`Server returned ${response.status} - Expected JSON but got HTML`);
        }
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save menu items');
      }

      // Update with actual data from server
      if (result.data.restaurant.menuItems) {
        setMenuItems(result.data.restaurant.menuItems);
      }

      setShowModal(false);
      setEditingItem(null);
      
    } catch (err) {
      console.error('❌ Error saving menu item:', err);
      alert(`Failed to save menu item: ${err.message}`);
      // Revert optimistic update on error
      fetchMenuData();
    } finally {
      setSaving(false);
    }
  };

  // Delete menu item - FIXED ENDPOINT
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const token = localStorage.getItem("ownerToken");
      
      if (!restaurant) {
        throw new Error('No restaurant found');
      }

      // Optimistic update
      const updatedMenuItems = menuItems.filter(item => item._id !== id);
      setMenuItems(updatedMenuItems);

      console.log('🗑️ Deleting menu item...');
      
      // FIXED: Use the correct endpoint WITHOUT restaurant ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`, // NO ID HERE
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            menuItems: updatedMenuItems
          })
        }
      );

      console.log('📡 Delete response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Non-JSON response on delete:', textResponse.substring(0, 500));
        throw new Error(`Server error during delete (${response.status})`);
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete menu item');
      }

      // Update with actual data from server
      if (result.data.restaurant.menuItems) {
        setMenuItems(result.data.restaurant.menuItems);
      }

    } catch (err) {
      console.error('❌ Error deleting menu item:', err);
      alert(`Failed to delete menu item: ${err.message}`);
      // Revert optimistic update on error
      fetchMenuData();
    }
  };

  // Status toggle - FIXED ENDPOINT
  const handleStatusToggle = async (id) => {
    try {
      const token = localStorage.getItem("ownerToken");
      
      if (!restaurant) {
        throw new Error('No restaurant found');
      }

      const updatedMenuItems = menuItems.map(item =>
        item._id === id 
          ? { ...item, status: item.status === 'Available' ? 'Out of Stock' : 'Available' }
          : item
      );

      // Optimistic update
      setMenuItems(updatedMenuItems);

      console.log('🔄 Toggling item status...');
      
      // FIXED: Use the correct endpoint WITHOUT restaurant ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`, // NO ID HERE
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            menuItems: updatedMenuItems
          })
        }
      );

      console.log('📡 Status toggle response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Non-JSON response on status toggle:', textResponse.substring(0, 500));
        throw new Error(`Server error during status update (${response.status})`);
      }

      const result = await response.json();
      console.log(result)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update item status');
      }

      // Update with actual data from server
      if (result.data.restaurant.menuItems) {
        setMenuItems(result.data.restaurant.menuItems);
      }

    } catch (err) {
      console.error('❌ Error updating item status:', err);
      alert(`Failed to update item status: ${err.message}`);
      // Revert optimistic update on error
      fetchMenuData();
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleRefresh = () => {
    fetchMenuData();
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    return status === 'Available' ? colors.accent : '#ef4444';
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMenuData();
  }, []);

  if (loading) {
    return (
      <div className="menu-management-container">
        <div className="loading-container">
          <Loader className="loading-spinner" size={48} />
          <p>Loading menu items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-management-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <h2>Unable to Load Menu</h2>
          <p>{error}</p>
          <button 
            onClick={handleRefresh}
            className="retry-button"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-management-container">
      <nav className="management-nav">
        <div className="nav-container">
          <div className="nav-content">
            <h1 className="page-title">Menu Management</h1>
            <button 
              onClick={handleRefresh}
              className="refresh-button"
            >
              <RefreshCw className="refresh-icon" />
            </button>
          </div>
        </div>
      </nav>

      <div className="management-content">
        {/* Header with Search and Filters */}
        <div className="management-header">
          <div className="search-filters">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search menu items by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-group">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="add-item-button"
          >
            <Plus className="button-icon" />
            Add New Item
          </button>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-number">{menuItems.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {menuItems.filter(item => item.status === 'Available' || !item.status).length}
            </span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {menuItems.filter(item => item.status === 'Out of Stock').length}
            </span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>

        {/* Menu Items Grid/Table */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <ImageIcon className="empty-icon" />
            <h3 className="empty-title">No menu items found</h3>
            <p className="empty-description">
              {searchTerm || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first menu item'
              }
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            )}
            {!searchTerm && selectedCategory === 'All' && (
              <button
                onClick={() => setShowModal(true)}
                className="add-first-item-button"
              >
                <Plus className="button-icon" />
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="menu-items-grid">
            {filteredItems.map(item => (
              <div key={item._id} className="menu-item-card">
                <div className="item-header">
                  <div className="item-image">
                    {item.image || '🍽️'}
                  </div>
                  <div className="item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description || 'No description available'}</p>
                    <div className="item-meta">
                      <span className="item-category">{item.category || 'Uncategorized'}</span>
                      {item.preparationTime && (
                        <span className="item-prep-time">{item.preparationTime}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="item-footer">
                  <div className="item-pricing">
                    <span className="item-price">PKR {item.price}</span>
                    <button
                      onClick={() => handleStatusToggle(item._id)}
                      className={`status-toggle ${(item.status === 'Available' || !item.status) ? 'available' : 'out-of-stock'}`}
                      style={{
                        backgroundColor: `${getStatusColor(item.status || 'Available')}20`,
                        color: getStatusColor(item.status || 'Available')
                      }}
                    >
                      {item.status || 'Available'}
                    </button>
                  </div>
                  
                  <div className="item-actions">
                    <button
                      onClick={() => handleEdit(item)}
                      className="action-button edit"
                    >
                      <Edit className="action-icon" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="action-button delete"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <ModalForm
            item={editingItem}
            categories={categories.filter(cat => cat !== 'All')}
            onSave={handleAddItem}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

// Modal Form Component (keep the same as before)
const ModalForm = ({ item, categories, onSave, onClose, saving }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || categories[0] || 'Main Course',
    price: item?.price || '',
    description: item?.description || '',
    preparationTime: item?.preparationTime || '15-20 min',
    image: item?.image || '🍔',
    status: item?.status || 'Available'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseInt(formData.price)
    });
  };

  // const foodEmojis = [
  //   '🍔', '🍟', '🍕', '🌭', '🥗', '🍛', '🍗', '🥤', '🍰', '☕',
  //   '🥪', '🌮', '🍣', '🍜', '🥘', '🍝', '🥟', '🍤', '🧁', '🍦',
  //   '🍽️', '🥩', '🍖', '🥬', '🥕', '🍅', '🥑', '🥦', '🍇', '🍓'
  // ];

  const preparationTimes = ['5-10 min', '10-15 min', '15-20 min', '20-25 min', '25-30 min', '30+ min'];

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          <button onClick={onClose} className="close-button" disabled={saving}>
            <X className="close-icon" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Enter item name"
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="form-select"
                disabled={saving}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price (PKR) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="form-input"
                placeholder="Enter price"
                min="0"
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preparation Time</label>
              <select
                value={formData.preparationTime}
                onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                className="form-select"
                disabled={saving}
              >
                {preparationTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="form-select"
                disabled={saving}
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="form-textarea"
                placeholder="Describe the item, ingredients, and any special notes"
                disabled={saving}
              />
            </div>

            {/* <div className="form-group full-width">
              <label className="form-label">Item Image (Emoji)</label>
              <div className="emoji-grid">
                {foodEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({...formData, image: emoji})}
                    className={`emoji-option ${formData.image === emoji ? 'selected' : ''}`}
                    disabled={saving}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div> */}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? (
                <Loader className="button-icon spinning" />
              ) : (
                <Save className="button-icon" />
              )}
              {item ? 'Update' : 'Add'} Item
              {saving && '...'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuManagementPage;