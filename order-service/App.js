const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();
const port = 5000;

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/doc", express.static(__dirname + "/doc"));

connectDB();

const orderRoutes = require("./src/routes/orderRoutes");
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.send("Hello, this is your order service! ");
});

app.listen(port, () => {
  console.log("Server is running on http://localhost:${port}");
});
