const jwt = require("jsonwebtoken");
const { authService } = require("../services/authService");
const { userRepository } = require("../repository/userRepository");
const {
  responseSuccess,
  responseFailure,
  responseBadRequest,
} = require("../common/responses");

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return responseBadRequest(res, "Email and password are required");
      }

      const { user, token } = await authService.login(email, password);
      return responseSuccess(res, { user, token }, "Login successful");
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  async register(req, res) {
    try {
      const user = await authService.register(req.body);

      // Generate JWT for immediate login
      const token = jwt.sign(
        { id: user._id, role: user.role, tenantId: user.tenantId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return responseSuccess(res, { user, token }, "Registration successful");
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  async googleCallback(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Redirect to frontend with token and user data
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: user._id,
          email: user.email,
          name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
          role: user.role,
          photo: user.photo,
        })
      )}`;

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("Google Callback Error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  },

  // New endpoint to handle frontend token verification
  async verifyToken(req, res) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return responseFailure(res, 'No token provided', 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      
      if (!user) {
        return responseFailure(res, 'User not found', 404);
      }

      return responseSuccess(res, { 
        user: {
          id: user._id,
          email: user.email,
          name: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
          role: user.role,
          photo: user.photo,
        }
      }, "Token valid");
    } catch (err) {
      return responseFailure(res, 'Invalid token', 401);
    }
  }
};

module.exports = { authController };