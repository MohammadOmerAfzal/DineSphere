// middlewares/ownerAuthMiddleware.js
const jwt = require("jsonwebtoken");
const { restaurantOwnerRepository } = require("../repository/restaurantOwnerRepository");

const ownerAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is a restaurant owner token
    if (decoded.type !== "restaurant_owner") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type"
      });
    }

    const owner = await restaurantOwnerRepository.findById(decoded.id);
    
    if (!owner || !owner.isActive) {
      return res.status(401).json({
        success: false,
        message: "Owner not found or account inactive"
      });
    }

    req.owner = owner;
    next();
  } catch (error) {
    console.error("Owner Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

module.exports = ownerAuthMiddleware;