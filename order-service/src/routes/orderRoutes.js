/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API operations for managing orders
 */
const express = require("express");
const router = express.Router();
const uuid = require("uuid");

const Order = require("../models/Order");

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"orderId": "1", ...}]
 */
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

/**
 * @swagger
 * /api/orders/orderId/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID of the order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: {"orderId": "1", ...}
 *       404:
 *         description: Order not found
 */
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

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"orderId": "1", ...}]
 *       404:
 *         description: No orders found for the user
 */
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

/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { "date": "2023-12-01", ... }
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             example: {"orderId": "1", ...}
 *       500:
 *         description: Internal server error
 */

// create an order
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

/**
 * @swagger
 * /api/orders/orderId/{orderId}:
 *   delete:
 *     summary: Delete an order by order ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID of the order
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             example: {"message": "Order deleted successfully", "deletedOrder": {"orderId": "1", ...}}
 *       404:
 *         description: Order not found for deletion
 */
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

/**
 * @swagger
 * /api/orders/orderId/{orderId}/status:
 *   put:
 *     summary: Update the status of a specific order by order ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID of the order
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { "status": "Shipped" }
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             example: {"orderId": "1", ...}
 *       404:
 *         description: Order not found for status update
 */
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
