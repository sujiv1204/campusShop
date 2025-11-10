require("dotenv").config();
const express = require("express");
const db = require("./models");
const bidRoutes = require("./routes/bid.routes");
const { connectProducer } = require("./lib/kafka");
const { startPolling } = require("./poller");
const { register, metricsMiddleware } = require("./middleware/metrics");
const app = express();
app.use(express.json());
app.use(metricsMiddleware);

app.get("/api/bids/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Bidding service is healthy!",
    });
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.use("/api/bids", bidRoutes);

const PORT = process.env.PORT || 5003;

const startServer = async () => {
    try {
        // 1. Connect to the database
        await db.sequelize.authenticate();
        console.log("Bidding database connection established.");

        // 2. Wait for the initial Kafka connection
        await connectProducer();

        // 3. Start the server
        app.listen(PORT, () => {
            console.log(`Bidding service running on port ${PORT}`);
        });

        // 4. Start the outbox poller
        startPolling();
        console.log("Outbox poller started.");
    } catch (err) {
        console.error("Failed to start server. Retrying in 5 seconds...", err);
        setTimeout(startServer, 5000);
    }
};

startServer();
