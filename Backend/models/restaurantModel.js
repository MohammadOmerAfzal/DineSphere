const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const BusinessHourSchema = new Schema({
  day: { type: Number, min: 0, max: 6 }, // 0 = Sunday
  openingTime: String,
  closingTime: String,
  isOpen: { type: Boolean, default: true }
});

const RestaurantSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  basicInfo: {
    name: { type: String, required: true },
    description: String,
    cuisineType: [String],
    logo: String,
    bannerImages: [String],
    tags: [String]
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  businessHours: [BusinessHourSchema],
  menuItems: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    image: String
  }],
  settings: {
    deliveryFee: Number,
    minimumOrder: Number,
    preparationTime: Number,
    deliveryRadius: Number,
    isActive: { type: Boolean, default: true },
    isAcceptingOrders: { type: Boolean, default: true },
    paymentMethods: [String]
  },
  statistics: {
    totalOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    completionRate: { type: Number, default: 100 }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    documents: [{
      docType: String,
      url: String,
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" }
    }],
    verifiedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Restaurant", RestaurantSchema);