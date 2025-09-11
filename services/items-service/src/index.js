require("dotenv").config();
const express = require("express");

// We will add the database connection here later
// const db = require('./models');

const app = express();
app.use(express.json());

// A simple health check route to verify the service is running
app.get("/api/items/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Items service is healthy!",
    });
});

// We will add the real API routes here later
// const itemRoutes = require('./routes/item.routes');
// app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Items service running on port ${PORT}`);
});
