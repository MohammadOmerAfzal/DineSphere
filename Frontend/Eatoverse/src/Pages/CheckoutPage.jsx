import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../Context/CartContext';
import '../Styles/CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, cartTotal, cartCount } = useCart();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cash'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Check if all items are from the same restaurant
    const restaurantIds = [...new Set(cart.map(item => item.restaurantId))];
    if (restaurantIds.length > 1) {
      alert('Please order from one restaurant at a time. Your cart contains items from multiple restaurants.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      
      // Prepare order data
      const orderData = {
        restaurantId: cart[0].restaurantId,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
          specialInstructions: item.specialInstructions || '',
          subtotal: item.price * item.quantity
        })),
        deliveryInfo: {
          address: {
            addressLine1: formData.address,
            city: formData.city,
            postalCode: formData.postalCode
          },
          instructions: formData.specialInstructions || ''
        },
        payment: {
          method: formData.paymentMethod
        },
        type: 'delivery'
      };

      console.log('Placing order:', orderData);

      // Call order API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to place order');
      }

      console.log('Order placed successfully:', result.data);

      // Clear cart and navigate to tracking
      clearCart();
      navigate(`/tracking/${result.data.order.orderNumber}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = cart.length > 0 ? 50 : 0;
  const tax = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + tax;

  return (
    <div className="checkout-container">
      <nav className="checkout-nav">
        <div className="nav-container">
          <button 
            onClick={() => navigate('/cart')} 
            className="back-button"
          >
            <ChevronRight className="back-icon" />
            <span className="back-text">Back to Cart</span>
          </button>
        </div>
      </nav>

      <div className="checkout-content">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-layout">
          <div className="checkout-forms">
            {/* Order Items Summary */}
            {cart.length > 0 && (
              <div className="checkout-section">
                <h2 className="section-title">Order Items</h2>
                <div className="order-items-list">
                  {cart.map(item => (
                    <div key={item.id || item._id} className="order-item">
                      <div className="order-item-image">
                        {item.image || '🍽️'}
                      </div>
                      <div className="order-item-details">
                        <h4 className="order-item-name">{item.name}</h4>
                        <p className="order-item-price">PKR {item.price} x {item.quantity}</p>
                      </div>
                      <div className="order-item-total">
                        PKR {item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
                {cart[0]?.restaurantName && (
                  <div className="restaurant-info">
                    <strong>Restaurant:</strong> {cart[0].restaurantName}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Address Section */}
            <div className="checkout-section">
              <h2 className="section-title">Delivery Address</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="John Doe" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+92 300 1234567" 
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Complete Address *</label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="3" 
                    placeholder="Street, House No, Area, Landmark"
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Rawalpindi" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input 
                    type="text" 
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="46000" 
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="checkout-section">
              <h2 className="section-title">Payment Method</h2>
              <div className="payment-options">
                <label className={`payment-option ${formData.paymentMethod === 'cash' ? 'payment-option-active' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="payment-radio"
                  />
                  <div className="payment-content">
                    <span className="payment-label">Cash on Delivery</span>
                    <span className="payment-description">Pay when you receive your order</span>
                  </div>
                </label>
                
                <label className={`payment-option ${formData.paymentMethod === 'card' ? 'payment-option-active' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="payment-radio"
                  />
                  <div className="payment-content">
                    <span className="payment-label">Credit/Debit Card</span>
                    <span className="payment-description">Pay securely with your card</span>
                  </div>
                </label>
                
                <label className={`payment-option ${formData.paymentMethod === 'mobile' ? 'payment-option-active' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod"
                    value="mobile"
                    checked={formData.paymentMethod === 'mobile'}
                    onChange={handleInputChange}
                    className="payment-radio"
                  />
                  <div className="payment-content">
                    <span className="payment-label">JazzCash/Easypaisa</span>
                    <span className="payment-description">Pay via mobile wallet</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-sidebar">
            <div className="order-summary-card">
              <h2 className="summary-title">Order Summary</h2>
              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">Items ({cartCount})</span>
                  <span className="summary-value">PKR {cartTotal}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Delivery Fee</span>
                  <span className="summary-value">PKR {deliveryFee}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tax (5%)</span>
                  <span className="summary-value">PKR {tax}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row">
                  <span className="total-label">Total</span>
                  <span className="total-value">PKR {grandTotal}</span>
                </div>
              </div>
              
              {cart.length > 0 ? (
                <button
                  onClick={handlePlaceOrder}
                  className="place-order-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </button>
              ) : (
                <button
                  disabled
                  className="place-order-button disabled"
                >
                  Cart is Empty
                </button>
              )}
              
              <div className="security-notice">
                <div className="security-icon">🔒</div>
                <span className="security-text">Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;