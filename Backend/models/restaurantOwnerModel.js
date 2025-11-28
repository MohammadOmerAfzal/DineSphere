const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema, model } = mongoose;

const RestaurantOwnerSchema = new Schema({
  // Core authentication fields
  email: { 
    type: String, 
    required: true, 
    unique: true, // This automatically creates an index
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },

  // OAuth fields
  googleId: { type: String, default: null },
  photo: { type: String },

  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },

  // Business information
  businessInfo: {
    companyName: String,
    taxId: String,
    businessPhone: String,
    emergencyContact: String
  },

  // Restaurant relationship (can be set later)
  restaurantId: { 
    type: Schema.Types.ObjectId, 
    ref: "Restaurant" 
  },

  // Role and permissions
  role: { 
    type: String, 
    enum: ["owner", "manager", "staff"], 
    default: "owner" 
  },
  permissions: [String],

  // Status and verification
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLogin: Date,

  // Owner-specific preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    orderAlerts: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true }
  }

}, { timestamps: true });

// Password hashing middleware
RestaurantOwnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison method
RestaurantOwnerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// REMOVE ALL MANUAL INDEXES - Let Mongoose handle them automatically
// The 'unique: true' on email field already creates an index

module.exports = model("RestaurantOwner", RestaurantOwnerSchema);