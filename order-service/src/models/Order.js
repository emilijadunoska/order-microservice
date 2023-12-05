const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderId: { type: String, required: true, unique: true, primaryKey: true },
  customer: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  delivery_address: {
    street: { type: String, required: true },
    suite: { type: String },
    city: { type: String, required: true },
    zipcode: { type: String, required: true },
  },
  billing_address: {
    street: { type: String, required: true },
    suite: { type: String },
    city: { type: String, required: true },
    zipcode: { type: String, required: true },
  },
  phone: { type: String, required: true },
  status: { type: String, required: true },
  order: [
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  payment: { type: String, required: true },
  date: { type: Date, required: true },
  total: { type: Number, required: true },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
