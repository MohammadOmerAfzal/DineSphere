import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  Eye,
  Phone,
  MessageCircle,
  Volume2,
  VolumeX,
  Loader,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { colors } from '../../constant/colors';
import '../../Styles/OrdersManagement.css';
import io from 'socket.io-client';

const OrdersManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);


useEffect(() => {
  if (socket && restaurant?._id) {
    socket.emit('join-tenant', restaurant._id);
    console.log(`👥 Joined tenant room: ${restaurant._id}`);

    // Listen for real-time order updates
    socket.on('order_update', (data) => {
      console.log('📦 Real-time order update received:', data);
      
      if (data.type === 'ORDER_CREATED') {
        console.log('🆕 New order received:', data.order.orderNumber);
        // Add new order to the beginning of the list
        setOrders(prev => [data.order, ...prev]);
        
        // Show notification
        setNewOrderNotification({
          id: data.order.orderNumber,
          customer: data.order.customerId?.firstName 
            ? `${data.order.customerId.firstName} ${data.order.customerId.lastName || ''}`.trim()
            : 'Customer',
          items: data.order.items.length
        });

        // Play sound for new orders
        if (soundEnabled) {
          playNotificationSound();
        }

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNewOrderNotification(null);
        }, 5000);
      }

      if (data.type === 'ORDER_STATUS_UPDATED') {
        console.log('🔄 Status update received for order:', data.orderId, 'New status:', data.newStatus);
        
        // Update order status in the list
        setOrders(prev => 
          prev.map(order => {
            if (order._id === data.orderId) {
              console.log('✅ Updating order in state:', order.orderNumber, '->', data.newStatus);
              return {
                ...order,
                status: data.newStatus,
                timeline: [
                  ...(order.timeline || []),
                  {
                    status: data.newStatus,
                    timestamp: new Date(data.timestamp),
                    notes: data.note || `Order status updated to ${data.newStatus}`,
                    actor: data.actor
                  }
                ]
              };
            }
            return order;
          })
        );

        // Show brief notification for status updates (optional)
        setNewOrderNotification({
          id: data.orderNumber,
          customer: 'Status Updated',
          items: `Changed to: ${getStatusText(data.newStatus)}`
        });

        setTimeout(() => {
          setNewOrderNotification(null);
        }, 3000);
      }
    });

    // Add error handling for Socket.IO
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });
  }

  return () => {
    if (socket && restaurant?._id) {
      socket.emit('leave-tenant', restaurant._id);
      socket.off('order_update');
      socket.off('connect_error');
      socket.off('error');
    }
  };
}, [socket, restaurant, soundEnabled]);

  // Fetch restaurant and orders data
  const fetchOrdersData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("ownerToken");
      
      // Fetch restaurant data first
      const restaurantResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const restaurantResult = await restaurantResponse.json();

      if (!restaurantResponse.ok || !restaurantResult.success) {
        throw new Error(restaurantResult.message || 'Failed to fetch restaurant data');
      }

      if (!restaurantResult.data.restaurant) {
        throw new Error('No restaurant found. Please register a restaurant first.');
      }

      setRestaurant(restaurantResult.data.restaurant);
      console.log(restaurantResult.data.restaurant.data.restaurants[0]._id);

      // Fetch orders for this restaurant
      const ordersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/restaurant/${restaurantResult.data.restaurant.data.restaurants[0]._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const ordersResult = await ordersResponse.json();

      if (!ordersResponse.ok || !ordersResult.success) {
        throw new Error(ordersResult.message || 'Failed to fetch orders');
      }

      setOrders(ordersResult.data.orders || []);
      setError(null);

    } catch (err) {
      console.error('Error fetching orders data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("ownerToken");
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
            note: `Order status updated to ${newStatus}`,
            actor: 'restaurant'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update order status');
      }

      // No need to update local state - real-time update will handle it

    } catch (err) {
      console.error('Error updating order status:', err);
      alert(`Failed to update order status: ${err.message}`);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOrdersData();
  }, []);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio context not supported');
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerName = order.customerId?.firstName 
      ? `${order.customerId.firstName} ${order.customerId.lastName || ''}`.trim().toLowerCase()
      : order.customerId?.email?.toLowerCase() || '';
    
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleContactCustomer = (order) => {
    const phone = order.customerId?.phone;
    if (phone) {
      window.open(`tel:${phone}`);
    } else {
      alert('Customer phone number not available');
    }
  };

  const handleViewOrderDetails = (order) => {
    // Navigate to order tracking page
    window.open(`/tracking/${order.orderNumber}`, '_blank');
  };

  const handleRefresh = () => {
    fetchOrdersData(true);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    ready: orders.filter(order => order.status === 'ready').length,
    completed: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  if (loading && !refreshing) {
    return (
      <div className="orders-management-container">
        <div className="loading-container">
          <Loader className="loading-spinner" size={48} />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-management-container">
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
    <div className="orders-management-container">
      {/* New Order Notification */}
      {newOrderNotification && (
        <div className="new-order-notification">
          <div className="notification-content">
            <Bell className="notification-icon" />
            <div className="notification-text">
              <strong>New Order Received!</strong>
              <span>Order #{newOrderNotification.id} from {newOrderNotification.customer}</span>
            </div>
            <button 
              onClick={() => setNewOrderNotification(null)}
              className="notification-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <nav className="orders-nav">
        <div className="nav-container">
          <div className="nav-content">
            <h1 className="page-title">Orders Management</h1>
            <div className="nav-controls">
              <div className="connection-status">
                {isConnected ? (
                  <Wifi className="connection-icon connected" size={20} />
                ) : (
                  <WifiOff className="connection-icon disconnected" size={20} />
                )}
                <span className="connection-text">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="refresh-button"
                disabled={refreshing}
              >
                <RefreshCw className={`refresh-icon ${refreshing ? 'refreshing' : ''}`} />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
                title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
              >
                {soundEnabled ? <Volume2 className="sound-icon" /> : <VolumeX className="sound-icon" />}
              </button>
              <div className="live-indicator">
                <div className="live-pulse" style={{backgroundColor: isConnected ? colors.accent : '#ef4444'}}></div>
                <span className="live-text">Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="orders-content">
        {/* Refreshing indicator */}
        {refreshing && (
          <div className="refreshing-indicator">
            <Loader className="refreshing-spinner" size={16} />
            <span>Refreshing orders...</span>
          </div>
        )}

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card preparing">
            <span className="stat-number">{stats.preparing}</span>
            <span className="stat-label">Preparing</span>
          </div>
          <div className="stat-card ready">
            <span className="stat-number">{stats.ready}</span>
            <span className="stat-label">Ready</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search orders by customer, order number, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="All">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Clock className="empty-icon" />
              <h3 className="empty-title">No orders found</h3>
              <p className="empty-description">
                {searchTerm || filterStatus !== 'All' 
                  ? 'Try adjusting your search or filters'
                  : isConnected 
                    ? 'New orders will appear here automatically' 
                    : 'Connect to receive real-time orders'
                }
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={updateOrderStatus}
                onContactCustomer={handleContactCustomer}
                onViewDetails={handleViewOrderDetails}
                getStatusText={getStatusText}
                isNew={order.timeline && order.timeline.length === 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onStatusChange, onContactCustomer, onViewDetails, getStatusText, isNew }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const customerName = order.customerId?.firstName 
    ? `${order.customerId.firstName} ${order.customerId.lastName || ''}`.trim()
    : order.customerId?.email?.split('@')[0] || 'Customer';

  const customerPhone = order.customerId?.phone || 'Phone not available';

  const preparationTime = order.restaurantId?.settings?.preparationTime || 20;

  return (
    <div className={`order-card ${isNew ? 'new-order' : ''}`}>
      {isNew && <div className="new-order-indicator"></div>}
      <div className="order-header">
        <div className="order-info">
          <div className="order-id-time">
            <span className="order-id">#{order.orderNumber}</span>
            <span className="order-time">
              {formatTime(order.createdAt)} • {formatDate(order.createdAt)}
            </span>
          </div>
          <h3 className="customer-name">{customerName}</h3>
          <p className="customer-phone">{customerPhone}</p>
        </div>
        <div className="order-status-section">
          <StatusBadge status={order.status} getStatusText={getStatusText} />
          <span className="prep-time">Est: {preparationTime} min</span>
        </div>
      </div>

      <div className="order-items">
        <div className="items-list">
          {order.items.slice(0, 3).map((item, index) => (
            <span key={index} className="item-tag">{item.name}</span>
          ))}
          {order.items.length > 3 && (
            <span className="item-tag more">+{order.items.length - 3} more</span>
          )}
        </div>
        <div className="order-summary">
          <span className="items-count">{order.items.length} items</span>
          <span className="order-total">PKR {order.pricing?.total || 0}</span>
        </div>
      </div>

      {/* Order Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="order-timeline">
          <span className="timeline-label">Latest update:</span>
          <span className="timeline-text">
            {order.timeline[order.timeline.length - 1].notes}
          </span>
        </div>
      )}

      <div className="order-actions">
        <div className="action-buttons">
          <button
            onClick={() => onContactCustomer(order)}
            className="action-button contact"
            disabled={!order.customerId?.phone}
          >
            <Phone className="action-icon" />
            Call
          </button>
          <button
            onClick={() => onViewDetails(order)}
            className="action-button details"
          >
            <Eye className="action-icon" />
            Details
          </button>
        </div>
        <StatusDropdown
          currentStatus={order.status}
          onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
          getStatusText={getStatusText}
        />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status, getStatusText }) => {
  const StatusIcon = getStatusIcon(status);

  return (
    <div
      className="status-badge"
      style={{
        backgroundColor: `${getStatusColor(status)}20`,
        color: getStatusColor(status)
      }}
    >
      <StatusIcon className="status-icon" />
      <span className="status-text">{getStatusText(status)}</span>
    </div>
  );
};

// Status Dropdown Component
// Status Dropdown Component - FIXED
// Status Dropdown Component with internal state
const StatusDropdown = ({ currentStatus, onStatusChange, getStatusText }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Update internal state when currentStatus prop changes
  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    onStatusChange(newStatus);
  };

  return (
    <select
      value={selectedStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      className="status-dropdown"
      style={{
        backgroundColor: `${getStatusColor(selectedStatus)}15`,
        color: getStatusColor(selectedStatus),
        borderColor: getStatusColor(selectedStatus)
      }}
    >
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Helper function for status icons
const getStatusIcon = (status) => {
  switch (status) {
    case 'delivered': return CheckCircle;
    case 'cancelled': return XCircle;
    default: return Clock;
  }
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return colors.info;
    case 'confirmed': return '#3b82f6';
    case 'preparing': return colors.primary;
    case 'ready': return '#f59e0b';
    case 'out_for_delivery': return '#8b5cf6';
    case 'delivered': return colors.accent;
    case 'cancelled': return '#ef4444';
    default: return colors.text;
  }
};

export default OrdersManagementPage;