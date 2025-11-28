// routes/restaurantOwnerAuthRoutes.js
const express = require("express");
const passport = require("passport");
const { restaurantOwnerAuthController } = require("../controllers/restaurantOwnerAuthController");
const { body } = require("express-validator");
const ownerAuthMiddleware = require("../middlewares/ownerAuthMiddleware");

const router = express.Router();

// 🔹 Local login/register for owners
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  restaurantOwnerAuthController.login
);

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("profile.firstName").notEmpty(),
    body("profile.lastName").notEmpty()
  ],
  restaurantOwnerAuthController.register
);

// 🔹 Google OAuth for owners (optional - if you want separate OAuth)
router.get(
  "/google",
  passport.authenticate("google-owner", { 
    scope: ["profile", "email"],
    prompt: "select_account" 
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google-owner", { 
    failureRedirect: `${process.env.FRONTEND_URL}/owner/login?error=auth_failed`,
    session: false 
  }),
  restaurantOwnerAuthController.googleCallback
);

// 🔹 Get current owner profile
router.get("/me", ownerAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    owner: req.owner,
  });
});

// 🔹 Logout (if using sessions)
router.post("/logout", ownerAuthMiddleware, (req, res) => {
  // Handle logout logic if using sessions
  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;