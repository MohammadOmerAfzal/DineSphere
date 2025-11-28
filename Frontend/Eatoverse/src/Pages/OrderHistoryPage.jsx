import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Calendar, 
  Filter, 
  Package, 
  CheckCircle, 
  XCircle, 
  Loader,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import '../Styles/OrderHistory.css';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders from API
  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/orders/customer`;
      
      // Add query parameters for filtering
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterDate) {
        params.append('date', filterDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch orders');
      }

      setOrders(result.data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchOrders();
  }, [filterStatus, filterDate]);

  const handleReorder = async (order) => {
    if (order.status === 'cancelled') {
      alert('Cannot reorder a cancelled order');
      return;
    }

    try {
      // Add order items to cart
      const cartItems = order.items.map(item => ({
        id: item.menuItemId || Math.random().toString(36).substr(2, 9),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        description: item.description,
        restaurantId: order.restaurantId._id,
        restaurantName: order.restaurantId.basicInfo?.name
      }));

      // Save to localStorage or context
      localStorage.setItem('reorderItems', JSON.stringify(cartItems));
      
      // Navigate to the restaurant page
      navigate(`/restaurant/${order.restaurantId._id}`, {
        state: { reorderItems: cartItems }
      });

    } catch (err) {
      console.error('Error reordering:', err);
      alert('Failed to reorder. Please try again.');
    }
  };

  const handleViewDetails = (order) => {
    navigate(`/tracking/${order.orderNumber}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="status-icon delivered" />;
      case 'cancelled':
        return <XCircle className="status-icon cancelled" />;
      case 'out_for_delivery':
        return <Package className="status-icon out-for-delivery" />;
      case 'preparing':
      case 'confirmed':
        return <Package className="status-icon preparing" />;
      default:
        return <Package className="status-icon pending" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const getTotalItems = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemsList = (items) => {
    return items.map(item => item.name);
  };

  if (loading && !refreshing) {
    return (
      <div className="order-history-container">
        <div className="loading-container">
          <Loader className="loading-spinner" size={48} />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <h2>Unable to Load Orders</h2>
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
    <div className="order-history-container">
      <nav className="order-history-nav">
        <div className="nav-container">
          <div className="nav-content">
            <button 
              onClick={handleBackToHome}
              className="back-button"
            >
              <ChevronRight className="back-icon" />
              <span className="back-text">Back</span>
            </button>
            <h1 className="page-title">Order History</h1>
            <button 
              onClick={handleRefresh}
              className="refresh-button"
              disabled={refreshing}
            >
              <RefreshCw className={`refresh-icon ${refreshing ? 'refreshing' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="order-history-content">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="delivered">Delivered</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="preparing">Preparing</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="filter-group">
            <Calendar className="filter-icon" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-date"
              max={new Date().toISOString().split('T')[0]} // Cannot select future dates
            />
          </div>

          {(filterStatus !== 'all' || filterDate) && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterDate('');
              }}
              className="clear-filters-button"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading refresh */}
        {refreshing && (
          <div className="refreshing-indicator">
            <Loader className="refreshing-spinner" size={16} />
            <span>Refreshing orders...</span>
          </div>
        )}

        {/* Orders List */}
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-icon" />
              <h2 className="empty-title">No Orders Found</h2>
              <p className="empty-text">
                {filterStatus !== 'all' || filterDate 
                  ? 'Try adjusting your filters to see more orders.' 
                  : 'You haven\'t placed any orders yet.'}
              </p>
              {!filterDate && filterStatus === 'all' && (
                <button
                  onClick={() => navigate('/')}
                  className="browse-restaurants-button"
                >
                  Browse Restaurants
                </button>
              )}
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="restaurant-name">
                      {order.restaurantId?.basicInfo?.name || 'Restaurant'}
                    </h3>
                    <p className="order-meta">
                      {order.orderNumber} • {getTotalItems(order.items)} {getTotalItems(order.items) === 1 ? 'item' : 'items'} • {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                    </p>
                    <div className="order-items">
                      {getItemsList(order.items).slice(0, 2).map((item, index) => (
                        <span key={index} className="order-item-tag">
                          {item}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="order-item-tag more">
                          +{order.items.length - 2} more
                        </span>
                      )}
                    </div>
                    <p className="delivery-address">
                      {order.deliveryInfo?.address?.addressLine1 || 'Delivery address not specified'}
                    </p>
                  </div>
                  <div className={`status-badge status-${order.status}`}>
                    {getStatusIcon(order.status)}
                    <span className="status-text">{getStatusText(order.status)}</span>
                  </div>
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">PKR {order.pricing?.total || 0}</span>
                  </div>
                  <div className="order-actions">
                    <button
                      onClick={() => handleReorder(order)}
                      className="reorder-button"
                      disabled={order.status === 'cancelled'}
                    >
                      Reorder
                    </button>
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="details-button"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {order.status === 'cancelled' && (
                  <div className="cancelled-notice">
                    <XCircle className="notice-icon" />
                    <span className="notice-text">This order was cancelled and cannot be reordered</span>
                  </div>
                )}

                {/* Latest timeline update */}
                {order.timeline && order.timeline.length > 0 && (
                  <div className="timeline-update">
                    <span className="update-text">
                      {order.timeline[order.timeline.length - 1].notes}
                    </span>
                    <span className="update-time">
                      {formatTime(order.timeline[order.timeline.length - 1].timestamp)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {orders.length > 0 && (
          <div className="orders-summary">
            <p className="summary-text">
              Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              {filterStatus !== 'all' && ` • Filtered by: ${getStatusText(filterStatus)}`}
              {filterDate && ` • Date: ${new Date(filterDate).toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;