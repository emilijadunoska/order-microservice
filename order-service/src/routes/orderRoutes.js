const express = require("express");
const router = express.Router();
const uuid = require("uuid");

const Order = require("../models/Order");

// get all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
    console.log("orders: ", orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get order by id
router.get("/orders/orderId/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.find({ orderId: orderId });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.status(200).json(order);
    console.log("Order:", order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get order by user id
router.get("/orders/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const orders = await Order.find({ "customer.userId": userId });

    if (!orders || orders.length === 0) {
      res.status(404).json({ error: "No orders found for the user" });
      return;
    }

    res.status(200).json(orders);
    console.log("Orders for user:", orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//create an order
router.post("/order", async (req, res) => {
  try {
    const {
      date,
      customer,
      order,
      status,
      items,
      delivery_address,
      billing_address,
      phone,
      payment,
      total,
    } = req.body;

    const orderId = uuid.v4();

    const newOrder = new Order({
      orderId,
      date,
      customer,
      order,
      status,
      items,
      delivery_address,
      billing_address,
      phone,
      payment,
      total,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
    console.log("New order created:", savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// delete an order by order id
router.delete("/orders/orderId/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const deletedOrder = await Order.findOneAndDelete({ orderId });

    if (!deletedOrder) {
      res.status(404).json({ error: "Order not found for deletion" });
      return;
    }

    res
      .status(200)
      .json({ message: "Order deleted successfully", deletedOrder });
    console.log("Order deleted:", deletedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update the status of a specific order by order id
router.put("/orders/orderId/:orderId/status", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: { status: newStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      res.status(404).json({ error: "Order not found for status update" });
      return;
    }

    res.status(200).json(updatedOrder);
    console.log("Order status updated:", updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
