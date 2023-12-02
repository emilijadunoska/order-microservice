const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri =
      "mongodb+srv://admin:admin@order-service-cluster.rmdhsxv.mongodb.net/ordersdb";

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
