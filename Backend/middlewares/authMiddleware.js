// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Define public routes that don't require authentication
    const publicRoutes = [
      { path: '/api/restaurants', method: 'GET' },
      { path: '/api/restaurants/search', method: 'GET' },
      { path: '/api/restaurants/categories', method: 'GET' },
      { path: '/api/restaurants/featured', method: 'GET' },
      { path: '/api/restaurants/cuisine', method: 'GET' },
      { path: '/api/restaurants/debug', method: 'GET' },
      { path: '/api/auth/login', method: 'POST' },
      { path: '/api/auth/register', method: 'POST' },
      { path: '/api/auth/google', method: 'GET' },
      { path: '/api/auth/google/callback', method: 'GET' },
      { path: '/api/health', method: 'GET' }
    ];

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route =>
      req.path.startsWith(route.path) && req.method === route.method
    );

    console.log('🔐 [Auth Middleware]', {
      path: req.path,
      method: req.method,
      isPublicRoute,
      hasAuthHeader: !!req.headers.authorization
    });

    // Skip authentication for public routes
    if (isPublicRoute) {
      console.log('✅ [Auth Middleware] Public route — skipping authentication');
      return next();
    }

    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format."
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🧩 [Auth Middleware] Decoded Token:', decoded);

    // Normalize user payload so it's always consistent
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId || null,
    };

    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. Missing user ID."
      });
    }

    console.log('✅ [Auth Middleware] Authenticated user:', req.user.id);
    next();

  } catch (err) {
    console.error('❌ [Auth Middleware] JWT Verification Error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed."
    });
  }
};

module.exports = authMiddleware;
