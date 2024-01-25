const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const statsRoutes = require("./routes/statsRoutes");
const { specs, swaggerUi } = require("./swagger");

const app = express();
const port = 11159;

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
    res.send(`Hello, from recommendation analytics service.`);
});

app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`);
});
