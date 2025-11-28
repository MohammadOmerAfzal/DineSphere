import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all page components - FIXED PATHS (use lowercase for consistency)
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';
import RestaurantRegisterPage from './Pages/restaurant/RestaurantRegisterPage';
import LandingPage from './Pages/LandingPage';
import RestaurantDetailPage from './Pages/restaurant/RestaurantDetailPage';
import CartPage from './Pages/CartPage';
import CheckoutPage from './Pages/CheckoutPage';
import OrderTrackingPage from './Pages/OrderTrackingPage';
import OrderHistoryPage from './Pages/OrderHistoryPage';
import ProfilePage from './Pages/ProfilePage';
import MetricsDashboardPage from './Pages/MetricsDashboardPage';

import RestaurantDashboard from './Pages/restaurant/RestaurantDashboard';
import MenuManagementPage from './Pages/restaurant/MenuManagementPage';
import OrdersManagementPage from './Pages/restaurant/OrdersManagementPage';
import OrderDetailsPage from './Pages/restaurant/OrderDetailsPage';
import CustomersPage from './Pages/restaurant/CustomersPage';
import RestaurantSettingsPage from './Pages/restaurant/RestaurantSettingsPage';
import AnalyticsDashboard from './Pages/restaurant/AnalyticsDashboard';
import AuthCallback from './Pages/AuthCallback';
import OwnerRegisterPage from './Pages/restaurant/OwnerRegisterPage';
import OwnerLoginPage from './Pages/restaurant/OwnerLoginPage';


// Temporary bypass - remove authentication for now
const ProtectedRoute = ({ children }) => {
  // return user ? children : <Navigate to="/login" />;
  return children; // Temporarily allow all
};

const PublicRoute = ({ children }) => {
  // return !user ? children : <Navigate to="/" />;
  return children; // Temporarily allow all
};

const App = () => {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Remove AuthProvider and CartProvider temporarily */}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback/>}/>
          <Route path="/restaurant-register" element={<RestaurantRegisterPage />} />

          {/* Protected Routes - temporarily unprotected */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/tracking/:orderId" element={<OrderTrackingPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/metrics" element={<MetricsDashboardPage />} />

          <Route path="/owner/register" element={<OwnerRegisterPage />} />
          <Route path="/owner/login" element={<OwnerLoginPage />} />
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/menu" element={<MenuManagementPage />} />
          <Route path="/restaurant/orders" element={<OrdersManagementPage />} />
          <Route path="/restaurant/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/restaurant/customers" element={<CustomersPage />} />
          <Route path="/restaurant/settings" element={<RestaurantSettingsPage />} />
          <Route path="/restaurant/analytics" element={<AnalyticsDashboard />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;