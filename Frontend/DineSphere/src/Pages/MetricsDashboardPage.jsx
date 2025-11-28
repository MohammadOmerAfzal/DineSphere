import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  DollarSign, 
  Clock,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  Target
} from 'lucide-react';
import { colors } from '../constant/colors';
import '../Styles/MetricsDashboard.css';

const MetricsDashboardPage = () => {
  const navigate = useNavigate();
  
  const metrics = [
    { 
      label: 'Active Orders', 
      value: '142', 
      change: '+12%', 
      icon: Package, 
      color: colors.primary,
      description: 'Orders being processed'
    },
    { 
      label: 'Total Customers', 
      value: '1,234', 
      change: '+8%', 
      icon: Users, 
      color: colors.info,
      description: 'Registered customers'
    },
    { 
      label: 'Revenue Today', 
      value: 'PKR 45,678', 
      change: '+15%', 
      icon: DollarSign, 
      color: colors.accent,
      description: 'Total revenue generated'
    },
    { 
      label: 'Avg Delivery Time', 
      value: '28 min', 
      change: '-5%', 
      icon: Clock, 
      color: '#f59e0b',
      description: 'Average delivery duration'
    }
  ];

  const recentOrders = [
    { 
      id: 1, 
      customer: 'John Doe', 
      items: 3, 
      total: 1299, 
      status: 'Preparing',
      time: '2 min ago'
    },
    { 
      id: 2, 
      customer: 'Jane Smith', 
      items: 2, 
      total: 899, 
      status: 'Delivered',
      time: '15 min ago'
    },
    { 
      id: 3, 
      customer: 'Ali Khan', 
      items: 1, 
      total: 599, 
      status: 'Out for Delivery',
      time: '8 min ago'
    },
    { 
      id: 4, 
      customer: 'Sara Ahmed', 
      items: 4, 
      total: 1899, 
      status: 'Preparing',
      time: '5 min ago'
    }
  ];

  const popularItems = [
    { name: 'Classic Burger', emoji: '🍔', orders: 142, price: 599 },
    { name: 'Pepperoni Pizza', emoji: '🍕', orders: 98, price: 1299 },
    { name: 'Chicken Biryani', emoji: '🍛', orders: 87, price: 799 },
    { name: 'Cheese Fries', emoji: '🍟', orders: 76, price: 299 },
    { name: 'Chocolate Shake', emoji: '🥤', orders: 65, price: 349 },
    { name: 'Grilled Chicken', emoji: '🍗', orders: 54, price: 899 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: `${colors.accent}20`, text: colors.accent };
      case 'Preparing':
        return { bg: `${colors.primary}20`, text: colors.primary };
      case 'Out for Delivery':
        return { bg: `${colors.info}20`, text: colors.info };
      default:
        return { bg: '#e5e7eb', text: '#6b7280' };
    }
  };

  return (
    <div className="metrics-dashboard-container">
      <nav className="metrics-nav">
        <div className="nav-container">
          <div className="nav-content">
            <button 
              onClick={() => navigate('/profile')}
              className="back-button"
            >
              <ChevronRight className="back-icon" />
              <span className="back-text">Back</span>
            </button>
            <h1 className="page-title">Live Metrics</h1>
            <div className="live-indicator">
              <div className="live-pulse" style={{backgroundColor: colors.accent}}></div>
              <span className="live-text">Live</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="metrics-content">
        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            const isPositive = metric.change.startsWith('+');
            
            return (
              <div key={idx} className="metric-card">
                <div className="metric-header">
                  <div 
                    className="metric-icon-container"
                    style={{backgroundColor: `${metric.color}20`}}
                  >
                    <Icon className="metric-icon" style={{color: metric.color}} />
                  </div>
                  <span className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                    <TrendingUp className="change-icon" />
                    {metric.change}
                  </span>
                </div>
                <div className="metric-content">
                  <p className="metric-value">{metric.value}</p>
                  <p className="metric-label">{metric.label}</p>
                  <p className="metric-description">{metric.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Recent Orders */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <ShoppingBag className="card-icon" />
                Recent Orders
              </h3>
              <button 
                onClick={() => navigate('/orders')}
                className="view-all-button"
              >
                View All
                <ChevronRight className="view-all-icon" />
              </button>
            </div>
            <div className="orders-list">
              {recentOrders.map(order => {
                const statusColors = getStatusColor(order.status);
                
                return (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div className="order-customer">
                        <span className="customer-name">{order.customer}</span>
                        <span className="order-time">{order.time}</span>
                      </div>
                      <div className="order-details">
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-items">{order.items} items</span>
                      </div>
                    </div>
                    <div className="order-meta">
                      <span 
                        className="order-status"
                        style={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.text
                        }}
                      >
                        {order.status}
                      </span>
                      <span className="order-total">PKR {order.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales Overview */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">
                <BarChart3 className="card-icon" />
                Sales Overview
              </h3>
            </div>
            <div className="sales-content">
              <div className="targets-section">
                <div className="target-item">
                  <div className="target-header">
                    <span className="target-label">Today's Target</span>
                    <span className="target-percentage">75%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill today"
                      style={{width: '75%'}}
                    ></div>
                  </div>
                </div>
                
                <div className="target-item">
                  <div className="target-header">
                    <span className="target-label">Weekly Target</span>
                    <span className="target-percentage">62%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill weekly"
                      style={{width: '62%'}}
                    ></div>
                  </div>
                </div>
                
                <div className="target-item">
                  <div className="target-header">
                    <span className="target-label">Monthly Target</span>
                    <span className="target-percentage">58%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill monthly"
                      style={{width: '58%'}}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="peak-hours-card">
                <Target className="peak-icon" />
                <div className="peak-content">
                  <p className="peak-label">Peak Hours</p>
                  <p className="peak-time">12:00 PM - 2:00 PM</p>
                  <p className="peak-stats">40% of daily orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Items */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp className="card-icon" />
              Popular Items Today
            </h3>
          </div>
          <div className="popular-items-grid">
            {popularItems.map((item, idx) => (
              <div key={idx} className="popular-item-card">
                <div className="item-emoji">{item.emoji}</div>
                <div className="item-details">
                  <h4 className="item-name">{item.name}</h4>
                  <p className="item-orders">{item.orders} orders</p>
                </div>
                <div className="item-price">PKR {item.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">89%</span>
              <span className="stat-label">Customer Satisfaction</span>
            </div>
            <div className="stat-trend positive">
              <TrendingUp className="stat-trend-icon" />
              +5%
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">24</span>
              <span className="stat-label">Active Restaurants</span>
            </div>
            <div className="stat-trend positive">
              <TrendingUp className="stat-trend-icon" />
              +3
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">92%</span>
              <span className="stat-label">On-time Delivery</span>
            </div>
            <div className="stat-trend positive">
              <TrendingUp className="stat-trend-icon" />
              +2%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboardPage;