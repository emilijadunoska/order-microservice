/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: API operations for managing recommendations
 */
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const axios = require("axios");

const Recommendation = require("../models/Recommendation");
const { CATALOG_SERVICE } = require("../../Constants");

// make a call to catalog service to get books which have 4+ ratings to be marked as 'POPULAR'
const fetchPopularBooks = async () => {
  try {
    const response = await axios.get(`${CATALOG_SERVICE}/catalog`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch popular books");
    }
    const books = JSON.parse(response.data);

    const popularBooks = books.filter((book) => book.rating === 5);

    console.log("Type of popular books:", typeof popularBooks);

    return popularBooks;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const fetchNewArrivalBooks = async () => {
  try {
    const response = await axios.get(`${CATALOG_SERVICE}/catalog`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch new arrival books");
    }

    const books = JSON.parse(response.data);

    const newArrivalBooks = books.filter((book) => {
      const bookDate = new Date(book.availability_date);
      const september2021 = new Date("2021-08-01");
      return bookDate > september2021;
    });

    newArrivalBooks.forEach((book) => {
      console.log(`New Arrival Book ${book._id} has date: ${book.date}`);
    });

    console.log("Type of new arrival books:", typeof newArrivalBooks);

    return newArrivalBooks;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const fetchBooksByCategory = async (category) => {
  try {
    const response = await axios.get(`${CATALOG_SERVICE}/catalog`);
    if (response.status !== 200) {
      throw new Error(`Failed to fetch ${category} books`);
    }

    const books = JSON.parse(response.data);

    const categoryBooks = books.filter(
      (book) => book.category.toLowerCase() === category.toLowerCase()
    );

    categoryBooks.forEach((book) => {
      console.log(
        `${category} Book ${book._id} has category: ${book.category}`
      );
    });

    console.log(`Type of ${category} books:`, typeof categoryBooks);

    return categoryBooks;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * @swagger
 * /api/recommendations/user/{userId}:
 *   get:
 *     summary: Get recommendations for a user by user ID
 *     tags: [Recommendations]
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
 *             example: [{"recommendationId": "1", ...}]
 *       404:
 *         description: No recommendations found for the user
 */

router.get("/recommendations/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const recommendations = await Recommendation.find({ userId });

    if (!recommendations || recommendations.length === 0) {
      res.status(404).json({ error: "No recommendations found for the user" });
      return;
    }

    const bookIds = recommendations.map(
      (recommendation) => recommendation.bookId
    );

    const books = await Promise.all(
      bookIds.map(async (bookId) => {
        try {
          const bookResponse = await axios.get(
            `${CATALOG_SERVICE}/books/${bookId}`
          );
          return bookResponse.data;
        } catch (error) {
          console.error("Error fetching book details:", error.message);
          return null;
        }
      })
    );

    const availableBooks = books
      .filter((book) => book !== null)
      .map((book) => JSON.parse(book));

    if (availableBooks.length === 0) {
      res.status(404).json({ error: "No books found for recommendations" });
      return;
    }

    const category = availableBooks[0].category;

    if (!category) {
      res.status(500).json({ error: "Category not found for the book" });
      return;
    }

    const categoryBooks = await fetchBooksByCategory(category);

    res.status(200).json({ recommendations, categoryBooks });
    console.log(
      "Recommendations and Category Books for user:",
      recommendations,
      categoryBooks
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations/popular:
 *   get:
 *     summary: Get popular recommendations
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"recommendationId": "1", ...}]
 *       404:
 *         description: No popular recommendations found
 */
router.get("/recommendations/popular", async (req, res) => {
  try {
    const highRatedBooks = await fetchPopularBooks();

    if (!highRatedBooks || highRatedBooks.length === 0) {
      res.status(404).json({ error: "No popular recommendations found" });
      return;
    }

    res.status(200).json(highRatedBooks);
    console.log("Popular recommendations:", highRatedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations/new-arrivals:
 *   get:
 *     summary: Get new arrivals recommendations
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"recommendationId": "1", ...}]
 *       404:
 *         description: No new arrivals recommendations found
 */
router.get("/recommendations/new-arrivals", async (req, res) => {
  try {
    const newArrivalBooks = await fetchNewArrivalBooks();

    if (!newArrivalBooks || newArrivalBooks.length === 0) {
      res.status(404).json({ error: "No new arrivals recommendations found" });
      return;
    }

    res.status(200).json(newArrivalBooks);
    console.log("New arrivals recommendations:", newArrivalBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations/fiction:
 *   get:
 *     summary: Get fiction book recommendations
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"recommendationId": "1", ...}]
 *       404:
 *         description: No fiction book recommendations found
 */
router.get("/recommendations/fiction", async (req, res) => {
  try {
    const fictionBooks = await fetchBooksByCategory("fiction");

    if (!fictionBooks || fictionBooks.length === 0) {
      res.status(404).json({ error: "No fiction book recommendations found" });
      return;
    }

    res.status(200).json(fictionBooks);
    console.log("Fiction book recommendations:", fictionBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations/non-fiction:
 *   get:
 *     summary: Get non-fiction book recommendations
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example: [{"recommendationId": "1", ...}]
 *       404:
 *         description: No non-fiction book recommendations found
 */
router.get("/recommendations/non-fiction", async (req, res) => {
  try {
    const nonFictionBooks = await fetchBooksByCategory("non-fiction");

    if (!nonFictionBooks || nonFictionBooks.length === 0) {
      res
        .status(404)
        .json({ error: "No non-fiction book recommendations found" });
      return;
    }

    res.status(200).json(nonFictionBooks);
    console.log("Non-fiction book recommendations:", nonFictionBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations:
 *   post:
 *     summary: Create a new recommendation
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { "userId": "1", "bookId": "2", "type": "popular" }
 *     responses:
 *       201:
 *         description: Recommendation created successfully
 *         content:
 *           application/json:
 *             example: {"recommendationId": "1", ...}
 *       500:
 *         description: Internal server error
 */
router.post("/recommendations", async (req, res) => {
  try {
    const { userId, bookId, type } = req.body;

    const recommendationId = uuid.v4();
    const newRecommendation = new Recommendation({
      recommendationId,
      userId,
      bookId,
      type,
      dateCreated: new Date(),
    });

    const savedRecommendation = await newRecommendation.save();
    res.status(201).json(savedRecommendation);
    console.log("New recommendation created:", savedRecommendation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
/**
 * @swagger
 * /api/recommendations/{userId}:
 *   delete:
 *     summary: Delete recommendations by user ID
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendations deleted successfully
 *         content:
 *           application/json:
 *             example: {"message": "Recommendations deleted successfully", "deletedRecommendations": [{"recommendationId": "1", ...}]}
 *       404:
 *         description: Recommendations not found for deletion
 */
router.delete("/recommendations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const deletedRecommendations = await Recommendation.deleteMany({
      "user.userId": userId,
    });

    if (deletedRecommendations.deletedCount === 0) {
      res.status(404).json({ error: "Recommendations not found for deletion" });
      return;
    }

    res.status(200).json({
      message: "Recommendations deleted successfully",
      deletedRecommendations,
    });
    console.log("Recommendations deleted:", deletedRecommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/recommendations/{recommendationId}/type:
 *   put:
 *     summary: Update the type of a specific recommendation by recommendation ID
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         description: ID of the recommendation
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { "type": "new-arrival" }
 *     responses:
 *       200:
 *         description: Recommendation type updated successfully
 *         content:
 *           application/json:
 *             example: {"recommendationId": "1", ...}
 *       404:
 *         description: Recommendation not found for type update
 */
router.put("/recommendations/:recommendationId/type", async (req, res) => {
  try {
    const recommendationId = req.params.recommendationId;
    const newType = req.body.type;

    const updatedRecommendation = await Recommendation.findOneAndUpdate(
      { recommendationId },
      { $set: { type: newType } },
      { new: true }
    );

    if (!updatedRecommendation) {
      res
        .status(404)
        .json({ error: "Recommendation not found for type update" });
      return;
    }

    res.status(200).json(updatedRecommendation);
    console.log("Recommendation type updated:", updatedRecommendation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
