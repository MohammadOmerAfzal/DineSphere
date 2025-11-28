import React, { useState } from "react";
import "../../Styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const OwnerLoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/owner/auth/login`,
        formData
      );
      console.log("Owner Login Success:", res.data);

      // Store owner data with different keys to avoid conflict with customer data
      localStorage.setItem("ownerId", res.data.data.owner._id);
      localStorage.setItem("ownerToken", res.data.data.token);
      localStorage.setItem("owner", JSON.stringify(res.data.data.owner));

      // Redirect based on whether restaurant is setup
      navigate("/restaurant/dashboard"); 
    } catch (err) {
      setError(err.response?.data?.message || "Owner login failed");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="welcome">
          Owner Login <span className="wave">👨‍💼</span>
        </h1>
        <form onSubmit={handleOwnerLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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

        <p className="footer-text">
          Don't have an account? <Link to="/owner/register" className="link">Sign up</Link>
        </p>
        
        <p className="footer-text">
          Are you a customer? <Link to="/login" className="link">Customer Login</Link>
        </p>
      </div>
    </div>
  );
};

export default OwnerLoginPage;