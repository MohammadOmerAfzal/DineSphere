import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const userStr = params.get("user"); // Get user data from backend
      const error = params.get("error");

      if (error) {
        console.error("OAuth Error:", error);
        navigate("/login?error=" + error);
        return;
      }

      if (token && userStr) {
        try {
          // ✅ Use the user data sent from backend (more reliable)
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // ✅ Save to context/localStorage
          login({ user, token });
          navigate("/");
        } catch (err) {
          console.error("Failed to parse user data:", err);
          // Fallback: try to decode from JWT
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const user = {
              id: payload.id,
              email: payload.email,
              name: payload.name,
              role: payload.role,
            };
            login({ user, token });
            navigate("/");
          } catch (fallbackErr) {
            console.error("Fallback token decode failed:", fallbackErr);
            navigate("/login?error=auth_failed");
          }
        }
      } else {
        navigate("/login?error=no_token");
      }
    };

    handleCallback();
  }, [location, login, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2>Authenticating...</h2>
        <p>Please wait while we log you in.</p>
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AuthCallback;