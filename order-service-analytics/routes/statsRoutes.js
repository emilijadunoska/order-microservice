/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: API operations for analytics
 */

const express = require("express");
const router = express.Router();
const Stat = require("../models/Stat");

/**
 * @swagger
 * /last-called-endpoint:
 *   get:
 *     summary: Get the last called endpoint
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: {"lastCalledEndpoint": "/api/orders"}
 */
router.get("/last-called-endpoint", async (req, res) => {
  try {
    const lastStat = await Stat.findOne().sort({ _id: -1 });
    res.status(200).json({ lastCalledEndpoint: lastStat.endpoint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /most-frequently-called-endpoint:
 *   get:
 *     summary: Get the most frequently called endpoint
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: {"mostFrequentlyCalledEndpoint": "/api/orders"}
 */
router.get("/most-frequently-called-endpoint", async (req, res) => {
  try {
    const mostFrequentStat = await Stat.findOne().sort({ count: -1 });
    res
      .status(200)
      .json({ mostFrequentlyCalledEndpoint: mostFrequentStat.endpoint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /individual-calls:
 *   get:
 *     summary: Get the number of individual calls to each endpoint
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"endpoint": "/api/orders", "count": 5}]
 */
router.get("/individual-calls", async (req, res) => {
  try {
    const individualCallsStats = await Stat.aggregate([
      {
        $group: {
          _id: "$endpoint",
          count: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          endpoint: "$_id",
          count: 1,
        },
      },
    ]);

    res.status(200).json(individualCallsStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /update-data:
 *   post:
 *     summary: Update data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: {"calledService": "/api/orders"}
 *     responses:
 *       200:
 *         description: Data updated successfully
 *         content:
 *           application/json:
 *             example: {"message": "Data updated successfully"}
 *       500:
 *         description: Internal server error
 */
router.post("/update-data", async (req, res) => {
  try {
    const { calledService } = req.body;

    await Stat.create({ endpoint: calledService, count: 1 });

    res.status(200).json({ message: "Data updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
