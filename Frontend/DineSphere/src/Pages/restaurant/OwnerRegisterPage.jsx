import React, { useState } from "react";
import "../../Styles/LoginPage.css"; // reuse your login/register CSS
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const OwnerRegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    profile: {
      firstName: "",
      lastName: "",
      phone: ""
    },
    businessInfo: {
      companyName: "",
      businessPhone: ""
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (profile.firstName, businessInfo.companyName)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/owner/auth/register`,
        formData
      );
      console.log("Owner Registration Success:", res.data);

      // Store owner data
      localStorage.setItem("ownerId", res.data.data.owner._id);
      localStorage.setItem("ownerToken", res.data.data.token); // Different key to avoid conflict
      localStorage.setItem("owner", JSON.stringify(res.data.data.owner));

      navigate("/restaurant-register"); 
    } catch (err) {
      setError(err.response?.data?.message || "Owner registration failed");
      console.error("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="welcome">
          Restaurant Owner Signup <span className="wave">👋</span>
        </h1>
        <form onSubmit={handleOwnerRegister}>
          <div className="form-group">
            <label>First Name *</label>
            <input
              name="profile.firstName"
              value={formData.profile.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name *</label>
            <input
              name="profile.lastName"
              value={formData.profile.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              name="profile.phone"
              type="tel"
              value={formData.profile.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              name="businessInfo.companyName"
              value={formData.businessInfo.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Business Phone</label>
            <input
              name="businessInfo.businessPhone"
              type="tel"
              value={formData.businessInfo.businessPhone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Continue"}
          </button>
        </form>

        <p className="footer-text">
          Already have an account? <Link to="/owner-login" className="link">Sign in</Link>
        </p>
        
        <p className="footer-text">
          Are you a customer? <Link to="/register" className="link">Customer Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default OwnerRegisterPage;