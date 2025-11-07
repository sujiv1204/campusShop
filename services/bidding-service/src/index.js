require("dotenv").config();
const express = require("express");
const db = require("./models");
const bidRoutes = require("./routes/bid.routes");
const { connectProducer } = require("./lib/kafka");
const app = express();
app.use(express.json());

app.get("/api/bids/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Bidding service is healthy!",
    });
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
