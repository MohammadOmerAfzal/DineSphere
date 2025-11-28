// controllers/restaurantOwnerAuthController.js
const jwt = require("jsonwebtoken");
const { restaurantOwnerAuthService } = require("../services/restaurantOwnerAuthService");
const {
  responseSuccess,
  responseFailure,
  responseBadRequest,
} = require("../common/responses");

const restaurantOwnerAuthController = {
  
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return responseBadRequest(res, "Email and password are required");
      }

      const { owner, token } = await restaurantOwnerAuthService.login(email, password);
      return responseSuccess(res, { owner, token }, "Owner login successful");
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  async register(req, res) {
    try {
      const { owner, token } = await restaurantOwnerAuthService.register(req.body);
      return responseSuccess(res, { owner, token }, "Owner registration successful");
    } catch (err) {
      return responseFailure(res, err.message);
    }
  },

  async googleCallback(req, res) {
    try {
      const owner = req.owner; // This will be set by passport strategy

      if (!owner) {
        return res.redirect(`${process.env.FRONTEND_URL}/owner/login?error=no_owner`);
      }

      const token = jwt.sign(
        {
          id: owner._id,
          email: owner.email,
          name: `${owner.profile?.firstName || ""} ${owner.profile?.lastName || ""}`,
          type: "restaurant_owner"
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const redirectUrl = `${process.env.FRONTEND_URL}/owner/auth/callback?token=${token}&owner=${encodeURIComponent(
        JSON.stringify({
          id: owner._id,
          email: owner.email,
          name: `${owner.profile?.firstName || ""} ${owner.profile?.lastName || ""}`,
          role: owner.role,
          restaurantId: owner.restaurantId
        })
      )}`;

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("Owner Google Callback Error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/owner/login?error=server_error`);
    }
  }
};

module.exports = { restaurantOwnerAuthController };