import React, { useState } from "react";
import "../Styles/LoginPage.css";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../Context/AuthContext"; // Add this import

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Add this

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Email/Password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        formData
      );

      // ✅ Use auth context to login (stores token + user)
      login(res.data.data);
      navigate("/"); // redirect to home
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Google login redirect
  const handleGoogleLogin = () => {
    // Simple redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="welcome">
          Welcome Back <span className="wave">👋</span>
        </h1>
        <p className="subtitle">Sign in to continue exploring restaurants</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
              <span
                className="toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="divider">OR</div>

        <button 
          className="btn-google" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <FcGoogle size={28} /> Continue with Google
        </button>

        <p className="footer-text">
          Don't have an account?{" "}
          <Link to="/register" className="link">Sign up</Link>
        </p>
        <p className="footer-text">
          Are you a restaurant owner?{" "}
          <Link to="/owner/register" className="link">Register your restaurant</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;