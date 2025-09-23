const express = require("express");
const { run: runConsumer } = require("./consumer");

const app = express();

app.get("/api/notifications/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Notifications service is healthy!",
    });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Notifications health check server running on port ${PORT}`);
});

// Start the Kafka consumer
runConsumer().catch(console.error);
