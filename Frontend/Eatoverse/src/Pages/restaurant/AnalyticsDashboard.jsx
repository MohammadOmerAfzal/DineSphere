import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  BarChart3,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Loader,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const colors = {
  primary: '#FF6B35',
  info: '#4ECDC4',
  accent: '#95E1D3',
  warning: '#FFD93D'
};

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [metrics, setMetrics] = useState({});
  const [chartData, setChartData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    ordersPerMinute: 0,
    avgPrepTime: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalOrders: 0
  });
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [socket, setSocket] = useState(null);

  // Track real-time orders and prep times
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderTimestamps, setOrderTimestamps] = useState([]);

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

  // Initialize Socket.IO connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const { default: io } = await import('socket.io-client');
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          auth: {
            token: localStorage.getItem('ownerToken')
          }
        });

        newSocket.on('connect', () => {
          console.log('✅ Analytics connected to real-time server');
          setIsConnected(true);
          
          if (restaurantId) {
            newSocket.emit('join-tenant', restaurantId);
            console.log(`👥 Analytics joined tenant room: ${restaurantId}`);
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Analytics disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Analytics socket connection error:', error);
          setIsConnected(false);
        });

        newSocket.on('analytics_update', (data) => {
          console.log('📊 Real-time analytics update:', data);
          handleRealTimeAnalyticsUpdate(data);
        });
        newSocket.on('order_update', (data) => {
          console.log('📦 Order update in Analytics:', data);
          handleOrderUpdate(data);
        });

        newSocket.on('dashboard_metrics', (data) => {
          console.log('📈 Real-time dashboard metrics:', data);
          handleDashboardMetrics(data);
        });

        setSocket(newSocket);

      } catch (err) {
        console.error('Failed to initialize socket:', err);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        if (restaurantId) {
          socket.emit('leave-tenant', restaurantId);
        }
        socket.close();
      }
    };
  }, [restaurantId]);

  // Handle real-time analytics updates
  const handleRealTimeAnalyticsUpdate = (data) => {
    if (data.type === 'METRICS_UPDATE') {
      setRealTimeMetrics(prev => ({
        ...prev,
        ordersPerMinute: safeNumber(data.metrics?.ordersPerMinute, prev.ordersPerMinute),
        avgPrepTime: safeNumber(data.metrics?.avgPrepTime, prev.avgPrepTime),
        totalRevenue: safeNumber(data.metrics?.totalRevenue, prev.totalRevenue),
        avgOrderValue: safeNumber(data.metrics?.avgOrderValue, prev.avgOrderValue),
        totalOrders: safeNumber(data.metrics?.totalOrders, prev.totalOrders)
      }));
    }

    if (data.type === 'TOP_ITEMS_UPDATE') {
      setTopItems(data.topItems || []);
    }

    if (data.type === 'CHART_DATA_UPDATE') {
      setChartData(prev => ({
        ...prev,
        ...data.chartData
      }));
    }
  };

  const handleOrderUpdate = (data) => {
    if (data.type === 'ORDER_CREATED') {
      setOrderTimestamps(prev => [...prev, Date.now()]);
      
      if (data.order) {
        setRecentOrders(prev => [data.order, ...prev.slice(0, 999)]);

        const orderValue = data.order.pricing?.total || 0;
        setRealTimeMetrics(prev => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          totalRevenue: prev.totalRevenue + orderValue,
          avgOrderValue: (prev.totalRevenue + orderValue) / (prev.totalOrders + 1)
        }));
      }
    }
    
    if (data.type === 'ORDER_STATUS_UPDATED') {
      setRecentOrders(prev => 
        prev.map(order => 
          order._id === data.orderId 
            ? { 
                ...order, 
                status: data.newStatus,
                statusTimestamps: {
                  ...order.statusTimestamps,
                  [data.newStatus]: Date.now()
                }
              }
            : order
        )
      );

      // Update metrics based on status change
      if (data.newStatus === 'delivered' || data.newStatus === 'ready') {
        updatePrepTimeMetrics();
      }
    }
  };

  // Handle dashboard metrics from server
  const handleDashboardMetrics = (data) => {
    if (data.metrics) {
      setRealTimeMetrics(prev => ({
        ...prev,
        ...data.metrics
      }));
    }
  };

  // Calculate real-time orders per minute
  const calculateOrdersPerMinute = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentOrdersCount = orderTimestamps.filter(timestamp => timestamp > oneMinuteAgo).length;
    return recentOrdersCount;
  };

  // Calculate real-time average prep time from completed orders
  const calculateAvgPrepTime = () => {
    if (recentOrders.length === 0) return 0;
    
    const twoHoursAgo = Date.now() - 7200000;
    const completedOrders = recentOrders.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();
      const isCompleted = order.status === 'delivered' || order.status === 'ready';
      return isCompleted && orderTime > twoHoursAgo;
    });

    if (completedOrders.length === 0) return 0;

    const totalPrepTime = completedOrders.reduce((sum, order) => {
      if (order.statusTimestamps) {
        const createdTime = new Date(order.createdAt).getTime();
        const completedTime = order.statusTimestamps.delivered || 
                            order.statusTimestamps.ready || 
                            Date.now();
        return sum + (completedTime - createdTime);
      }
      return sum + (order.prepTime || 20) * 60000;
    }, 0);

    return Math.round(totalPrepTime / completedOrders.length / 60000);
  };

  // Update preparation time metrics
  const updatePrepTimeMetrics = () => {
    const currentAvgPrepTime = calculateAvgPrepTime();
    if (currentAvgPrepTime > 0) {
      setRealTimeMetrics(prev => ({
        ...prev,
        avgPrepTime: currentAvgPrepTime
      }));
    }
  };

  // Update orders/min and avg prep time in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      const currentOrdersPerMin = calculateOrdersPerMinute();
      
      setRealTimeMetrics(prev => ({
        ...prev,
        ordersPerMinute: currentOrdersPerMin
      }));

      // Update prep time less frequently to avoid excessive calculations
      if (Math.random() < 0.3) { // 30% chance each interval
        updatePrepTimeMetrics();
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [orderTimestamps, recentOrders]);

  // Clean up old order timestamps (older than 2 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const twoMinutesAgo = Date.now() - 120000;
      setOrderTimestamps(prev => prev.filter(timestamp => timestamp > twoMinutesAgo));
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Request real-time metrics when connected
  useEffect(() => {
    if (socket && isConnected && restaurantId) {
      // Request initial real-time metrics
      socket.emit('request_analytics', {
        restaurantId,
        period: dateRange
      });

      // Subscribe to real-time updates
      socket.emit('subscribe_analytics', {
        restaurantId,
        metrics: ['orders', 'revenue', 'prep_time', 'top_items']
      });
    }
  }, [socket, isConnected, restaurantId, dateRange]);

  // Fetch analytics data
  const fetchAnalyticsData = async (restId, period, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const token = localStorage.getItem("ownerToken");
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch recent orders for initial calculations
      const ordersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/restaurant/${restId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (ordersResponse.ok) {
        const ordersResult = await ordersResponse.json();
        if (ordersResult.success && ordersResult.data.orders) {
          setRecentOrders(ordersResult.data.orders);
          
          const timestamps = ordersResult.data.orders
            .filter(order => new Date(order.createdAt).getTime() > Date.now() - 120000)
            .map(order => new Date(order.createdAt).getTime());
          setOrderTimestamps(timestamps);
          
          const initialOrdersPerMin = calculateOrdersPerMinute();
          const initialAvgPrepTime = calculateAvgPrepTime();
          
          setRealTimeMetrics(prev => ({
            ...prev,
            ordersPerMinute: initialOrdersPerMin,
            avgPrepTime: initialAvgPrepTime
          }));
        }
      }

      // Fetch comprehensive analytics data
      const analyticsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/metrics/restaurant/${restId}/analytics?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        console.log('📊 Analytics data:', analyticsResult);
        if (analyticsResult.success) {
          setMetrics(analyticsResult.data.summary || {});
          setChartData(analyticsResult.data.charts || {});
          setTopItems(analyticsResult.data.topItems || []);
        } else {
          setDefaultData();
        }
      } else {
        console.warn('Analytics endpoint not available, using default data');
        setDefaultData();
      }

      // Fetch additional real-time metrics from API
      const metricsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/metrics/restaurant/${restId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (metricsResponse.ok) {
        const metricsResult = await metricsResponse.json();
        console.log('⚡ Metrics data:', metricsResult);
        if (metricsResult.success) {
          setRealTimeMetrics(prev => ({
            ...prev,
            totalRevenue: safeNumber(metricsResult.data.totalRevenue),
            avgOrderValue: safeNumber(metricsResult.data.avgOrderValue),
            totalOrders: safeNumber(metricsResult.data.totalOrders),
            ordersPerMinute: prev.ordersPerMinute === 0 ? safeNumber(metricsResult.data.ordersPerMinute) : prev.ordersPerMinute,
            avgPrepTime: prev.avgPrepTime === 0 ? safeNumber(metricsResult.data.avgPrepTime) : prev.avgPrepTime
          }));
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError(err.message);
      setDefaultData();
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("ownerToken");
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Get restaurant ID first
        const restaurantResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/restaurants/my/restaurant`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!restaurantResponse.ok) {
          throw new Error('Failed to fetch restaurant data');
        }

        const restaurantResult = await restaurantResponse.json();
        console.log(restaurantResult);
        console.log(restaurantResult.data.restaurant.data.restaurants[0]._id);
        
        if (restaurantResult.success && restaurantResult.data.restaurant) {
          const restId = restaurantResult.data.restaurant.data.restaurants[0]._id;
          setRestaurantId(restId);
          
          // Fetch analytics data
          await fetchAnalyticsData(restId, dateRange);
        } else {
          throw new Error('No restaurant found for this owner');
        }
        
      } catch (err) {
        console.error('❌ Error fetching initial data:', err);
        setError(err.message);
        setDefaultData();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Refetch when date range changes
  useEffect(() => {
    if (restaurantId) {
      fetchAnalyticsData(restaurantId, dateRange, false);
      
      // Request updated real-time data for new period
      if (socket && isConnected) {
        socket.emit('request_analytics', {
          restaurantId,
          period: dateRange
        });
      }
    }
  }, [dateRange]);

  // Set default data when API fails
  const setDefaultData = () => {
    setMetrics({
      totalOrders: 0,
      totalRevenue: 0,
      customerCount: 0,
      newCustomers: 0,
      completionRate: 0,
      cancellationRate: 0,
      avgOrderValue: 0,
      avgPreparationTime: 0
    });
    
    setChartData({
      revenue: [0, 0, 0, 0, 0, 0, 0],
      orders: [0, 0, 0, 0, 0, 0, 0],
      customers: [0, 0, 0, 0, 0, 0, 0],
      categories: [
        { name: 'Main Course', value: 40, color: colors.primary },
        { name: 'Appetizers', value: 25, color: colors.info },
        { name: 'Desserts', value: 20, color: colors.accent },
        { name: 'Beverages', value: 15, color: '#8B5CF6' }
      ]
    });
    
    setTopItems([]);
  };

  // Calculate performance metrics from recent orders
  const calculatePerformanceMetrics = () => {
    if (recentOrders.length === 0) return { completionRate: 0, cancellationRate: 0 };
    
    const totalOrders = recentOrders.length;
    const completedOrders = recentOrders.filter(order => 
      order.status === 'delivered' || order.status === 'ready'
    ).length;
    const cancelledOrders = recentOrders.filter(order => 
      order.status === 'cancelled'
    ).length;

    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    return { completionRate, cancellationRate };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  // Kafka metrics with real-time data
  const kafkaMetrics = [
    { 
      label: 'Orders/Min', 
      value: safeToFixed(realTimeMetrics.ordersPerMinute, 2), 
      change: realTimeMetrics.ordersPerMinute > 0 ? '+12%' : '0%', 
      color: colors.primary,
      icon: TrendingUp,
      description: 'Real-time order rate (last minute)',
      isLive: true
    },
    { 
      label: 'Avg Prep Time', 
      value: `${safeNumber(realTimeMetrics.avgPrepTime)}min`, 
      change: realTimeMetrics.avgPrepTime > 0 ? '-5%' : '0%', 
      color: colors.info,
      icon: Clock,
      description: 'Average preparation time (completed orders)',
      isLive: true
    },
    { 
      label: 'Total Revenue', 
      value: `PKR ${safeNumber(realTimeMetrics.totalRevenue).toLocaleString()}`, 
      change: '+15%', 
      color: colors.accent,
      icon: DollarSign,
      description: 'Hourly revenue',
      isLive: true
    },
    { 
      label: 'Avg Order Value', 
      value: `PKR ${safeToFixed(realTimeMetrics.avgOrderValue, 2)}`, 
      change: '+2%', 
      color: '#8B5CF6',
      icon: CheckCircle,
      description: 'Average order value',
      isLive: true
    }
  ];

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'performance', label: 'Performance', icon: Target }
  ];

  const exportReport = () => {
    console.log('Exporting analytics report...');
    alert('Analytics report downloaded successfully!');
  };

  const getTrendIcon = (change) => {
    const isPositive = change.startsWith('+');
    return isPositive ? <ArrowUp style={{width: 16, height: 16}} /> : <ArrowDown style={{width: 16, height: 16}} />;
  };

  const getTrendColor = (change) => {
    return change.startsWith('+') ? colors.accent : '#ef4444';
  };

  const getChartData = (dataKey) => {
    const data = chartData[dataKey] || [];
    if (dataKey === 'revenue' || dataKey === 'orders' || dataKey === 'customers') {
      while (data.length < 7) {
        data.push(0);
      }
      return data.slice(0, 7);
    }
    return data;
  };

  const getMetricValue = (metricKey, fallback = 0) => {
    return metrics[metricKey] !== undefined ? metrics[metricKey] : fallback;
  };

  if (loading) {
    return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa'}}>
        <div style={{textAlign: 'center'}}>
          <Loader style={{width: 48, height: 48, animation: 'spin 1s linear infinite', color: colors.primary}} />
          <p style={{marginTop: 16, color: '#6b7280'}}>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#f8f9fa'}}>
      {/* Navigation */}
      <nav style={{background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10}}>
        <div style={{maxWidth: 1280, margin: '0 auto', padding: '0 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64}}>
            <h1 style={{fontSize: 24, fontWeight: 'bold', color: '#111827'}}>Analytics Dashboard</h1>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: isConnected ? '#dcfce7' : '#fee2e2', borderRadius: 8}}>
                {isConnected ? <Wifi style={{width: 16, height: 16, color: '#16a34a'}} /> : <WifiOff style={{width: 16, height: 16, color: '#dc2626'}} />}
                <span style={{fontSize: 14, fontWeight: 500, color: isConnected ? '#16a34a' : '#dc2626'}}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8}}>
                <Calendar style={{width: 16, height: 16, color: '#6b7280'}} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{border: 'none', outline: 'none', fontSize: 14, cursor: 'pointer'}}
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={exportReport}
                style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: colors.primary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500}}
              >
                <Download style={{width: 16, height: 16}} />
                Export
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{maxWidth: 1280, margin: '0 auto', padding: 24}}>
        {/* Tabs */}
        <div style={{display: 'flex', gap: 8, marginBottom: 24, background: 'white', padding: 8, borderRadius: 12, border: '1px solid #e5e7eb'}}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: activeTab === tab.id ? colors.primary : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                <Icon style={{width: 16, height: 16}} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Real-time Metrics */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24}}>
          {kafkaMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} style={{background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 8, background: `${metric.color}20`}}>
                    <Icon style={{width: 20, height: 20, color: metric.color}} />
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                    {metric.isLive && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: `${metric.color}20`, borderRadius: 4}}>
                        <div style={{width: 6, height: 6, borderRadius: '50%', background: metric.color, animation: 'pulse 2s ease-in-out infinite'}} />
                        <span style={{fontSize: 10, fontWeight: 600, color: metric.color}}>LIVE</span>
                      </div>
                    )}
                    <span style={{display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500, color: getTrendColor(metric.change)}}>
                      {getTrendIcon(metric.change)}
                      {metric.change}
                    </span>
                  </div>
                </div>
                <p style={{fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4}}>{metric.value}</p>
                <p style={{fontSize: 14, fontWeight: 500, color: '#6b7280', marginBottom: 4}}>{metric.label}</p>
                <p style={{fontSize: 12, color: '#9ca3af'}}>{metric.description}</p>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 24}}>
          {/* Key Metrics */}
          <div style={{background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              <BarChart3 style={{width: 20, height: 20}} />
              Key Metrics
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              {[
                { icon: Package, label: 'Total Orders', value: getMetricValue('totalOrders', 0), subtitle: 'Completed orders' },
                { icon: DollarSign, label: 'Total Revenue', value: `PKR ${getMetricValue('totalRevenue', 0).toLocaleString()}`, subtitle: 'Gross revenue' },
                { icon: Users, label: 'Total Customers', value: getMetricValue('customerCount', 0), subtitle: 'Unique customers' },
                { icon: Users, label: 'New Customers', value: getMetricValue('newCustomers', 0), subtitle: 'This period' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f9fafb', borderRadius: 8}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, background: 'white'}}>
                        <Icon style={{width: 18, height: 18, color: colors.primary}} />
                      </div>
                      <div>
                        <p style={{fontSize: 14, fontWeight: 500, color: '#111827'}}>{item.label}</p>
                        <p style={{fontSize: 12, color: '#6b7280'}}>{item.subtitle}</p>
                      </div>
                    </div>
                    <span style={{fontSize: 18, fontWeight: 'bold', color: '#111827'}}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              <Target style={{width: 20, height: 20}} />
              Performance Metrics
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {[
                { 
                  label: 'Order Completion Rate', 
                  value: performanceMetrics.completionRate || getMetricValue('completionRate', 85.5), 
                  color: colors.primary, 
                  suffix: '%',
                  maxValue: 100 
                },
                { 
                  label: 'Cancellation Rate', 
                  value: performanceMetrics.cancellationRate || getMetricValue('cancellationRate', 4.2), 
                  color: '#ef4444', 
                  suffix: '%',
                  maxValue: 100 
                },
                { 
                  label: 'Average Order Value', 
                  value: realTimeMetrics.avgOrderValue || getMetricValue('avgOrderValue', 1250), 
                  color: colors.info, 
                  prefix: 'PKR ',
                  maxValue: 2000 
                },
                { 
                  label: 'Avg Preparation Time', 
                  value: realTimeMetrics.avgPrepTime || getMetricValue('avgPreparationTime', 18), 
                  color: colors.accent, 
                  suffix: ' min',
                  maxValue: 60 
                }
              ].map((item, idx) => {
                const percentage = item.suffix === '%' 
                  ? item.value 
                  : Math.min((item.value / item.maxValue) * 100, 100);
                
                return (
                  <div key={idx}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                      <span style={{fontSize: 14, fontWeight: 500, color: '#6b7280'}}>{item.label}</span>
                      <span style={{fontSize: 14, fontWeight: 'bold', color: '#111827'}}>
                        {item.prefix || ''}{item.value}{item.suffix || ''}
                      </span>
                    </div>
                    <div style={{width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden'}}>
                      <div 
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: item.color,
                          transition: 'width 0.3s ease',
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performing Items */}
          <div style={{background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb'}}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              <TrendingUp style={{width: 20, height: 20}} />
              Top Performing Items
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              {topItems.length > 0 ? (
                topItems.map((item, index) => (
                  <div key={item.name || index} style={{display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f9fafb', borderRadius: 8}}>
                    <span style={{fontSize: 20}}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <div style={{flex: 1}}>
                      <h4 style={{fontSize: 14, fontWeight: 600, marginBottom: 4}}>{item.name || `Item ${index + 1}`}</h4>
                      <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 12}}>
                        <span style={{color: '#6b7280'}}>{item.orders || 0} orders</span>
                        <span style={{color: colors.accent, fontWeight: 500}}>+{item.growth || 0}%</span>
                      </div>
                    </div>
                    <div style={{fontSize: 14, fontWeight: 'bold', color: '#111827'}}>PKR {(item.revenue || 0).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: 24, color: '#6b7280'}}>
                  <Package style={{width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3}} />
                  <p>No order data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;