const express = require("express");
const { body, validationResult } = require("express-validator");
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");
const { cacheMiddleware } = require('../utils/cacheUtils');
const { publicApiRateLimit, strictRateLimit } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

router.get('/', 
  publicApiRateLimit,
  cacheMiddleware(300), 
  restaurantController.getAllRestaurants
);

router.get('/:id', 
  publicApiRateLimit,
  cacheMiddleware(600), 
  restaurantController.getRestaurantById
);

// Middleware to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.use(authMiddleware);

router.post(
  "/register",
  strictRateLimit,
  [
    body("basicInfo.name").notEmpty().withMessage("Restaurant name is required"),
    body("contact.email").isEmail().withMessage("Valid email is required"),
    body("contact.phone").notEmpty().withMessage("Phone number is required"),
    body("address.addressLine1").notEmpty().withMessage("Address is required"),
    body("basicInfo.cuisineType")
      .isArray({ min: 1 })
      .withMessage("At least one cuisine type is required"),
    body("basicInfo.description").notEmpty().withMessage("Description is required"),
  ],
  handleValidation,
  restaurantController.registerRestaurant
);

router.put(
  "/my/restaurant",
  // strictRateLimit,
  [
    body("basicInfo.name").optional().notEmpty().withMessage("Restaurant name cannot be empty"),
    body("contact.email").optional().isEmail().withMessage("Valid email is required"),
    body("contact.phone").optional().notEmpty().withMessage("Phone number cannot be empty"),
  ],
  handleValidation,
  restaurantController.updateMyRestaurant
);

router.get("/my/restaurant", 
  // strictRateLimit,
  restaurantController.getRestaurant
);

router.get("/my/restaurants",
  // strictRateLimit,
  restaurantController.getMyRestaurants
);

module.exports = router;