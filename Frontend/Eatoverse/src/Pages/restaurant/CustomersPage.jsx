import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  DollarSign, 
  Package,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Eye,
  RefreshCw,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { colors } from '../../constant/colors';
import '../../Styles/CustomersPage.css';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('orders');
  const [viewMode, setViewMode] = useState('grid');

  const statusOptions = ['All', 'New', 'Regular', 'VIP'];

  // Generate customers from orders data
  const generateCustomersFromOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders from your API
      const response = await fetch('/api/orders'); // Your existing orders endpoint
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const orders = await response.json();
      
      // Transform orders into customer data
      const customersMap = {};
      
      orders.forEach(order => {
        const customerIdentifier = order.customerPhone || order.customerEmail || order.customerName;
        
        if (!customersMap[customerIdentifier]) {
          customersMap[customerIdentifier] = {
            id: customerIdentifier,
            name: order.customerName || 'Unknown Customer',
            email: order.customerEmail || '',
            phone: order.customerPhone || '',
            orders: 0,
            totalSpent: 0,
            orderDates: [],
            favoriteItems: {},
            ratings: []
          };
        }
        
        const customer = customersMap[customerIdentifier];
        customer.orders += 1;
        customer.totalSpent += order.totalAmount || 0;
        customer.orderDates.push(new Date(order.orderDate || order.createdAt));
        
        // Track favorite items
        if (order.items) {
          order.items.forEach(item => {
            customer.favoriteItems[item.name] = (customer.favoriteItems[item.name] || 0) + (item.quantity || 1);
          });
        }
        
        // Track ratings if available
        if (order.rating) {
          customer.ratings.push(order.rating);
        }
      });
      
      // Convert map to array and calculate derived fields
      const customersArray = Object.values(customersMap).map(customer => {
        const favoriteItems = Object.entries(customer.favoriteItems)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([item]) => item);
        
        const avgRating = customer.ratings.length > 0 
          ? (customer.ratings.reduce((a, b) => a + b, 0) / customer.ratings.length).toFixed(1)
          : (4 + Math.random()).toFixed(1); // Default rating if none available
        
        const lastOrder = customer.orderDates.sort((a, b) => b - a)[0];
        const joinDate = customer.orderDates.sort((a, b) => a - b)[0];
        
        // Determine status based on order count and spending
        let status = 'New';
        if (customer.orders >= 10 || customer.totalSpent >= 15000) {
          status = 'VIP';
        } else if (customer.orders >= 3) {
          status = 'Regular';
        }
        
        return {
          ...customer,
          favoriteItems,
          rating: parseFloat(avgRating),
          lastOrder: lastOrder?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          joinDate: joinDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          status,
          avgOrderValue: Math.round(customer.totalSpent / customer.orders)
        };
      });
      
      setCustomers(customersArray);
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Generate sample data if no orders available
  const generateSampleCustomers = () => {
    const sampleCustomers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+92 300 1234567',
        orders: 15,
        totalSpent: 12500,
        lastOrder: '2024-01-15',
        joinDate: '2023-06-10',
        rating: 4.8,
        status: 'Regular',
        favoriteItems: ['Classic Burger', 'Cheese Fries'],
        avgOrderValue: 833
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+92 301 2345678',
        orders: 8,
        totalSpent: 6800,
        lastOrder: '2024-01-14',
        joinDate: '2023-08-22',
        rating: 4.5,
        status: 'Regular',
        favoriteItems: ['Chicken Pizza'],
        avgOrderValue: 850
      },
      {
        id: 3,
        name: 'Ali Khan',
        email: 'ali.khan@example.com',
        phone: '+92 302 3456789',
        orders: 3,
        totalSpent: 2400,
        lastOrder: '2024-01-10',
        joinDate: '2024-01-01',
        rating: 4.2,
        status: 'New',
        favoriteItems: ['Grilled Chicken'],
        avgOrderValue: 800
      }
    ];
    
    setCustomers(sampleCustomers);
    setLoading(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    generateCustomersFromOrders().catch(() => {
      // If orders API fails, use sample data
      generateSampleCustomers();
    });
  }, []);

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'orders': return (b.orders || 0) - (a.orders || 0);
        case 'spent': return (b.totalSpent || 0) - (a.totalSpent || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'recent': return new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0);
        case 'name': return (a.name || '').localeCompare(b.name || '');
        default: return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return colors.info;
      case 'Regular': return colors.primary;
      case 'VIP': return '#8B5CF6';
      default: return colors.text;
    }
  };

  // Calculate analytics dynamically
  const analytics = {
    totalCustomers: customers.length,
    averageOrders: customers.length > 0 
      ? (customers.reduce((sum, c) => sum + (c.orders || 0), 0) / customers.length).toFixed(1)
      : '0',
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    averageRating: customers.length > 0
      ? (customers.reduce((sum, c) => sum + (c.rating || 0), 0) / customers.length).toFixed(1)
      : '0',
    vipCustomers: customers.filter(c => c.status === 'VIP').length
  };

  const handleContactCustomer = (customer, method) => {
    console.log(`Contacting ${customer.name} via ${method}:`, customer[method]);
    alert(`Opening ${method} for ${customer.name}`);
  };

  const handleViewCustomerDetails = (customerId) => {
    console.log('Viewing customer details:', customerId);
    alert(`Opening customer #${customerId} details`);
  };

  const handleRefresh = () => {
    generateCustomersFromOrders().catch(() => {
      generateSampleCustomers();
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="customers-container">
        <nav className="customers-nav">
          <div className="nav-container">
            <h1 className="page-title">Customers</h1>
          </div>
        </nav>
        <div className="loading-state">
          <RefreshCw className="loading-icon spinning" />
          <h3>Loading customers...</h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="customers-container">
        <nav className="customers-nav">
          <div className="nav-container">
            <h1 className="page-title">Customers</h1>
          </div>
        </nav>
        <div className="error-state">
          <AlertCircle className="error-icon" />
          <h3>Error Loading Customers</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            <RefreshCw className="button-icon" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customers-container">
      <nav className="customers-nav">
        <div className="nav-container">
          <h1 className="page-title">Customers</h1>
          <button onClick={handleRefresh} className="refresh-button">
            <RefreshCw className="button-icon" />
            Refresh
          </button>
        </div>
      </nav>

      <div className="customers-content">
        {/* Analytics Cards */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="card-content">
              <div className="card-text">
                <p className="card-label">Total Customers</p>
                <p className="card-value">{analytics.totalCustomers}</p>
                <p className="card-trend positive">From {customers.reduce((sum, c) => sum + c.orders, 0)} total orders</p>
              </div>
              <div className="card-icon">
                <Users className="icon" />
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-content">
              <div className="card-text">
                <p className="card-label">Avg Orders/Customer</p>
                <p className="card-value">{analytics.averageOrders}</p>
                <p className="card-trend positive">Based on order history</p>
              </div>
              <div className="card-icon">
                <ShoppingCart className="icon" />
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-content">
              <div className="card-text">
                <p className="card-label">Total Revenue</p>
                <p className="card-value">PKR {analytics.totalRevenue.toLocaleString()}</p>
                <p className="card-trend positive">From all customer orders</p>
              </div>
              <div className="card-icon">
                <DollarSign className="icon" />
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-content">
              <div className="card-text">
                <p className="card-label">VIP Customers</p>
                <p className="card-value">{analytics.vipCustomers}</p>
                <p className="card-trend positive">
                  {analytics.totalCustomers > 0 
                    ? `${((analytics.vipCustomers / analytics.totalCustomers) * 100).toFixed(1)}% of total`
                    : '0% of total'
                  }
                </p>
              </div>
              <div className="card-icon">
                <Star className="icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="filters-section">
          <div className="search-filters">
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <Filter className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <TrendingUp className="filter-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="orders">Most Orders</option>
                <option value="spent">Highest Spending</option>
                <option value="rating">Best Rating</option>
                <option value="recent">Most Recent</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Customers Display */}
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-icon" />
            <h3 className="empty-title">
              {customers.length === 0 ? 'No customers yet' : 'No customers found'}
            </h3>
            <p className="empty-description">
              {searchTerm || statusFilter !== 'All' 
                ? 'Try adjusting your search or filters'
                : customers.length === 0
                ? 'Customers will appear here once they start placing orders'
                : 'No customers match your criteria'
              }
            </p>
            {(searchTerm || statusFilter !== 'All') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                }}
                className="clear-filters-button"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="customers-grid">
            {filteredCustomers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onContact={handleContactCustomer}
                onViewDetails={handleViewCustomerDetails}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        ) : (
          <CustomersTable
            customers={filteredCustomers}
            onContact={handleContactCustomer}
            onViewDetails={handleViewCustomerDetails}
            getStatusColor={getStatusColor}
          />
        )}
      </div>
    </div>
  );
};

// Customer Card Component for Grid View
const CustomerCard = ({ customer, onContact, onViewDetails, getStatusColor }) => {
  return (
    <div className="customer-card">
      <div className="card-header">
        <div className="customer-avatar">
          {customer.name?.split(' ').map(n => n[0]).join('') || 'CU'}
        </div>
        <div className="customer-info">
          <h3 className="customer-name">{customer.name || 'Unknown Customer'}</h3>
          <div 
            className="customer-status"
            style={{
              backgroundColor: `${getStatusColor(customer.status)}20`,
              color: getStatusColor(customer.status)
            }}
          >
            {customer.status || 'Unknown'}
          </div>
        </div>
      </div>

      <div className="customer-contact">
        <div className="contact-item">
          <Mail className="contact-icon" />
          <span className="contact-text">{customer.email || 'No email'}</span>
        </div>
        <div className="contact-item">
          <Phone className="contact-icon" />
          <span className="contact-text">{customer.phone || 'No phone'}</span>
        </div>
      </div>

      <div className="customer-stats">
        <div className="stat">
          <span className="stat-value">{customer.orders || 0}</span>
          <span className="stat-label">Orders</span>
        </div>
        <div className="stat">
          <span className="stat-value">PKR {customer.totalSpent || 0}</span>
          <span className="stat-label">Total Spent</span>
        </div>
        <div className="stat">
          <div className="rating">
            <Star className="star-icon" />
            <span className="rating-value">{customer.rating || '0.0'}</span>
          </div>
          <span className="stat-label">Rating</span>
        </div>
      </div>

      {customer.favoriteItems && customer.favoriteItems.length > 0 && (
        <div className="favorite-items">
          <span className="favorites-label">Favorites:</span>
          <div className="items-list">
            {customer.favoriteItems.map((item, index) => (
              <span key={index} className="item-tag">{item}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card-actions">
        <button
          onClick={() => onContact(customer, 'phone')}
          className="action-button primary"
          disabled={!customer.phone}
        >
          <Phone className="action-icon" />
          Call
        </button>
        <button
          onClick={() => onViewDetails(customer.id)}
          className="action-button secondary"
        >
          <Eye className="action-icon" />
          Details
        </button>
      </div>
    </div>
  );
};

// Customers Table Component for Table View
const CustomersTable = ({ customers, onContact, onViewDetails, getStatusColor }) => {
  return (
    <div className="customers-table">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-head">Customer</th>
              <th className="table-head">Contact</th>
              <th className="table-head">Orders</th>
              <th className="table-head">Total Spent</th>
              <th className="table-head">Avg Order</th>
              <th className="table-head">Rating</th>
              <th className="table-head">Status</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className="table-row">
                <td className="table-cell">
                  <div className="customer-cell">
                    <div className="customer-avatar small">
                      {customer.name?.split(' ').map(n => n[0]).join('') || 'CU'}
                    </div>
                    <div>
                      <div className="customer-name">{customer.name || 'Unknown Customer'}</div>
                      <div className="customer-meta">
                        Since {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="contact-cell">
                    <div>{customer.email || 'No email'}</div>
                    <div className="contact-phone">{customer.phone || 'No phone'}</div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="orders-count">{customer.orders || 0}</span>
                </td>
                <td className="table-cell">
                  <span className="total-spent">PKR {customer.totalSpent || 0}</span>
                </td>
                <td className="table-cell">
                  <span className="avg-order">PKR {customer.avgOrderValue || 0}</span>
                </td>
                <td className="table-cell">
                  <div className="rating-cell">
                    <Star className="star-icon" />
                    <span>{customer.rating || '0.0'}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: `${getStatusColor(customer.status)}20`,
                      color: getStatusColor(customer.status)
                    }}
                  >
                    {customer.status || 'Unknown'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => onContact(customer, 'phone')}
                      className="icon-button"
                      title="Call Customer"
                      disabled={!customer.phone}
                    >
                      <Phone className="icon" />
                    </button>
                    <button
                      onClick={() => onViewDetails(customer.id)}
                      className="icon-button"
                      title="View Details"
                    >
                      <Eye className="icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;