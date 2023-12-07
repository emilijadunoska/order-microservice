const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      "mongodb+srv://admin:admin@order-service-cluster.rmdhsxv.mongodb.net/recommendation-service";

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB database connection established successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = connectDB;
