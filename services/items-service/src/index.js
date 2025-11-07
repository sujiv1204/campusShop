require("dotenv").config();
const express = require("express");
const db = require("./models");
const { connectProducer } = require("./lib/kafka");
const { startPolling } = require("./poller");
const itemRoutes = require("./routes/item.routes"); // Make sure you have this file

const app = express();
app.use(express.json());

// Health check route
app.get("/api/items/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Items service is healthy!",
    });
});

// Main application routes
app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5002;

// Resilient startup function
const startServer = async () => {
    try {
        // 1. Connect to the database
        await db.sequelize.authenticate();
        console.log("Items database connection established.");

        // 2. Connect the Kafka producer
        await connectProducer();

        // 3. Start the Express server
        app.listen(PORT, () => {
            console.log(`Items service running on port ${PORT}`);
        });

        // 4. Start the outbox poller
        startPolling();
    } catch (err) {
        console.error(
            "Failed to start items-service. Retrying in 5 seconds...",
            err
        );
        setTimeout(startServer, 5000);
    }
};

startServer();
