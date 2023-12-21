const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const messaging = require("./messaging");
const uuid = require("uuid");

const { specs, swaggerUi } = require("./swagger");

const app = express();
const port = process.env.port || 11154;

const corsOptions = {
  origin: "*",
  credentials: true,
};

messaging.setupRabbitMQ(
  process.env.RABBITMQ_URL,
  process.env.RABBITMQ_EXCHANGE,
  process.env.RABBITMQ_QUEUE
);

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

connectDB();

const recommendationRoutes = require("./src/routes/recommendationRoutes");
app.use("/api", recommendationRoutes);

app.get("/", async (req, res) => {
  const correlationId = req.correlationId;
  messaging.logEvent("Info", "Request to the root endpoint.", req);
  res.send(
    `Hello, this is your recommendation service! Correlation ID: ${correlationId}`
  );
});

app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
