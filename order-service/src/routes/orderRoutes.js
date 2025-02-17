/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API operations for managing orders
 * securitySchemes:
 *   BearerAuth:
 *     type: apiKey
 *     in: header
 *     name: Authorization
 */
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const axios = require("axios");
const Order = require("../models/Order");
const { CATALOG_SERVICE } = require("../../Constants");
const { jwtAuthenticationRequired } = require("../../authMiddleware");
const { logEventMiddleware } = require("../../messaging");
const Stat = require("../models/Stat");

// make a call to catalog service to get book information for the order
const fetchBookInformation = async (bookId) => {
  try {
    const response = await axios.get(`${CATALOG_SERVICE}/books/${bookId}`);
    if (response.status !== 200) {
      throw new Error(`Failed to fetch user information for book ${bookId}`);
    }
    const bookData = JSON.parse(response.data);
    return { status: response.status, data: bookData };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getTotalOrderPrice = async () => {
  try {
    const orders = await Order.find();
    const totalPrice = orders.reduce((total, order) => {
      const orderTotal = parseFloat(order.total);
      if (!isNaN(orderTotal)) {
        return total + orderTotal;
      } else {
        console.warn(
          `Skipping order ${order.orderId} with undefined or non-numeric total`
        );
        return total;
      }
    }, 0);

    console.log("Total Price:", totalPrice);
    return { totalPrice };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const cancelOrderById = async (orderId) => {
  try {
    console.log("Canceling order with ID:", orderId);

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: { status: "Cancelled" } },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error("Order not found for cancellation");
    }

    return updatedOrder;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// middleware for tracking api calls
router.use(async (req, res, next) => {
  const endpoint = req.originalUrl;
  try {
    await Stat.findOneAndUpdate(
      { endpoint },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    console.log("Stats updated for endpoint:", endpoint);
  } catch (err) {
    console.error("Error updating stats:", err);
  }
  next();
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"orderId": "1", ...}]
 */

router.get(
  "/orders",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find();
      res.status(200).json(orders);
      console.log("orders: ", orders);
    } catch (error) {
      console.error(error);
      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Warning",
        "Error"
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: {"orderId": "1", ...}
 *       404:
 *         description: Order not found
 */
router.get(
  "/orders/orderId/:orderId",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const orders = await Order.find({ orderId: orderId });

      if (orders.length === 0) {
        await logEventMiddleware(
          req,
          res,
          (err) => {
            if (err) {
              console.error("Error logging event:", err);
            }
          },
          "Warning",
          "Order not found"
        );

        res.status(404).json({ error: "Order not found" });
        return;
      }

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Info",
        "Incoming request"
      );

      res.status(200).json(orders);
      console.log("Orders:", orders);
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Error",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
router.get(
  "/orders/user/:userId",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const orders = await Order.find({ "customer.userId": userId });

      if (!orders || orders.length === 0) {
        await logEventMiddleware(
          req,
          res,
          (err) => {
            if (err) {
              console.error("Error logging event:", err);
            }
          },
          "Warning",
          "No orders found for the user"
        );

        res.status(404).json({ error: "No orders found for the user" });
        return;
      }

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Info",
        "Incoming request"
      );

      res.status(200).json(orders);
      console.log("Orders for user:", orders);
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Error",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
router.post(
  "/order",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
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

      const orderItems = await Promise.all(
        order.map(async (item) => {
          const bookInfoResponse = await fetchBookInformation(item._id);
          if (bookInfoResponse.status === 200) {
            const bookData = bookInfoResponse.data;
            return {
              _id: item._id,
              name: bookData.name,
              price: bookData.price,
              quantity: item.quantity,
            };
          } else {
            throw new Error(
              `Failed to fetch book information for book ${item._id}`
            );
          }
        })
      );

      if (!orderItems || orderItems.length === 0) {
        await logEventMiddleware(
          req,
          res,
          (err) => {
            if (err) {
              console.error("Error logging event:", err);
            }
          },
          "Warning",
          "No items found in the order"
        );

        res.status(400).json({ error: "No items found in the order" });
        return;
      }

      const orderId = uuid.v4();
      const newOrder = new Order({
        orderId,
        date,
        customer,
        order: orderItems,
        status,
        items: orderItems,
        delivery_address,
        billing_address,
        phone,
        payment,
        total,
      });
      const savedOrder = await newOrder.save();
      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Info",
        "New order created"
      );
      res.status(201).json(savedOrder);
      console.log("New order created:", savedOrder);
    } catch (error) {
      console.error(error);
      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Error",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
router.delete(
  "/orders/orderId/:orderId",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;

      const deletedOrder = await Order.findOneAndDelete({ orderId });

      if (!deletedOrder) {
        await logEventMiddleware(
          req,
          res,
          (err) => {
            if (err) {
              console.error("Error logging event:", err);
            }
          },
          "Warning",
          "Order not found for deletion"
        );

        res.status(404).json({ error: "Order not found for deletion" });
        return;
      }

      res
        .status(200)
        .json({ message: "Order deleted successfully", deletedOrder });
      console.log("Order deleted:", deletedOrder);
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Error",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
router.put(
  "/orders/orderId/:orderId/status",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const newStatus = req.body.status;

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        { $set: { status: newStatus } },
        { new: true }
      );

      if (!updatedOrder) {
        await logEventMiddleware(
          req,
          res,
          (err) => {
            if (err) {
              console.error("Error logging event:", err);
            }
          },
          "Warning",
          "Order not found for status update"
        );

        res.status(404).json({ error: "Order not found for status update" });
        return;
      }

      res.status(200).json(updatedOrder);
      console.log("Order status updated:", updatedOrder);
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Error",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/orders/total-price:
 *   get:
 *     summary: Get the total price of all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: {"totalPrice": 1500}
 *       500:
 *         description: Internal server error
 */
router.get(
  "/orders/total-price",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const totalPrice = await getTotalOrderPrice();
      res.status(200).json(totalPrice);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Info",
        "Successful request for total price"
      );
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Warning",
        "Internal server error"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/orders/orderId/{orderId}/cancel:
 *   put:
 *     summary: Cancel a specific order by order ID
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
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             example: {"orderId": "1", "status": "Cancelled", ...}
 *       404:
 *         description: Order not found for cancellation
 *       500:
 *         description: Internal server error
 */
router.put(
  "/orders/orderId/:orderId/cancel",
  jwtAuthenticationRequired,
  logEventMiddleware,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const cancelledOrder = await cancelOrderById(orderId);

      res.status(200).json(cancelledOrder);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Info",
        "Order cancelled successfully"
      );
    } catch (error) {
      console.error(error);

      await logEventMiddleware(
        req,
        res,
        (err) => {
          if (err) {
            console.error("Error logging event:", err);
          }
        },
        "Warning",
        "Internal server error during order cancellation"
      );

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
