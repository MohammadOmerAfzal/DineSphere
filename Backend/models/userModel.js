const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  coordinates: { lat: Number, lng: Number },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },

  // 🔹 Google Auth fields
  googleId: { type: String, default: null },
  photo: { type: String },

  // 🔹 Login credentials
  email: { type: String, unique: true, lowercase: true, trim: true, required: true },
  password: {
    type: String,
    required: function () {
      // ✅ Require password only if user is NOT registered via Google
      return !this.googleId;
    },
  },

  // 🔹 Role setup
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'admin', 'rider', 'user'], // added 'user' for OAuth
    default: 'customer',
  },

  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    dateOfBirth: Date,
  },

  addresses: [addressSchema],

  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    dietary: [String],
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
  },

  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  lastLogin: Date,
}, { timestamps: true });

// ✅ Hash password only if it exists and is modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
