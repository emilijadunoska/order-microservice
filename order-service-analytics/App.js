const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const statsRoutes = require("./routes/statsRoutes");
const { specs, swaggerUi } = require("./swagger");

const app = express();
const port = 11157;

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api", statsRoutes);

connectDB();

app.get("/", async (req, res) => {
  res.send(`Hello, this is your analytics for the order service.`);
});

app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
