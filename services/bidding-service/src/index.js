require("dotenv").config();
const express = require("express");
const db = require("./models");
const bidRoutes = require("./routes/bid.routes");

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

db.sequelize
    .authenticate()
    .then(() => {
        console.log("Bidding database connection established successfully.");
        app.listen(PORT, () => {
            console.log(`Bidding service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to the bidding database:", err);
    });
