import mongoose from "mongoose";
const { Schema, model } = mongoose;

const OrderEventSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  eventType: String,
  eventData: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  source: String
});

export default model("OrderEvent", OrderEventSchema);
