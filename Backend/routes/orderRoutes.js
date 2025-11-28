const express = require("express");
const{ body, validationResult } =require("express-validator");
const {orderController} =require("../controllers/orderController.js");
const authMiddleware =require ("../middlewares/authMiddleware.js");

const router = express.Router();

// Middleware to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/orders - Create new order
router.post(
  "/",
  [
    body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("deliveryInfo.address.addressLine1").notEmpty().withMessage("Address is required"),
    body("deliveryInfo.address.city").notEmpty().withMessage("City is required"),
    body("payment.method").notEmpty().withMessage("Payment method is required")
  ],
  handleValidation,
  orderController.createOrder
);

// GET /api/orders/customer - Get customer orders
router.get("/customer", orderController.getCustomerOrders);

// GET /api/orders/restaurant/:restaurantId - Get restaurant orders
router.get("/restaurant/:restaurantId", orderController.getRestaurantOrders);

// GET /api/orders/status/:status - Get orders by status
router.get("/status/:status", orderController.getOrdersByStatus);

// GET /api/orders/today/:restaurantId - Get today's orders for restaurant
router.get("/today/:restaurantId", orderController.getTodaysOrders);

// GET /api/orders/stats/:restaurantId - Get order statistics
router.get("/stats/:restaurantId", orderController.getOrderStats);

// GET /api/orders/:id - Get order by ID
router.get("/:id", orderController.getOrderById);

// GET /api/orders/number/:orderNumber - Get order by order number
router.get("/number/:orderNumber", orderController.getOrderByNumber);

// PUT /api/orders/:id/status - Update order status
router.put(
  "/:id/status",
  [
    body("status").notEmpty().withMessage("Status is required")
  ],
  handleValidation,
  orderController.updateOrderStatus
);

// PUT /api/orders/:id/rider - Assign rider to order
router.put(
  "/:id/rider",
  [
    body("riderId").notEmpty().withMessage("Rider ID is required")
  ],
  handleValidation,
  orderController.assignRider
);

// PUT /api/orders/:id/payment - Update payment status
router.put(
  "/:id/payment",
  [
    body("paymentStatus").notEmpty().withMessage("Payment status is required")
  ],
  handleValidation,
  orderController.updatePaymentStatus
);

// PUT /api/orders/:id/cancel - Cancel order
router.put("/:id/cancel", orderController.cancelOrder);

module.exports=router;