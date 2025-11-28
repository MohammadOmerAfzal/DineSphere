import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  Package, 
  Truck, 
  CheckCircle, 
  Home,
  Phone,
  Clock,
  MapPin,
  User,
  Loader,
  AlertCircle,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react';
import '../Styles/OrderTracking.css';
import io from 'socket.io-client';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusUpdateNotification, setStatusUpdateNotification] = useState(null);

  // Define status progression
  const statuses = [
    { 
      status: 'pending',
      icon: Check, 
      label: 'Order Placed', 
      description: 'Your order has been confirmed and is being processed'
    },
    { 
      status: 'confirmed',
      icon: Package, 
      label: 'Confirmed', 
      description: 'Restaurant has confirmed your order'
    },
    { 
      status: 'preparing',
      icon: Package, 
      label: 'Preparing', 
      description: 'Restaurant is preparing your delicious meal'
    },
    { 
      status: 'ready',
      icon: Package, 
      label: 'Ready', 
      description: 'Your order is ready for pickup'
    },
    { 
      status: 'out_for_delivery',
      icon: Truck, 
      label: 'Out for Delivery', 
      description: 'Your order is on the way with our delivery partner'
    },
    { 
      status: 'delivered',
      icon: CheckCircle, 
      label: 'Delivered', 
      description: 'Your order has been successfully delivered'
    }
  ];

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
  if (socket && order?._id) {
    socket.emit('join-tenant', order.restaurantId);
    socket.emit('join-order', order._id);
    console.log(`👥 Joined order room: ${order._id} and tenant: ${order.restaurantId}`);

    socket.on('order_update', (data) => {
      console.log('📦 Real-time order update in tracking:', data);
      
      if (data.type === 'ORDER_STATUS_UPDATED' && data.orderId === order._id) {
        console.log('🔄 Status update in tracking page:', data.newStatus);
        
        setOrder(prev => ({
          ...prev,
          status: data.newStatus,
          timeline: [
            ...(prev.timeline || []),
            {
              status: data.newStatus,
              timestamp: new Date(data.timestamp),
              notes: data.note || `Order status updated to ${data.newStatus}`,
              actor: data.actor
            }
          ]
        }));

        setStatusUpdateNotification({
          message: `Order status updated to: ${getStatusText(data.newStatus)}`,
          newStatus: data.newStatus
        });

        setTimeout(() => {
          setStatusUpdateNotification(null);
        }, 5000);

        if (['ready', 'out_for_delivery', 'delivered'].includes(data.newStatus)) {
          playNotificationSound();
        }
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error in tracking:', error);
    });
  }

  return () => {
    if (socket && order?._id) {
      socket.emit('leave-tenant', order.restaurantId);
      socket.emit('leave-order', order._id);
      socket.off('order_update');
      socket.off('connect_error');
    }
  };
}, [socket, order]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/number/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch order details');
        }

        setOrder(result.data.order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getCurrentStatusIndex = () => {
    if (!order) return 0;
    return statuses.findIndex(status => status.status === order.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  // Format delivery time
  const formatDeliveryTime = () => {
    if (!order?.deliveryInfo?.estimatedDelivery) return 'Calculating...';
    
    const deliveryTime = new Date(order.deliveryInfo.estimatedDelivery);
    return deliveryTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format timeline timestamp
  const formatTimelineTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status text for display
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Order Placed',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Audio context not supported');
    }
  };

  const handleContactRider = () => {
    if (order?.riderInfo?.riderId?.phone) {
      window.open(`tel:${order.riderInfo.riderId.phone}`);
    } else {
      alert('Rider contact information not available yet');
    }
  };

  const handleContactRestaurant = () => {
    if (order?.restaurantId?.contact?.phone) {
      window.open(`tel:${order.restaurantId.contact.phone}`);
    } else {
      alert('Restaurant contact information not available');
    }
  };

  const handleViewAllOrders = () => {
    navigate('/orders');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getStatusColor = (index) => {
    if (index <= currentStatusIndex) return '#10b981'; // Green for completed
    if (index === currentStatusIndex + 1) return '#f59e0b'; // Orange for next
    return '#e5e7eb'; // Gray for future
  };

  // Auto-refresh order data every 30 seconds if not connected to real-time
  useEffect(() => {
    if (!isConnected && orderId) {
      const interval = setInterval(() => {
        const fetchOrder = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/orders/number/${orderId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            const result = await response.json();

            if (response.ok && result.success) {
              setOrder(result.data.order);
            }
          } catch (err) {
            console.error('Error refreshing order:', err);
          }
        };

        fetchOrder();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isConnected, orderId]);

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="loading-container">
          <Loader className="loading-spinner" size={48} />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <h2>Order Not Found</h2>
          <p>{error}</p>
          <button 
            onClick={handleBackToHome}
            className="home-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <h2>Order Not Found</h2>
          <p>We couldn't find an order with that number.</p>
          <button 
            onClick={handleBackToHome}
            className="home-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracking-container">
      {/* Status Update Notification */}
      {statusUpdateNotification && (
        <div className="status-update-notification">
          <div className="notification-content">
            <Bell className="notification-icon" />
            <div className="notification-text">
              <strong>Order Update!</strong>
              <span>{statusUpdateNotification.message}</span>
            </div>
            <button 
              onClick={() => setStatusUpdateNotification(null)}
              className="notification-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <nav className="tracking-nav">
        <div className="nav-container">
          <button 
            onClick={handleBackToHome}
            className="home-button"
          >
            <Home className="home-icon" />
            <span className="home-text">Home</span>
          </button>
          <div className="connection-status">
            {isConnected ? (
              <Wifi className="connection-icon connected" size={20} />
            ) : (
              <WifiOff className="connection-icon disconnected" size={20} />
            )}
            <span className="connection-text">
              {isConnected ? 'Live Tracking' : 'Offline - Polling'}
            </span>
          </div>
        </div>
      </nav>

      <div className="tracking-content">
        <div className="tracking-card">
          <div className="tracking-header">
            <div className="header-top">
              <h1 className="tracking-title">
                Track Your Order
              </h1>
              {isConnected && (
                <div className="live-badge">
                  <div className="live-pulse"></div>
                  LIVE
                </div>
              )}
            </div>
            <p className="tracking-subtitle">Order #{order.orderNumber}</p>
            <div className="order-timer">
              <Clock className="timer-icon" />
              <span className="timer-text">
                Estimated Delivery: {formatDeliveryTime()}
              </span>
            </div>
            
            {/* Restaurant Info */}
            <div className="restaurant-info">
              <h3 className="restaurant-name">
                {order.restaurantId?.basicInfo?.name || 'Restaurant'}
              </h3>
              <p className="restaurant-address">
                {order.restaurantId?.address?.city || ''}
              </p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="progress-section">
            <div className="progress-header">
              <h3 className="progress-title">Order Progress</h3>
              <div className="current-status">
                Current Status: <strong>{getStatusText(order.status)}</strong>
              </div>
            </div>

            <div className="progress-bar-background">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%`
                }}
              ></div>
            </div>

            <div className="progress-steps">
              {statuses.map((status, index) => {
                const Icon = status.icon;
                const isComplete = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isFuture = index > currentStatusIndex;

                // Find timeline entry for this status
                const timelineEntry = order.timeline?.find(
                  entry => entry.status === status.status
                );

                return (
                  <div key={index} className="progress-step">
                    <div
                      className={`step-indicator ${isComplete ? 'step-complete' : ''} ${isCurrent ? 'step-current' : ''} ${isFuture ? 'step-future' : ''}`}
                      style={{
                        backgroundColor: getStatusColor(index)
                      }}
                    >
                      <Icon className="step-icon" />
                      {isCurrent && isConnected && (
                        <div className="live-indicator-small"></div>
                      )}
                    </div>
                    <div className="step-content">
                      <p className={`step-label ${isComplete ? 'step-label-active' : ''}`}>
                        {status.label}
                        {isCurrent && <span className="current-badge">Current</span>}
                        {isCurrent && isConnected && (
                          <span className="live-badge-small">Live</span>
                        )}
                      </p>
                      {timelineEntry && (
                        <p className="step-time">
                          {formatTimelineTime(timelineEntry.timestamp)}
                        </p>
                      )}
                      <p className="step-description">
                        {timelineEntry?.notes || status.description}
                      </p>
                      {timelineEntry?.actor && (
                        <p className="step-actor">By: {timelineEntry.actor}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="order-items">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                  <span className="item-price">PKR {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>PKR {order.pricing?.subtotal || 0}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee:</span>
                <span>PKR {order.pricing?.deliveryFee || 0}</span>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <span>PKR {order.pricing?.taxAmount || 0}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>PKR {order.pricing?.total || 0}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="delivery-details">
            <h3 className="details-title">Delivery Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <Clock className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Estimated Delivery</span>
                  <span className="detail-value">{formatDeliveryTime()}</span>
                </div>
              </div>
              
              <div className="detail-item">
                <MapPin className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Delivery Address</span>
                  <span className="detail-value">
                    {order.deliveryInfo?.address?.addressLine1 || 'Address not specified'}
                    {order.deliveryInfo?.address?.city && `, ${order.deliveryInfo.address.city}`}
                  </span>
                </div>
              </div>
              
              {order.riderInfo?.riderId && (
                <div className="detail-item">
                  <User className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Delivery Partner</span>
                    <span className="detail-value">
                      {order.riderInfo.riderId.firstName} {order.riderInfo.riderId.lastName}
                    </span>
                    {order.status === 'out_for_delivery' && (
                      <span className="rider-status">On the way to you!</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="detail-item">
                <Phone className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                    {order.payment?.method || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Updates Section */}
          {isConnected && (
            <div className="realtime-updates">
              <div className="updates-header">
                <Bell className="updates-icon" />
                <h4>Real-time Updates Active</h4>
              </div>
              <p className="updates-description">
                You'll receive instant notifications when your order status changes.
                No need to refresh the page!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {order.riderInfo?.riderId && (
              <button
                onClick={handleContactRider}
                className="contact-button"
              >
                <Phone className="button-icon" />
                Contact Rider
              </button>
            )}
            <button
              onClick={handleContactRestaurant}
              className="contact-button secondary"
            >
              <Phone className="button-icon" />
              Contact Restaurant
            </button>
            <button
              onClick={handleViewAllOrders}
              className="orders-button"
            >
              View All Orders
            </button>
          </div>

          {/* Support Info */}
          <div className="support-info">
            <p className="support-text">
              Need help? Contact our support team at{' '}
              <span className="support-contact">support@foodapp.com</span>
            </p>
            {!isConnected && (
              <p className="connection-warning">
                ⚠️ Real-time connection lost. Page will refresh automatically every 30 seconds.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;