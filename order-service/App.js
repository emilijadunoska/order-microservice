const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const { specs, swaggerUi } = require("./swagger");

const app = express();
const port = 5000;

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

connectDB();

const orderRoutes = require("./src/routes/orderRoutes");
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.send("Hello, this is your order service! ");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:${port}");
});
