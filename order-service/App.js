const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const orderRoutes = require("./src/routes/orderRoutes");
const { specs, swaggerUi } = require("./swagger");
const uuid = require("uuid");
const messaging = require("./messaging");

const app = express();
const port = 11150;
const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(async (req, res, next) => {
  const correlationId = generateCorrelationId();

  req.correlationId = correlationId;

  await messaging.logEvent(
    "Info",
    req.originalUrl,
    correlationId,
    "Order service",
    "Incoming request"
  );

  next();
});

messaging.setupRabbitMQ(
  "amqp://student:student123@studentdocker.informatika.uni-mb.si:5672",
  "rv1_sipia_4",
  "rv1_sipia_4"
);

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api", orderRoutes);

connectDB();

function generateCorrelationId() {
  return uuid.v4();
}

app.post("/send-message", async (req, res) => {
  try {
    const message = req.body.message;

    await messaging.logEvent(
      "Info",
      "/send-message",
      req.correlationId,
      "Order service",
      "Sending message"
    );

    await messaging.sendMessageToRabbitMQ(message);

    res
      .status(200)
      .json({ success: true, message: "Message sent to RabbitMQ" });
  } catch (error) {
    console.error("Error handling send-message route:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/receive-message", async (req, res) => {
  try {
    await messaging.logEvent(
      "Info",
      "/receive-message",
      req.correlationId,
      "Order service",
      "Receiving message"
    );

    const message = await messaging.getMessageFromRabbitMQ();
    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error handling receive-message route:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/", async (req, res) => {
  const correlationId = req.correlationId;
  logEvent("Info", "Request to the root endpoint.", req);
  res.send(
    `Hello, this is your order service! Correlation ID: ${correlationId}`
  );
});

app.get("/receive-all-messages", async (req, res) => {
  try {
    await messaging.logEvent(
      "Info",
      "/receive-all-messages",
      req.correlationId,
      "Order service",
      "Receiving all messages"
    );

    const messages = await messaging.getAllMessagesFromRabbitMQ();
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error handling receive-all-messages route:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
