const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

const orderRoutes = require("./src/routes/orderRoutes");
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.send("Hello, this is your order service! ");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:${port}");
});
