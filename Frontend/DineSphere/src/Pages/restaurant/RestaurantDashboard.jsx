import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  Package,
  ChefHat,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Loader,
  AlertCircle,
  RefreshCw,
  Store,
  Wifi,
  WifiOff
} from 'lucide-react';
import { colors } from '../../constant/colors';
import '../../Styles/RestaurantDashboard.css';
import io from 'socket.io-client';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [metrics, setMetrics] = useState({
    ordersPerMinute: 0,
    avgPrepTime: 0,
    activeOrders: 0,
    revenue: 0,
    completionRate: 0
  });
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    ordersPerMinute: 0,
    avgPrepTime: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  });

  // Safe number conversion helper
  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  };

  // Safe toFixed helper
  const safeToFixed = (value, decimals = 2) => {
    return safeNumber(value).toFixed(decimals);
  };

  // Validate restaurant ID
  const isValidRestaurantId = (id) => {
    return id && id !== 'undefined' && id !== 'null' && id.match(/^[0-9a-fA-F]{24}$/);
  };

  // Extract restaurant data from different possible response structures
  const extractRestaurantData = (responseData) => {
    console.log('🔍 [Frontend] Extracting restaurant data from:', responseData);
    
    // Try different possible response structures
    if (responseData.data?.restaurant?.data?.restaurants && 
        Array.isArray(responseData.data.restaurant.data.restaurants) && 
        responseData.data.restaurant.data.restaurants.length > 0) {
      console.log('✅ [Frontend] Found restaurant at: data.restaurant.data.restaurants[0]');
      return responseData.data.restaurant.data.restaurants[0];
    }
    
    if (responseData.data?.restaurant) {
      console.log('✅ [Frontend] Found restaurant at: data.restaurant');
      return responseData.data.restaurant;
    }
    
    if (responseData.data?.restaurants && Array.isArray(responseData.data.restaurants) && responseData.data.restaurants.length > 0) {
      console.log('✅ [Frontend] Found restaurant at: data.restaurants[0]');
      return responseData.data.restaurants[0];
    }
    
    if (responseData.restaurant) {
      console.log('✅ [Frontend] Found restaurant at: restaurant');
      return responseData.restaurant;
    }
    
    if (responseData.data && typeof responseData.data === 'object' && responseData.data._id) {
      console.log('✅ [Frontend] Found restaurant at: data');
      return responseData.data;
    }
    
    console.log('❌ [Frontend] Could not find restaurant data in response');
    console.log('📋 [Frontend] Available keys:', Object.keys(responseData));
    if (responseData.data) {
      console.log('📋 [Frontend] Data keys:', Object.keys(responseData.data));
      if (responseData.data.restaurant) {
        console.log('📋 [Frontend] Restaurant keys:', Object.keys(responseData.data.restaurant));
      }
    }
    return null;
  };

  // Initialize Socket.IO connection with better error handling
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: localStorage.getItem('ownerToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // Join tenant room when restaurant is loaded
  useEffect(() => {
    if (socket && restaurant?._id && isValidRestaurantId(restaurant._id)) {
      socket.emit('join-tenant', restaurant._id);
      console.log(`👥 Joined tenant room: ${restaurant._id}`);

      // Listen for real-time metrics updates
      socket.on('metrics_update', (data) => {
        console.log('📊 Real-time metrics update:', data);
        // Convert string values to numbers for frontend
        const processedMetrics = {
          ordersPerMinute: safeNumber(data.ordersPerMinute),
          avgPrepTime: safeNumber(data.avgPrepTime),
          totalOrders: safeNumber(data.totalOrders),
          totalRevenue: safeNumber(data.totalRevenue),
          avgOrderValue: safeNumber(data.avgOrderValue)
        };
        setRealTimeMetrics(processedMetrics);
      });

      // Listen for real-time order updates
      socket.on('order_update', (data) => {
        console.log('📦 Real-time order update:', data);
        
        if (data.type === 'ORDER_CREATED') {
          // Add new order to live orders
          setLiveOrders(prev => {
            const newOrder = {
              id: data.order._id,
              orderNumber: data.order.orderNumber,
              customer: data.order.customerId?.firstName 
                ? `${data.order.customerId.firstName} ${data.order.customerId.lastName || ''}`.trim()
                : data.order.customerId?.email?.split('@')[0] || 'Customer',
              items: data.order.items?.map(item => item.name) || [],
              time: 'Just now',
              status: getStatusText(data.order.status),
              prepTime: `${restaurant?.settings?.preparationTime || 20} min`,
              total: data.order.pricing?.total || 0,
              originalStatus: data.order.status
            };
            
            // Add to beginning and limit to 5 orders
            return [newOrder, ...prev.slice(0, 4)];
          });

          // Update metrics
          setMetrics(prev => ({
            ...prev,
            activeOrders: prev.activeOrders + 1
          }));
        }

        if (data.type === 'ORDER_STATUS_UPDATED') {
          // Update order status in live orders
          setLiveOrders(prev => 
            prev.map(order => 
              order.id === data.orderId 
                ? { 
                    ...order, 
                    status: getStatusText(data.newStatus),
                    originalStatus: data.newStatus
                  }
                : order
            )
          );

          // If order is completed, remove from active orders
          if (data.newStatus === 'delivered' || data.newStatus === 'cancelled') {
            setLiveOrders(prev => prev.filter(order => order.id !== data.orderId));
            setMetrics(prev => ({
              ...prev,
              activeOrders: Math.max(0, prev.activeOrders - 1)
            }));
          }
        }
      });
    }

    return () => {
      if (socket && restaurant?._id) {
        socket.emit('leave-tenant', restaurant._id);
        socket.off('metrics_update');
        socket.off('order_update');
      }
    };
  }, [socket, restaurant]);

  // Fetch real-time metrics from API
  const fetchRealTimeMetrics = async (restaurantId, token) => {
    try {
      // ✅ FIXED: Validate restaurantId before making API call
      if (!isValidRestaurantId(restaurantId)) {
        console.error('❌ [Frontend] Invalid restaurantId for metrics:', restaurantId);
        return;
      }

      console.log('📊 [Frontend] Fetching metrics for restaurant:', restaurantId);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/metrics/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('📡 [Frontend] Metrics response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Convert string values to numbers
          const processedMetrics = {
            ordersPerMinute: safeNumber(result.data.ordersPerMinute),
            avgPrepTime: safeNumber(result.data.avgPrepTime),
            totalOrders: safeNumber(result.data.totalOrders),
            totalRevenue: safeNumber(result.data.totalRevenue),
            avgOrderValue: safeNumber(result.data.avgOrderValue)
          };
          setRealTimeMetrics(processedMetrics);
          console.log('📊 [Frontend] Processed real-time metrics:', processedMetrics);
        }
      } else {
        console.warn('⚠️ [Frontend] Metrics API returned:', response.status);
      }
    } catch (err) {
      console.error('❌ [Frontend] Error fetching real-time metrics:', err);
    }
  };

  // Fetch restaurant orders separately
  const fetchRestaurantOrders = async (restaurantId, token) => {
    try {
      // ✅ FIXED: Validate restaurantId before making API call
      if (!isValidRestaurantId(restaurantId)) {
        console.error('❌ [Frontend] Invalid restaurantId for orders:', restaurantId);
        return;
      }

      console.log('📦 [Frontend] Fetching orders for restaurant:', restaurantId);
      
      const ordersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('📡 [Frontend] Orders response status:', ordersResponse.status);

      const ordersResult = await ordersResponse.json();

      if (!ordersResponse.ok || !ordersResult.success) {
        console.warn('⚠️ [Frontend] Failed to fetch orders data:', ordersResult.message);
        return;
      }

      // Calculate metrics from real data
      const orders = ordersResult.data.orders || [];
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
      });

      const activeOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
      );

      const completedOrders = orders.filter(order => order.status === 'delivered');
      const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      
      setMetrics({
        ordersPerMinute: realTimeMetrics.ordersPerMinute || (todayOrders.length > 0 ? Math.floor(todayOrders.length / 24 / 60 * 100) / 100 : 0),
        avgPrepTime: realTimeMetrics.avgPrepTime || restaurant?.settings?.preparationTime || 20,
        activeOrders: activeOrders.length,
        revenue: totalRevenue,
        completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0
      });

      // Set live orders (active orders)
      setLiveOrders(activeOrders.slice(0, 5).map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customerId?.firstName 
          ? `${order.customerId.firstName} ${order.customerId.lastName || ''}`.trim()
          : order.customerId?.email?.split('@')[0] || 'Customer',
        items: order.items?.map(item => item.name) || [],
        time: formatTimeAgo(order.createdAt),
        status: getStatusText(order.status),
        prepTime: `${restaurant?.settings?.preparationTime || 20} min`,
        total: order.pricing?.total || 0,
        originalStatus: order.status
      })));

    } catch (err) {
      console.error('❌ [Frontend] Error fetching restaurant orders:', err);
    }
  };

  // Fetch restaurant data and metrics
  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("ownerToken");
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔄 [Frontend] Fetching restaurant data...');

      // Fetch restaurant data
      const restaurantResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📡 [Frontend] Restaurant response status:', restaurantResponse.status);

      const restaurantResult = await restaurantResponse.json();

      console.log('📦 [Frontend] Full Restaurant API Response:', restaurantResult);

      if (!restaurantResponse.ok || !restaurantResult.success) {
        throw new Error(restaurantResult.message || 'Failed to fetch restaurant data');
      }

      // ✅ FIXED: Extract restaurant data from different possible response structures
      const restaurantData = extractRestaurantData(restaurantResult);
      
      if (restaurantData && restaurantData._id) {
        console.log('✅ [Frontend] Restaurant found:', restaurantData.basicInfo?.name);
        console.log('🆔 [Frontend] Restaurant ID:', restaurantData._id);
        console.log('📋 [Frontend] Restaurant data structure:', restaurantData);
        
        setRestaurant(restaurantData);
        setHasRestaurant(true);
        
        // ✅ FIXED: Only fetch orders and metrics if we have a valid restaurant ID
        if (isValidRestaurantId(restaurantData._id)) {
          console.log('🔄 [Frontend] Fetching orders and metrics for restaurant:', restaurantData._id);
          await Promise.all([
            fetchRestaurantOrders(restaurantData._id, token),
            fetchRealTimeMetrics(restaurantData._id, token)
          ]);
        } else {
          console.error('❌ [Frontend] Invalid restaurant ID, skipping orders and metrics:', restaurantData._id);
          // Set default metrics since we can't fetch real data
          setMetrics({
            ordersPerMinute: 0,
            avgPrepTime: restaurantData.settings?.preparationTime || 20,
            activeOrders: 0,
            revenue: 0,
            completionRate: 0
          });
          setLiveOrders([]);
        }
      } else {
        console.log('ℹ️ [Frontend] No restaurant registered for this user');
        console.log('📋 [Frontend] Restaurant data that was extracted:', restaurantData);
        setHasRestaurant(false);
        setRestaurant(null);
        setLiveOrders([]);
        setMetrics({
          ordersPerMinute: 0,
          avgPrepTime: 0,
          activeOrders: 0,
          revenue: 0,
          completionRate: 0
        });
      }

      setError(null);
    } catch (err) {
      console.error('💥 [Frontend] Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status text
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

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
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

      // Socket will handle the real-time update
      
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(`Failed to update order status: ${err.message}`);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // FIXED: Safe metric values with proper number conversion
  const chartCards = [
    {
      icon: TrendingUp,
      label: 'Orders/Min',
      value: safeToFixed(realTimeMetrics.ordersPerMinute, 2),
      change: '+12%',
      color: colors.primary,
      description: 'Real-time order rate',
      isLive: true
    },
    {
      icon: Clock,
      label: 'Avg Prep Time',
      value: `${safeNumber(realTimeMetrics.avgPrepTime)} min`,
      change: '-5%',
      color: colors.info,
      description: 'Average preparation time',
      isLive: true
    },
    {
      icon: Users,
      label: 'Active Orders',
      value: safeNumber(metrics.activeOrders),
      change: '+8%',
      color: colors.accent,
      description: 'Currently being prepared'
    },
    {
      icon: DollarSign,
      label: 'Revenue (Today)',
      value: `PKR ${safeNumber(metrics.revenue).toLocaleString()}`,
      change: '+15%',
      color: '#8B5CF6',
      description: 'Total revenue generated'
    }
  ];

  const quickActions = [
    {
      icon: Package,
      label: 'Manage Menu',
      description: 'Add or edit menu items',
      path: '/restaurant/menu',
      color: colors.primary
    },
    {
      icon: TrendingUp,
      label: 'View Orders',
      description: 'See all active orders',
      path: '/restaurant/orders',
      color: colors.info
    },
    {
      icon: BarChart3,
      label: 'Live Dashboard',
      description: 'Real-time analytics',
      path: '/analytics',
      color: colors.accent
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Restaurant settings',
      path: '/restaurant/settings',
      color: '#8B5CF6'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Preparing':
        return { bg: `${colors.primary}20`, text: colors.primary };
      case 'Pending':
      case 'Confirmed':
        return { bg: `${colors.info}20`, text: colors.info };
      case 'Ready':
        return { bg: `${colors.accent}20`, text: colors.accent };
      case 'Out for Delivery':
        return { bg: `${colors.warning}20`, text: colors.warning };
      default:
        return { bg: '#e5e7eb', text: '#6b7280' };
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleRegisterRestaurant = () => {
    navigate('/restaurant-register');
  };

  if (loading && !refreshing) {
    return (
      <div className="restaurant-dashboard-container">
        <div className="loading-container">
          <Loader className="loading-spinner" size={48} />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="restaurant-dashboard-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <h2>Unable to Load Dashboard</h2>
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

  // Show setup screen if no restaurant is registered
  if (!hasRestaurant) {
    return (
      <div className="restaurant-dashboard-container">
        <nav className="dashboard-nav">
          <div className="nav-container">
            <div className="nav-content">
              <div className="nav-brand">
                <ChefHat className="brand-icon" />
                <h1 className="brand-title">Restaurant Dashboard</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="setup-section">
            <div className="setup-card">
              <Store className="setup-icon" />
              <h2 className="setup-title">No Restaurant Found</h2>
              <p className="setup-description">
                You haven't registered a restaurant yet. Start by setting up your restaurant profile 
                to access the dashboard and manage orders.
              </p>
              <div className="setup-features">
                <div className="feature-item">
                  <TrendingUp className="feature-icon" />
                  <span>Track orders in real-time</span>
                </div>
                <div className="feature-item">
                  <BarChart3 className="feature-icon" />
                  <span>View business analytics</span>
                </div>
                <div className="feature-item">
                  <Package className="feature-icon" />
                  <span>Manage your menu</span>
                </div>
                <div className="feature-item">
                  <DollarSign className="feature-icon" />
                  <span>Monitor revenue</span>
                </div>
              </div>
              <button 
                onClick={handleRegisterRestaurant}
                className="setup-button"
              >
                <Plus className="button-icon" />
                Register Your Restaurant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-brand">
              <ChefHat className="brand-icon" />
              <h1 className="brand-title">Restaurant Dashboard</h1>
            </div>
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
              <div className="live-indicator">
                <div className="live-pulse" style={{backgroundColor: isConnected ? colors.accent : '#ef4444'}}></div>
                <span className="live-text">Real-time Updates</span>
              </div>
              <button 
                onClick={handleRefresh}
                className="refresh-button"
                disabled={refreshing}
              >
                <RefreshCw className={`refresh-icon ${refreshing ? 'refreshing' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Welcome Header */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h2 className="welcome-title">
              Welcome back, {restaurant?.basicInfo?.name || 'Restaurant'}! 👨‍🍳
            </h2>
            <p className="welcome-subtitle">
              {restaurant?.basicInfo?.description || 'Manage your restaurant operations'}
            </p>
            <div className="restaurant-stats">
              <span className="stat-item">
                <strong>Cuisine:</strong> {restaurant?.basicInfo?.cuisineType?.join(', ') || 'Not specified'}
              </span>
              <span className="stat-item">
                <strong>Status:</strong> 
                <span className={`status-badge ${restaurant?.settings?.isActive ? 'active' : 'inactive'}`}>
                  {restaurant?.settings?.isActive ? 'Active' : 'Inactive'}
                </span>
              </span>
              <span className="stat-item">
                <strong>Real-time:</strong> 
                <span className={`status-badge ${isConnected ? 'active' : 'inactive'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/restaurant/menu')}
            className="add-item-button"
          >
            <Plus className="button-icon" />
            Add New Item
          </button>
        </div>

        {/* Refreshing indicator */}
        {refreshing && (
          <div className="refreshing-indicator">
            <Loader className="refreshing-spinner" size={16} />
            <span>Updating dashboard data...</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          {chartCards.map((card, idx) => {
            const Icon = card.icon;
            const isPositive = card.change.startsWith('+');
            
            return (
              <div key={idx} className="metric-card">
                <div className="metric-header">
                  <div 
                    className="metric-icon-container"
                    style={{backgroundColor: `${card.color}20`}}
                  >
                    <Icon className="metric-icon" style={{color: card.color}} />
                  </div>
                  <div className="metric-header-right">
                    {card.isLive && (
                      <div className="live-badge">
                        <div className="live-pulse-small" style={{backgroundColor: card.color}}></div>
                        LIVE
                      </div>
                    )}
                    <span className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className="metric-content">
                  <p className="metric-value">{card.value}</p>
                  <p className="metric-label">{card.label}</p>
                  <p className="metric-description">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Live Orders Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <Package className="card-icon" />
                Live Orders ({liveOrders.length})
                {liveOrders.some(order => order.time === 'Just now') && (
                  <span className="new-orders-badge">New!</span>
                )}
              </h3>
              <button 
                onClick={() => navigate('/restaurant/orders')}
                className="view-all-button"
              >
                View All
                <Eye className="view-all-icon" />
              </button>
            </div>
            <div className="orders-list">
              {liveOrders.length === 0 ? (
                <div className="empty-orders">
                  <Package className="empty-orders-icon" />
                  <p className="empty-orders-text">No active orders at the moment</p>
                  <p className="empty-orders-subtext">
                    {isConnected ? 'New orders will appear here automatically' : 'Connect to receive real-time orders'}
                  </p>
                </div>
              ) : (
                liveOrders.map(order => {
                  const statusColors = getStatusColor(order.status);
                  const isNew = order.time === 'Just now';
                  
                  return (
                    <div key={order.id} className={`order-item ${isNew ? 'new-order' : ''}`}>
                      {isNew && <div className="new-order-indicator"></div>}
                      <div className="order-header">
                        <div className="order-customer">
                          <span className="customer-name">{order.customer}</span>
                          <span className="order-time">{order.time}</span>
                          <span className="order-number">#{order.orderNumber}</span>
                        </div>
                        <span 
                          className="order-status"
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text
                          }}
                        >
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="order-details">
                        <div className="order-items">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="order-item-tag">{item}</span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="order-item-tag more">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="order-meta">
                          <span className="prep-time">Est: {order.prepTime}</span>
                          <span className="order-total">PKR {order.total}</span>
                        </div>
                      </div>

                      <div className="order-actions">
                        {order.originalStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            className="action-button primary"
                          >
                            Confirm Order
                          </button>
                        )}
                        {order.originalStatus === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            className="action-button primary"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.originalStatus === 'preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                            className="action-button success"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.originalStatus === 'ready' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                            className="action-button completed"
                          >
                            Out for Delivery
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="actions-column">
            {/* Quick Actions */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div className="actions-grid">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => navigate(action.path)}
                      className="action-card"
                    >
                      <div 
                        className="action-icon-container"
                        style={{backgroundColor: `${action.color}20`}}
                      >
                        <Icon className="action-icon" style={{color: action.color}} />
                      </div>
                      <div className="action-content">
                        <span className="action-label">{action.label}</span>
                        <span className="action-description">{action.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Performance</h3>
              </div>
              <div className="performance-stats">
                <div className="performance-item">
                  <div className="performance-header">
                    <span className="performance-label">Order Completion</span>
                    <span className="performance-value">{safeNumber(metrics.completionRate)}%</span>
                  </div>
                  <div className="performance-bar">
                    <div 
                      className="performance-fill"
                      style={{width: `${safeNumber(metrics.completionRate)}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="performance-item">
                  <div className="performance-header">
                    <span className="performance-label">Customer Rating</span>
                    <span className="performance-value">
                      {safeNumber(restaurant?.statistics?.averageRating || 4.8, 4.8).toFixed(1)}/5
                    </span>
                  </div>
                  <div className="performance-bar">
                    <div 
                      className="performance-fill rating"
                      style={{width: `${((safeNumber(restaurant?.statistics?.averageRating || 4.8, 4.8)) / 5) * 100}%`}}
                    ></div>
                  </div>
                </div>
                
                <div className="performance-item">
                  <div className="performance-header">
                    <span className="performance-label">Total Orders (1h)</span>
                    <span className="performance-value">
                      {safeNumber(realTimeMetrics.totalOrders)}
                    </span>
                  </div>
                  <div className="performance-bar">
                    <div 
                      className="performance-fill delivery"
                      style={{width: `${Math.min(safeNumber(realTimeMetrics.totalOrders) * 10, 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;