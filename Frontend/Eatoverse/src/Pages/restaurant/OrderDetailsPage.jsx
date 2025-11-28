import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle, 
  Package, 
  Truck,
  MessageCircle,
  Printer,
  Copy
} from 'lucide-react';
import { colors } from '../../constant/colors';
import '../../Styles/OrderDetails.css';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Mock order data - in real app, fetch by orderId
  const [order, setOrder] = useState({
    id: orderId,
    customer: {
      name: 'John Doe',
      phone: '+92 300 1234567',
      address: 'House #123, Street 5, Satellite Town, Rawalpindi',
      email: 'john.doe@example.com'
    },
    restaurant: {
      name: 'Burger Hub',
      phone: '+92 51 1234567',
      address: 'Main Commercial Area, Rawalpindi'
    },
    items: [
      { id: 1, name: 'Classic Burger', quantity: 2, price: 599, notes: 'No onions' },
      { id: 2, name: 'Cheese Fries', quantity: 1, price: 299, notes: '' },
      { id: 3, name: 'Chocolate Shake', quantity: 1, price: 349, notes: 'Extra thick' }
    ],
    status: 'Preparing',
    timeline: [
      { status: 'Order Placed', time: '2:30 PM', completed: true },
      { status: 'Confirmed', time: '2:31 PM', completed: true },
      { status: 'Preparing', time: '2:35 PM', completed: true },
      { status: 'Ready', time: null, completed: false },
      { status: 'Out for Delivery', time: null, completed: false },
      { status: 'Delivered', time: null, completed: false }
    ],
    payment: {
      method: 'Cash on Delivery',
      subtotal: 1547,
      delivery: 50,
      tax: 77,
      total: 1674,
      status: 'Pending'
    },
    specialInstructions: 'Extra ketchup packets please. Please ring the bell twice.',
    estimatedDelivery: '3:15 PM',
    deliveryPartner: {
      name: 'Ahmed Khan',
      phone: '+92 300 7654321',
      vehicle: 'Motorcycle'
    }
  });

  const statusOptions = [
    { value: 'Confirmed', label: 'Confirm Order', color: colors.info, icon: CheckCircle },
    { value: 'Preparing', label: 'Start Preparing', color: colors.primary, icon: Package },
    { value: 'Ready', label: 'Mark as Ready', color: '#f59e0b', icon: CheckCircle },
    { value: 'Out for Delivery', label: 'Out for Delivery', color: '#8B5CF6', icon: Truck },
    { value: 'Completed', label: 'Complete Order', color: colors.accent, icon: CheckCircle },
    { value: 'Cancelled', label: 'Cancel Order', color: '#ef4444', icon: Clock }
  ];

  const updateOrderStatus = (newStatus) => {
    const updatedTimeline = order.timeline.map(step => {
      if (step.status === newStatus) {
        return { ...step, completed: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      }
      return step;
    });

    setOrder({
      ...order,
      status: newStatus,
      timeline: updatedTimeline
    });

    // Show success message
    alert(`Order status updated to: ${newStatus}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Order Placed': return Package;
      case 'Confirmed': return CheckCircle;
      case 'Preparing': return Clock;
      case 'Ready': return CheckCircle;
      case 'Out for Delivery': return Truck;
      case 'Delivered': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const handleContactCustomer = () => {
    console.log('Contacting customer:', order.customer.phone);
    // In real app, this would initiate a call or chat
    alert(`Calling ${order.customer.name} at ${order.customer.phone}`);
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleCopyOrderDetails = () => {
    const orderText = `Order #${order.id}\nCustomer: ${order.customer.name}\nItems: ${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}\nTotal: PKR ${order.payment.total}`;
    navigator.clipboard.writeText(orderText);
    alert('Order details copied to clipboard!');
  };

  return (
    <div className="order-details-container">
      <nav className="order-details-nav">
        <div className="nav-container">
          <button 
            onClick={() => navigate('/restaurant/orders')}
            className="back-button"
          >
            <ChevronRight className="back-icon" />
            <span className="back-text">Back to Orders</span>
          </button>
        </div>
      </nav>

      <div className="order-details-content">
        <div className="order-layout">
          {/* Left Column - Order Info */}
          <div className="order-main">
            {/* Order Header */}
            <div className="order-header-card">
              <div className="header-content">
                <div className="order-title-section">
                  <h1 className="order-title">Order #{order.id}</h1>
                  <div className="order-meta">
                    <div className="meta-item">
                      <Clock className="meta-icon" />
                      <span>Placed at {order.timeline[0].time}</span>
                    </div>
                    <div 
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status)
                      }}
                    >
                      {order.status}
                    </div>
                  </div>
                </div>
                <div className="header-actions">
                  <UpdateStatusButton
                    currentStatus={order.status}
                    statusOptions={statusOptions}
                    onStatusChange={updateOrderStatus}
                  />
                  <div className="utility-buttons">
                    <button onClick={handlePrintOrder} className="utility-button">
                      <Printer className="button-icon" />
                      Print
                    </button>
                    <button onClick={handleCopyOrderDetails} className="utility-button">
                      <Copy className="button-icon" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="customer-info-section">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <User className="icon" />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Customer</span>
                      <span className="info-value">{order.customer.name}</span>
                      <span className="info-subtext">{order.customer.email}</span>
                    </div>
                    <button 
                      onClick={handleContactCustomer}
                      className="contact-button"
                    >
                      <MessageCircle className="contact-icon" />
                      Contact
                    </button>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Phone className="icon" />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{order.customer.phone}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <MapPin className="icon" />
                    </div>
                    <div className="info-content">
                      <span className="info-label">Delivery Address</span>
                      <span className="info-value">{order.customer.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="order-section">
              <h3 className="section-title">Order Items</h3>
              <div className="items-list">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-content">
                      <div className="item-image">
                        🍔
                      </div>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <div className="item-meta">
                          <span className="item-quantity">Quantity: {item.quantity}</span>
                          <span className="item-price">PKR {item.price * item.quantity}</span>
                        </div>
                        {item.notes && (
                          <p className="item-notes">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <div className="special-instructions">
                  <h4 className="instructions-title">Special Instructions</h4>
                  <p className="instructions-text">{order.specialInstructions}</p>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="order-section">
              <h3 className="section-title">Payment Summary</h3>
              <div className="payment-details">
                <div className="payment-row">
                  <span className="payment-label">Subtotal</span>
                  <span className="payment-value">PKR {order.payment.subtotal}</span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Delivery Fee</span>
                  <span className="payment-value">PKR {order.payment.delivery}</span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Tax (5%)</span>
                  <span className="payment-value">PKR {order.payment.tax}</span>
                </div>
                <div className="payment-divider"></div>
                <div className="payment-row total-row">
                  <span className="total-label">Total</span>
                  <span className="total-value">PKR {order.payment.total}</span>
                </div>
                <div className="payment-method">
                  <span className="method-label">Payment Method:</span>
                  <span className="method-value">{order.payment.method}</span>
                  <span 
                    className={`payment-status ${order.payment.status.toLowerCase()}`}
                  >
                    {order.payment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {order.deliveryPartner && (
              <div className="order-section">
                <h3 className="section-title">Delivery Information</h3>
                <div className="delivery-info">
                  <div className="delivery-item">
                    <span className="delivery-label">Estimated Delivery</span>
                    <span className="delivery-value">{order.estimatedDelivery}</span>
                  </div>
                  <div className="delivery-item">
                    <span className="delivery-label">Delivery Partner</span>
                    <span className="delivery-value">{order.deliveryPartner.name}</span>
                    <span className="delivery-subtext">{order.deliveryPartner.vehicle}</span>
                  </div>
                  <div className="delivery-item">
                    <span className="delivery-label">Contact</span>
                    <span className="delivery-value">{order.deliveryPartner.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div className="order-sidebar">
            <div className="timeline-card">
              <h3 className="card-title">Order Timeline</h3>
              <div className="timeline">
                {order.timeline.map((step, index) => {
                  const Icon = getStatusIcon(step.status);
                  const isCompleted = step.completed;
                  const isCurrent = step.status === order.status;
                  const isLast = index === order.timeline.length - 1;
                  
                  return (
                    <div key={step.status} className="timeline-item">
                      <div className="timeline-marker">
                        <div
                          className={`marker ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                          style={{
                            backgroundColor: isCompleted ? colors.accent : '#e5e7eb'
                          }}
                        >
                          <Icon 
                            className="marker-icon" 
                          />
                        </div>
                        {!isLast && (
                          <div 
                            className={`timeline-connector ${isCompleted ? 'completed' : ''}`}
                          ></div>
                        )}
                      </div>
                      <div className="timeline-content">
                        <p className={`timeline-status ${isCompleted ? 'completed' : ''}`}>
                          {step.status}
                        </p>
                        {step.time && (
                          <p className="timeline-time">{step.time}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h3 className="card-title">Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  onClick={handleContactCustomer}
                  className="action-button primary"
                >
                  <MessageCircle className="action-icon" />
                  Contact Customer
                </button>
                <button 
                  onClick={() => navigate(`/restaurant/orders`)}
                  className="action-button secondary"
                >
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update Status Button Component
const UpdateStatusButton = ({ currentStatus, statusOptions, onStatusChange }) => {
  const currentOption = statusOptions.find(opt => opt.value === currentStatus);
  const nextOptions = statusOptions.filter(opt => 
    statusOptions.indexOf(opt) > statusOptions.indexOf(currentOption)
  );

  return (
    <div className="status-update-section">
      <h4 className="status-title">Update Status</h4>
      <div className="status-buttons">
        {nextOptions.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className="status-button"
              style={{backgroundColor: option.color}}
            >
              <Icon className="status-icon" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'Confirmed': return colors.info;
    case 'Preparing': return colors.primary;
    case 'Ready': return '#f59e0b';
    case 'Out for Delivery': return '#8B5CF6';
    case 'Completed': return colors.accent;
    case 'Cancelled': return '#ef4444';
    default: return colors.text;
  }
};

export default OrderDetailsPage;