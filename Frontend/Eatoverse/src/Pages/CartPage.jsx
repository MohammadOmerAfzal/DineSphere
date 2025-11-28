import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../Context/CartContext';
import '../Styles/CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    cartTotal, 
    cartCount,
    clearCart 
  } = useCart();

  const deliveryFee = cart.length > 0 ? 50 : 0;
  const tax = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + tax;

  const handleQuantityChange = (itemId, delta) => {
    updateQuantity(itemId, delta);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    
    // Check if all items are from the same restaurant
    const restaurantIds = [...new Set(cart.map(item => item.restaurantId))];
    if (restaurantIds.length > 1) {
      alert('Please order from one restaurant at a time. Your cart contains items from multiple restaurants.');
      return;
    }
    
    navigate('/checkout');
  };

  return (
    <div className="cart-page-container">
      <nav className="cart-nav">
        <div className="nav-container">
          <div className="nav-content">
            <button 
              onClick={() => navigate('/')} 
              className="back-button"
            >
              <ChevronRight className="back-icon" />
              <span className="back-text">Back</span>
            </button>
            <h1 className="cart-title">Your Cart</h1>
            <div className="nav-spacer"></div>
          </div>
        </div>
      </nav>

      <div className="cart-content">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart className="empty-cart-icon" />
            <h2 className="empty-cart-title">Your cart is empty</h2>
            <p className="empty-cart-text">Add some delicious items to get started!</p>
            <button
              onClick={() => navigate('/')}
              className="browse-restaurants-button"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-section">
              {/* Restaurant Header */}
              {cart.length > 0 && (
                <div className="restaurant-header">
                  <h3 className="restaurant-name">
                    {cart[0].restaurantName}
                  </h3>
                  <p className="restaurant-items-count">
                    {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
                  </p>
                </div>
              )}

              {cart.map(item => (
                <div key={item.id || item._id} className="cart-item-card">
                  <div className="cart-item-content">
                    <div className="item-image">
                      {item.image || '🍽️'}
                    </div>
                    <div className="item-details">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-description">{item.description}</p>
                      <p className="item-price">PKR {item.price}</p>
                      {item.restaurantName && (
                        <p className="item-restaurant">From: {item.restaurantName}</p>
                      )}
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleQuantityChange(item.id || item._id, -1)}
                          className="quantity-button decrease-button"
                        >
                          <Minus className="quantity-icon" />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id || item._id, 1)}
                          className="quantity-button increase-button"
                        >
                          <Plus className="quantity-icon" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id || item._id)}
                        className="remove-button"
                      >
                        <Trash2 className="remove-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary-section">
              <div className="order-summary-card">
                <h2 className="summary-title">Order Summary</h2>
                <div className="summary-details">
                  <div className="summary-row">
                    <span className="summary-label">Subtotal ({cartCount} items)</span>
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
                <button
                  onClick={handleProceedToCheckout}
                  className="checkout-button"
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                </button>
                
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="clear-cart-button"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;