const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
// Remove session-related imports since we're using JWT
const { connectKafka } = require("./config/kafka");
const metricsConsumer = require("./services/metricsConsumer");
const { initSocket } = require("./config/socket");

const authRoutes = require("./routes/authRoutes.js");
const connectDB  = require("./config/db.js");
const passport = require("passport");
const restaurantRoutes = require("./routes/restaurantRoutes.js");
require("./config/passport.js"); 
const orderRoutes = require('./routes/orderRoutes.js');
const metricsRoutes = require('./routes/metricsRoutes.js');
const ownerAuthRoutes = require("./routes/restaurantOwnerAuthRoutes");

const app = express();

connectDB();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL, 
  credentials: true 
}));
app.use(express.json());
app.use(mongoSanitize());

// ✅ Remove session middleware since we're using JWT
// Only initialize passport (no sessions needed)
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/metrics', metricsRoutes); 
app.use("/api/owner/auth", ownerAuthRoutes);

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize Kafka
  await connectKafka();
  
  // Start metrics consumer
  await metricsConsumer.start();
  
  // Initialize Socket.IO
  initSocket(server);
});

module.exports = app;