require("dotenv").config();
const express = require("express");
const db = require("./models");
const itemRoutes = require("./routes/item.routes");

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
db.sequelize
    .authenticate()
    .then(() => {
        console.log("Items database connection established successfully.");
        app.listen(PORT, () => {
            console.log(`Items service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Unable to connect to the items database:", err);
    });
