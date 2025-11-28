const express = require("express");
const passport = require("passport");
const { authController } = require("../controllers/authController");
const { body } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔹 Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    session: false 
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: false 
  }),
  authController.googleCallback
);

// Local login/register
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  authController.login
);

router.post(
  "/register",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  authController.register
);

// Token verification endpoint
router.get("/verify", authController.verifyToken);

// Get current user
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;