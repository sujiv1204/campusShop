require("dotenv").config();
const express = require("express");
const db = require("./models");
const itemRoutes = require("./routes/item.routes");
const { connectProducer } = require("./lib/kafka");
const app = express();
app.use(express.json());

app.get("/api/items/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Items service is healthy!",
    });
});

// Use the item routes for any request to /api/items
app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5002;

// Connect to the database and then start the server
const startServer = async () => {
    try {
        // 1. Connect to the database
        await db.sequelize.authenticate();
        console.log("Bidding database connection established.");

        // 2. Wait for the initial Kafka connection
        await connectProducer();

        // 3. Only now, start the server
        app.listen(PORT, () => {
            console.log(`Bidding service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server. Retrying in 5 seconds...", err);
        setTimeout(startServer, 5000);
    }
};

startServer();
