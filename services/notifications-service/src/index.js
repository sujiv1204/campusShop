const express = require("express");
const cors = require("cors");
const { startConsumer } = require("./consumer");
const db = require("./models"); // <-- Import the database
const connectMongoDB = require("./config/mongodb");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/notifications", notificationsRoutes);

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
        // 1. Connect to PostgreSQL (for ProcessedEvents idempotency)
        await db.sequelize.authenticate();
        console.log("✅ PostgreSQL database connection established");

        // 2. Connect to MongoDB (for Notification logs)
        await connectMongoDB();

        // 3. Start the HTTP server
        app.listen(PORT, () => {
            console.log(
                `🚀 Notifications HTTP server running on port ${PORT}`
            );
            console.log(`📋 API endpoints available at http://localhost:${PORT}/api/notifications`);
        });

        // 4. Start the Kafka consumer
        startConsumer();
    } catch (err) {
        console.error("Failed to start notifications service:", err);
        process.exit(1);
    }
};

startService();
