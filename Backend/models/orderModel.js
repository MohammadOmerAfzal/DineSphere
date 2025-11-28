const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  tenantId: { type: Schema.Types.ObjectId, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
    default: "pending"
  },
  type: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  items: [{
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    price: Number,
    quantity: Number,
    customizations: [{
      option: String,
      choice: String,
      price: Number
    }],
    specialInstructions: String,
    subtotal: Number
  }],
  pricing: {
    subtotal: Number,
    deliveryFee: Number,
    taxAmount: Number,
    discountAmount: Number,
    tipAmount: Number,
    total: Number
  },
  deliveryInfo: {
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      coordinates: { lat: Number, lng: Number }
    },
    instructions: String,
    estimatedDelivery: Date
  },
  payment: {
    method: String,
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    transactionId: String,
    paidAt: Date
  },
  timeline: [{
    status: String,
    timestamp: Date,
    notes: String,
    actor: String
  }],
  riderInfo: {
    riderId: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: Date,
    pickupTime: Date,
    deliveryTime: Date
  },
  ratings: {
    restaurant: Number,
    food: Number,
    rider: Number,
    comments: String,
    ratedAt: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    appVersion: String
  }
}, { timestamps: true });

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateString = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `ORD-${dateString}-${random}`;
    
    // Initialize timeline
    this.timeline.push({
      status: 'pending',
      timestamp: new Date(),
      notes: 'Order placed successfully',
      actor: 'system'
    });
  }
  next();
});

module.exports= model("Order", OrderSchema);