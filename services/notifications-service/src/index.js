const express = require("express");
const { startConsumer } = require("./consumer");
const db = require("./models"); // <-- Import the database

const app = express();

app.get("/api/notifications/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Notifications service is healthy!",
    });
});

const PORT = process.env.PORT || 5004;

// Wrap startup in an async function to ensure DB connects first
const startService = async () => {
    try {
        // 1. Connect to the database
        await db.sequelize.authenticate();
        console.log("Notifications database connection established.");

        // 2. Start the HTTP server
        app.listen(PORT, () => {
            console.log(
                `Notifications health check server running on port ${PORT}`
            );
        });

        // 3. Start the Kafka consumer
        startConsumer();
    } catch (err) {
        console.error("Failed to start notifications service:", err);
        process.exit(1);
    }
};

startService();
